import logging
import os
import shutil
import tempfile
from typing import NamedTuple

import numpy as np
import tensorflowjs as tfjs
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from tensorflow.keras.callbacks import Callback, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.utils import set_random_seed, to_categorical

from tfjs_export import (
    patch_model_json,
    replace_directory,
    sha256_file,
    weight_shard_paths,
)
from utils import (
    DYNAMIC_FEATURES_COUNT,
    FEATURES_SCHEMA_DYNAMIC,
    FEATURES_SCHEMA_STATIC,
    FIXED_SEQUENCE_LENGTH,
    STATIC_FEATURES_COUNT,
    augmentable_mask,
    build_dynamic_sequence,
    frame_dropout_sequence,
    mirror_sequence_258,
    public_model_json_path,
    resample_sequence,
    select_pose_landmarks,
    time_warp_sequence,
)
from validation import (
    TrainingCancelledError,
    assert_dataset_ready,
    compute_class_weights,
    normalize_training_payload,
    resolve_split_plan,
    resolve_validation_plan,
    validate_training_samples,
)

logger = logging.getLogger(__name__)

EPOCHS = 120
LEARNING_RATE = 1e-3
MIN_LEARNING_RATE = 1e-5
EARLY_STOP_PATIENCE = 15
# Antes de cortar se baja el learning rate un par de veces: con datasets chicos
# la val_loss se estanca en mesetas que un paso más fino todavía mejora.
LR_PLATEAU_PATIENCE = 5
LR_PLATEAU_FACTOR = 0.5
RANDOM_STATE = 42
# Por debajo de esto el accuracy de test es ruido, no una medida.
MIN_RELIABLE_TEST_SAMPLES = 10
# Frames que se toman de cada grabación estática para entrenar.
STATIC_FRAMES_PER_RECORDING = 5
# Fracción central de la grabación de la que se muestrean esos frames.
STATIC_SAMPLE_WINDOW = 0.6
# El fit corre sin TTY: verbose=1 escupiría una barra de progreso por época.
FIT_VERBOSITY = 2


class ProgressCallback(Callback):
    def __init__(self, on_progress_fn=None, stop_event=None):
        super().__init__()
        self.on_progress_fn = on_progress_fn
        self.stop_event = stop_event
        self.last_reported = -1
        self.last_accuracy = 0.0
        self.cancelled = False

    def on_epoch_end(self, epoch, logs=None):
        total_epochs = self.params.get('epochs', EPOCHS) or EPOCHS
        percent = int(((epoch + 1) / total_epochs) * 100)
        accuracy = float((logs or {}).get('categorical_accuracy', 0))
        self.last_accuracy = accuracy

        if percent >= self.last_reported + 1 or percent == 100:
            if self.on_progress_fn:
                self.on_progress_fn(percent, accuracy)
            self.last_reported = percent

        if self.stop_event and self.stop_event.is_set():
            self.cancelled = True
            self.model.stop_training = True

    def on_train_end(self, logs=None):
        if self.cancelled:
            return
        if self.on_progress_fn and self.last_reported < 100:
            self.on_progress_fn(100, self.last_accuracy)
            self.last_reported = 100

    def raise_if_cancelled(self):
        if self.cancelled:
            raise TrainingCancelledError("Entrenamiento cancelado por el sistema")


class RecordingSplit(NamedTuple):
    train: np.ndarray
    val: np.ndarray
    test: np.ndarray
    # True cuando el dataset no alcanzó para apartar validación: el early
    # stopping mira el mismo set que después se reporta.
    val_is_test: bool


def split_recordings(y_indices) -> RecordingSplit:
    """Split por grabación en train / validación / test.

    El test se aparta primero y solo se usa para reportar. La validación sale
    de lo que queda y es la que mira el early stopping. Si el dataset es
    demasiado chico para tres partes, la validación cae al test (y el caller
    lo advierte), en vez de quitarle a alguna seña su única toma de train.
    """
    labels = np.asarray(y_indices)
    indices = np.arange(len(labels))
    plan = resolve_split_plan(labels)
    idx_train, idx_test = train_test_split(
        indices,
        test_size=plan.test_count,
        random_state=RANDOM_STATE,
        stratify=labels if plan.stratify else None,
    )
    if len(idx_train) == 0 or len(idx_test) == 0:
        raise ValueError(f"Split inválido: train={len(idx_train)}, test={len(idx_test)}")

    val_plan = resolve_validation_plan(labels[idx_train])
    if val_plan is None:
        return RecordingSplit(idx_train, idx_test, idx_test, True)

    idx_fit, idx_val = train_test_split(
        idx_train,
        test_size=val_plan.test_count,
        random_state=RANDOM_STATE,
        stratify=labels[idx_train],
    )
    return RecordingSplit(idx_fit, idx_val, idx_test, False)


def build_early_stopping():
    return EarlyStopping(
        monitor='val_loss',
        patience=EARLY_STOP_PATIENCE,
        restore_best_weights=True,
    )


def build_lr_schedule():
    return ReduceLROnPlateau(
        monitor='val_loss',
        factor=LR_PLATEAU_FACTOR,
        patience=LR_PLATEAU_PATIENCE,
        min_lr=MIN_LEARNING_RATE,
        verbose=0,
    )


def _jitter(values: np.ndarray, noise_std: float, scale_range: tuple) -> np.ndarray:
    """Escala + ruido gaussiano solo sobre coordenadas realmente presentes."""
    out = np.array(values, dtype=np.float64, copy=True)
    mask = augmentable_mask(out)
    noise = np.random.normal(0, noise_std, out.shape)
    scale = np.random.uniform(*scale_range)
    out[mask] = out[mask] * scale + noise[mask]
    return out


def augment_frame(frame: np.ndarray, noise_std: float = 0.005, scale_range: tuple = (0.92, 1.08)) -> np.ndarray:
    return _jitter(frame, noise_std, scale_range)


def augment_sequence(seq: np.ndarray, noise_std: float = 0.005, scale_range: tuple = (0.92, 1.08)) -> np.ndarray:
    """Espera la secuencia recortada (202D), antes de derivar deltas."""
    return _jitter(seq, noise_std, scale_range)


def _fit(model, X_train, y_train, X_val, y_val, class_weight, on_progress_fn, stop_event):
    prog_cb = ProgressCallback(on_progress_fn=on_progress_fn, stop_event=stop_event)
    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=32,
        validation_data=(X_val, y_val),
        callbacks=[prog_cb, build_early_stopping(), build_lr_schedule()],
        class_weight=class_weight,
        verbose=FIT_VERBOSITY,
    )
    prog_cb.raise_if_cancelled()
    return history


def _history_to_json(history) -> dict:
    """Keras puede dejar np.float32 en el history (p. ej. learning_rate)."""
    return {
        key: [float(value) for value in values]
        for key, values in history.history.items()
    }


def build_training_info(history_json: dict, split: RecordingSplit) -> dict:
    epochs_run = len(history_json.get('loss', []))
    val_losses = history_json.get('val_loss', [])
    best_epoch = int(np.argmin(val_losses)) + 1 if val_losses else epochs_run
    learning_rates = history_json.get('learning_rate') or [LEARNING_RATE]
    return {
        'epochsRun': epochs_run,
        'maxEpochs': EPOCHS,
        'bestEpoch': best_epoch,
        'stoppedEarly': epochs_run < EPOCHS,
        'finalLearningRate': float(learning_rates[-1]),
        'trainRecordings': int(len(split.train)),
        'validationRecordings': int(len(split.val)),
        'testRecordings': int(len(split.test)),
        'validationIsTestSet': bool(split.val_is_test),
    }


def training_warnings(training_info: dict) -> list[str]:
    warnings = []
    if training_info['validationIsTestSet']:
        warnings.append(
            "Dataset chico: no alcanzó para separar validación y test, así que "
            "el early stopping usó el mismo set que se reporta y el accuracy es "
            "optimista. Con 4 o más grabaciones por seña se separan."
        )
    if not training_info['stoppedEarly']:
        warnings.append(
            f"El entrenamiento llegó al máximo de {training_info['maxEpochs']} "
            "épocas sin que la validación dejara de mejorar: el modelo puede "
            "estar sub-entrenado."
        )
    return warnings


def build_evaluation_metrics(model, X_test, y_test, actions):
    """Accuracy + confusion matrix + per-class recall + warnings (no hard-block)."""
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    y_true = np.argmax(y_test, axis=1)
    y_prob = model.predict(X_test, verbose=0)
    y_pred = np.argmax(y_prob, axis=1)

    labels_idx = list(range(len(actions)))
    cm = confusion_matrix(y_true, y_pred, labels=labels_idx)
    report = classification_report(
        y_true,
        y_pred,
        labels=labels_idx,
        target_names=actions,
        output_dict=True,
        zero_division=0,
    )

    per_class = {}
    warnings = []
    for action in actions:
        metrics = report.get(action, {})
        recall = float(metrics.get('recall', 0))
        precision = float(metrics.get('precision', 0))
        support = int(metrics.get('support', 0))
        per_class[action] = {
            'precision': precision,
            'recall': recall,
            'f1': float(metrics.get('f1-score', 0)),
            'support': support,
        }
        if support > 0 and recall <= 0:
            warnings.append(
                f"Clase '{action}' con recall 0 en test — revisar grabaciones."
            )

    test_sample_count = int(len(y_true))
    if test_sample_count < MIN_RELIABLE_TEST_SAMPLES:
        warnings.append(
            f"Solo {test_sample_count} muestras de test: el accuracy "
            f"({accuracy:.0%}) no es una medida confiable. Agrega más "
            f"grabaciones por seña."
        )

    return {
        'loss': float(loss),
        'accuracy': float(accuracy),
        'confusionMatrix': cm.tolist(),
        'classMetrics': per_class,
        'warnings': warnings,
        'testSampleCount': test_sample_count,
    }


def export_tfjs_atomically(model, output_dir, input_shape):
    """Exporta a una carpeta temporal hermana y la cambia por ``output_dir``.

    Si el export falla o se reentrena sobre el mismo ``outputPath``, la carpeta
    final nunca queda a medias ni con shards ``.bin`` de un modelo anterior.
    Devuelve los shards declarados en el ``weightsManifest``.
    """
    output_dir = os.path.abspath(output_dir)
    parent = os.path.dirname(output_dir)
    os.makedirs(parent, exist_ok=True)
    staging = tempfile.mkdtemp(prefix=f'.{os.path.basename(output_dir)}.tmp-', dir=parent)
    try:
        # mkdtemp crea 0700; el backend y quien sirva /shared/models leen con
        # otro uid, igual que con el makedirs de antes.
        os.chmod(staging, 0o755)
        tfjs.converters.save_keras_model(model, staging)
        model_json_path = os.path.join(staging, 'model.json')
        patch_model_json(model_json_path, input_shape)
        bin_files = weight_shard_paths(model_json_path)
        for name in bin_files:
            if not os.path.isfile(os.path.join(staging, name)):
                raise RuntimeError(f'TFJS export declared {name} but did not write it')
        replace_directory(staging, output_dir)
    except BaseException:
        shutil.rmtree(staging, ignore_errors=True)
        raise
    return bin_files


def export_results(
    model,
    output_dir,
    input_shape,
    model_type,
    sequence_length,
    actions,
    history,
    split,
    X_test,
    y_test,
    features_schema_version,
):
    eval_metrics = build_evaluation_metrics(model, X_test, y_test, actions)
    history_json = _history_to_json(history)
    training_info = build_training_info(history_json, split)
    warnings = eval_metrics['warnings'] + training_warnings(training_info)

    bin_files = export_tfjs_atomically(model, output_dir, input_shape)
    model_json_path = os.path.join(os.path.abspath(output_dir), 'model.json')
    model_json_sha256 = sha256_file(model_json_path)
    bin_sha256 = {
        name: sha256_file(os.path.join(os.path.abspath(output_dir), name))
        for name in bin_files
    }

    logs = dict(history_json)
    logs['confusionMatrix'] = eval_metrics['confusionMatrix']
    logs['classMetrics'] = eval_metrics['classMetrics']
    logs['warnings'] = warnings
    logs['testSampleCount'] = eval_metrics['testSampleCount']
    logs['trainingInfo'] = training_info

    logger.info(
        "Entrenamiento: %s/%s épocas (mejor %s, lr final %.0e), val=%s grabaciones%s",
        training_info['epochsRun'],
        training_info['maxEpochs'],
        training_info['bestEpoch'],
        training_info['finalLearningRate'],
        training_info['validationRecordings'],
        " (= test)" if training_info['validationIsTestSet'] else "",
    )

    return {
        'accuracy': eval_metrics['accuracy'],
        'labels': actions,
        'logs': logs,
        'modelJsonUrl': public_model_json_path(model_json_path),
        'binUrls': bin_files,
        'modelJsonSha256': model_json_sha256,
        'binSha256': bin_sha256,
        'sequenceLength': sequence_length,
        'featuresCount': input_shape[-1],
        'modelType': model_type,
        'featuresSchemaVersion': features_schema_version,
        'warnings': warnings,
        'classMetrics': eval_metrics['classMetrics'],
        'confusionMatrix': eval_metrics['confusionMatrix'],
        'trainingInfo': training_info,
    }


def _labels(sample_names):
    actions = sorted(set(sample_names))
    label_map = {label: num for num, label in enumerate(actions)}
    y_indices = np.array([label_map[name] for name in sample_names])
    y = to_categorical(y_indices, num_classes=len(actions)).astype(np.float32)
    return actions, y_indices, y


def _central_frame(recording):
    return recording[len(recording) // 2]


def _static_frames_from_recording(recording):
    """Frames representativos del tramo sostenido de una grabación estática.

    Se toman varios en vez del central porque el central desperdicia el resto:
    una toma sostenida trae micro-movimiento natural (respiración, temblor,
    deriva de la muñeca) que es exactamente la variación que el modelo va a
    encontrar en inferencia, y es gratis comparada con el ruido gaussiano
    sintético que la aproximaba.

    Se limita al tramo central porque los extremos suelen contener el gesto de
    subir y bajar la mano, que no es la pose que se quiere aprender.
    """
    total = len(recording)
    if total <= 1:
        return list(recording[:1])
    margin = (1.0 - STATIC_SAMPLE_WINDOW) / 2.0
    low = int(np.floor(total * margin))
    high = min(total - 1, max(low, int(np.ceil(total * (1.0 - margin))) - 1))
    picks = np.unique(
        np.linspace(low, high, STATIC_FRAMES_PER_RECORDING).round().astype(int)
    )
    return [recording[index] for index in picks]


def _build_static_train_set(recordings, allow_mirror, indices, y):
    """Frames de train con augmentación (nunca toca validación ni test)."""
    aug_x, aug_y = [], []
    for recording_index in indices:
        label_oh = y[recording_index]
        for frame in _static_frames_from_recording(recordings[recording_index]):
            bases = [frame]
            if allow_mirror[recording_index]:
                bases.append(mirror_sequence_258(np.array([frame]))[0])
            for base_index, base in enumerate(bases):
                aug_x.append(base)
                aug_y.append(label_oh)
                # El original recibe más variantes que el espejo, igual que antes.
                for _ in range(3 if base_index == 0 else 1):
                    aug_x.append(augment_frame(base))
                    aug_y.append(label_oh)
    return np.array(aug_x, dtype=np.float64), np.array(aug_y, dtype=np.float32)


def _static_eval_set(recordings, indices, y):
    # Un frame por grabación: si contara los cinco, testSampleCount y
    # MIN_RELIABLE_TEST_SAMPLES medirían frames correlacionados en vez de
    # observaciones independientes.
    frames = np.array([_central_frame(recordings[i]) for i in indices], dtype=np.float64)
    return select_pose_landmarks(frames).astype(np.float32), y[indices]


def build_static_model(num_classes):
    return Sequential([
        Input(shape=(STATIC_FEATURES_COUNT,)),
        Dense(128, activation='relu'),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(num_classes, activation='softmax'),
    ])


def train_static_model(training_data, output_dir, on_progress_fn, stop_event=None):
    set_random_seed(RANDOM_STATE)

    validated = validate_training_samples(training_data, label="samples")
    recordings = [np.asarray(item["landmarks"], dtype=np.float64) for item in validated]
    sample_names = [item["signName"] for item in validated]
    allow_mirror = [item["allowMirror"] for item in validated]

    if len(recordings) == 0:
        raise ValueError("No se pudieron generar muestras estáticas de entrenamiento.")

    assert_dataset_ready(sample_names, context="static")
    actions, y_indices, y = _labels(sample_names)

    # El split va por grabación, no por frame: dos frames de la misma toma en
    # lados distintos harían que el test mida memorización, no generalización.
    split = split_recordings(y_indices)

    X_train_full, y_train = _build_static_train_set(recordings, allow_mirror, split.train, y)
    X_train = select_pose_landmarks(X_train_full).astype(np.float32)
    X_val, y_val = _static_eval_set(recordings, split.val, y)
    X_test, y_test = _static_eval_set(recordings, split.test, y)
    class_weight = compute_class_weights(np.argmax(y_train, axis=1), len(actions))
    logger.info(
        "Dataset estático: %s grabaciones → train=%s frames (con aug), val=%s, test=%s",
        len(recordings), len(X_train), len(X_val), len(X_test),
    )

    model = build_static_model(len(actions))
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['categorical_accuracy'],
    )
    history = _fit(model, X_train, y_train, X_val, y_val, class_weight, on_progress_fn, stop_event)

    return export_results(
        model,
        output_dir,
        [None, STATIC_FEATURES_COUNT],
        'static',
        1,
        actions,
        history,
        split,
        X_test,
        y_test,
        FEATURES_SCHEMA_STATIC,
    )


def _finalize_dynamic_sequence(landmarks_258, sequence_length):
    """258D almacenado → secuencia 340D lista para el LSTM.

    El recorte de landmarks va acá y no antes porque el espejado usa la
    permutación de simetría en índices de MediaPipe, que deja de ser válida
    sobre el vector compacto.
    """
    res_258 = np.asarray(landmarks_258, dtype=np.float64)
    if len(res_258) == 0:
        return None
    return build_dynamic_sequence(select_pose_landmarks(res_258), sequence_length)


def _dynamic_variants(trimmed):
    """Variantes de augmentación sobre la secuencia recortada (202D).

    Todo se perturba antes de derivar los deltas: así las velocidades siguen
    siendo la diferencia entre posiciones consecutivas, igual que en inferencia.
    """
    return [
        trimmed,
        augment_sequence(trimmed),
        augment_sequence(trimmed),
        time_warp_sequence(trimmed),
        frame_dropout_sequence(trimmed),
    ]


def _augment_dynamic_train_from_258(raw_258_train, y_train, allow_mirror, sequence_length):
    """258D → variantes 202D → 340D, solo en train (el espejo no fuga al test)."""
    aug_x, aug_y = [], []
    for raw_258, label_oh, mirror_ok in zip(raw_258_train, y_train, allow_mirror):
        raw = np.asarray(raw_258, dtype=np.float64)
        if len(raw) == 0:
            continue
        bases_258 = [raw, mirror_sequence_258(raw)] if mirror_ok else [raw]
        for base_258 in bases_258:
            for variant in _dynamic_variants(select_pose_landmarks(base_258)):
                aug_x.append(build_dynamic_sequence(variant, sequence_length))
                aug_y.append(label_oh)
    return np.array(aug_x, dtype=np.float32), np.array(aug_y, dtype=np.float32)


def _dynamic_eval_set(raw_258_list, indices, y, sequence_length):
    xs, ys = [], []
    for i in indices:
        seq = _finalize_dynamic_sequence(raw_258_list[i], sequence_length)
        if seq is None:
            continue
        xs.append(seq)
        ys.append(y[i])
    return np.array(xs, dtype=np.float32), np.array(ys, dtype=np.float32)


def build_dynamic_model(sequence_length, num_classes):
    # Dos LSTM de 64 en vez de 64/128/64: con decenas de grabaciones por
    # lección el stack grande sobreajusta antes de que el early stopping corte.
    return Sequential([
        Input(shape=(sequence_length, DYNAMIC_FEATURES_COUNT)),
        LSTM(64, return_sequences=True, activation='tanh'),
        Dropout(0.3),
        LSTM(64, return_sequences=False, activation='tanh'),
        Dropout(0.3),
        Dense(32, activation='relu'),
        Dense(num_classes, activation='softmax'),
    ])


def train_dynamic_model(training_data, output_dir, on_progress_fn, stop_event=None, global_static_noise=None):
    set_random_seed(RANDOM_STATE)
    global_static_noise = global_static_noise or []
    sequence_length = FIXED_SEQUENCE_LENGTH
    logger.info("Configurando SEQUENCE_LENGTH fijo: %s", sequence_length)

    validated = validate_training_samples(training_data, label="samples")
    noise_validated = validate_training_samples(
        global_static_noise if isinstance(global_static_noise, list) else [],
        label="globalStaticNoise",
    )

    # Guardamos 258D crudos para poder espejar solo en train tras el split
    raw_258_list, sample_names, allow_mirror = [], [], []

    for item in validated:
        raw_258_list.append(item["landmarks"])
        sample_names.append(item["signName"])
        allow_mirror.append(item["allowMirror"])

    for item in noise_validated:
        # Se remuestrea la grabación real en vez de repetir su frame central:
        # el tile produce una secuencia con deltas exactamente cero, un patrón
        # que no existe en inferencia (siempre hay temblor) y que el LSTM puede
        # usar como atajo para separar el ruido de las señas de verdad.
        raw_258_list.append(
            resample_sequence(
                np.asarray(item["landmarks"], dtype=np.float64), sequence_length
            )
        )
        sample_names.append(item["signName"])
        allow_mirror.append(item["allowMirror"])

    if len(raw_258_list) == 0:
        raise ValueError("No se pudieron generar secuencias de entrenamiento dinámico.")

    assert_dataset_ready(sample_names, context="dynamic")
    actions, y_indices, y = _labels(sample_names)

    # Split por índice sobre muestras originales (sin aug)
    split = split_recordings(y_indices)

    X_val, y_val = _dynamic_eval_set(raw_258_list, split.val, y, sequence_length)
    X_test, y_test = _dynamic_eval_set(raw_258_list, split.test, y, sequence_length)
    if len(X_test) == 0 or len(X_val) == 0:
        raise ValueError("No quedaron muestras de validación/test tras preparar secuencias dinámicas.")

    X_train, y_train = _augment_dynamic_train_from_258(
        [raw_258_list[i] for i in split.train],
        y[split.train],
        [allow_mirror[i] for i in split.train],
        sequence_length,
    )
    if len(X_train) == 0:
        raise ValueError("No quedaron muestras de train tras augmentación dinámica.")
    # Después de augmentar: con allowMirror=false una seña recibe la mitad de
    # variantes y los pesos tienen que verlo.
    class_weight = compute_class_weights(np.argmax(y_train, axis=1), len(actions))
    logger.info(
        "Dataset dinámico: train=%s (con aug), val=%s, test=%s",
        len(X_train), len(X_val), len(X_test),
    )

    model = build_dynamic_model(sequence_length, len(actions))
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['categorical_accuracy'],
    )
    history = _fit(model, X_train, y_train, X_val, y_val, class_weight, on_progress_fn, stop_event)

    return export_results(
        model,
        output_dir,
        [None, sequence_length, DYNAMIC_FEATURES_COUNT],
        'dynamic',
        sequence_length,
        actions,
        history,
        split,
        X_test,
        y_test,
        FEATURES_SCHEMA_DYNAMIC,
    )


def train_model(model_type, samples, global_static_noise, output_dir, on_progress_fn, stop_event=None):
    """Entrena a partir de un payload ya normalizado por ``normalize_training_payload``."""
    if model_type == "static":
        return train_static_model(samples, output_dir, on_progress_fn, stop_event)
    if model_type == "dynamic":
        return train_dynamic_model(samples, output_dir, on_progress_fn, stop_event, global_static_noise)
    raise ValueError(f"Unsupported modelType: {model_type!r}")


def train_lstm_model(training_data, output_dir, on_progress_fn, stop_event=None, model_type=None):
    """Compat: normaliza el payload crudo y despacha a ``train_model``."""
    resolved_type, samples, noise = normalize_training_payload(
        training_data, fallback_model_type=model_type
    )
    return train_model(resolved_type, samples, noise, output_dir, on_progress_fn, stop_event)
