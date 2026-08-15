import logging
import hashlib
import os

import numpy as np
import tensorflowjs as tfjs
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from tensorflow.keras.callbacks import Callback, EarlyStopping
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.utils import set_random_seed, to_categorical

from tfjs_export import patch_model_json
from utils import (
    DYNAMIC_FEATURES_COUNT,
    FEATURES_SCHEMA_DYNAMIC,
    FEATURES_SCHEMA_STATIC,
    FIXED_SEQUENCE_LENGTH,
    STATIC_FEATURES_COUNT,
    augmentable_mask,
    frame_dropout_sequence,
    mirror_sequence_258,
    resample_sequence,
    select_pose_landmarks,
    sequence_to_dynamic,
    time_warp_sequence,
)
from validation import (
    TrainingCancelledError,
    assert_dataset_ready,
    compute_class_weights,
    normalize_training_payload,
    resolve_split_plan,
    validate_training_samples,
)

logger = logging.getLogger(__name__)

EPOCHS = 80
LEARNING_RATE = 0.0001
EARLY_STOP_PATIENCE = 10
RANDOM_STATE = 42
# Por debajo de esto el accuracy de validación es ruido, no una medida.
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


def stratified_train_test_split(X, y):
    """train_test_split con seed fija y un test_count compatible con stratify."""
    y_labels = np.argmax(y, axis=1) if getattr(y, 'ndim', 1) > 1 else np.asarray(y)
    plan = resolve_split_plan(y_labels)

    return train_test_split(
        X,
        y,
        test_size=plan.test_count,
        random_state=RANDOM_STATE,
        stratify=y_labels if plan.stratify else None,
    )


def build_early_stopping():
    return EarlyStopping(
        monitor='val_loss',
        patience=EARLY_STOP_PATIENCE,
        restore_best_weights=True,
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
    return _jitter(seq, noise_std, scale_range)


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
                f"Clase '{action}' con recall 0 en validación — revisar grabaciones."
            )

    test_sample_count = int(len(y_true))
    if test_sample_count < MIN_RELIABLE_TEST_SAMPLES:
        warnings.append(
            f"Solo {test_sample_count} muestras de validación: el accuracy "
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


def export_results(
    model,
    output_dir,
    input_shape,
    model_type,
    sequence_length,
    actions,
    history,
    X_test,
    y_test,
    features_schema_version,
):
    tfjs.converters.save_keras_model(model, output_dir)
    model_json_path = os.path.join(output_dir, 'model.json')
    patch_model_json(model_json_path, input_shape)

    eval_metrics = build_evaluation_metrics(model, X_test, y_test, actions)
    bin_files = sorted(f for f in os.listdir(output_dir) if f.endswith('.bin'))
    if not bin_files:
        raise RuntimeError(f'TFJS export produced no .bin shards in {output_dir}')

    logs = dict(history.history)
    logs['confusionMatrix'] = eval_metrics['confusionMatrix']
    logs['classMetrics'] = eval_metrics['classMetrics']
    logs['warnings'] = eval_metrics['warnings']
    logs['testSampleCount'] = eval_metrics['testSampleCount']

    features_count = input_shape[-1]
    with open(model_json_path, 'rb') as model_json_file:
        model_json_sha256 = hashlib.sha256(model_json_file.read()).hexdigest()

    return {
        'accuracy': eval_metrics['accuracy'],
        'labels': actions,
        'logs': logs,
        'modelJsonUrl': model_json_path,
        'binUrls': bin_files,
        'modelJsonSha256': model_json_sha256,
        'sequenceLength': sequence_length,
        'featuresCount': features_count,
        'modelType': model_type,
        'featuresSchemaVersion': features_schema_version,
        'warnings': eval_metrics['warnings'],
        'classMetrics': eval_metrics['classMetrics'],
        'confusionMatrix': eval_metrics['confusionMatrix'],
    }


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


def _expand_static_train(recordings, indices, y_rows):
    frames, labels = [], []
    for position, recording_index in enumerate(indices):
        for frame in _static_frames_from_recording(recordings[recording_index]):
            frames.append(frame)
            labels.append(y_rows[position])
    return np.array(frames, dtype=np.float64), np.array(labels, dtype=np.float32)


def _augment_static_train_set(X_train, y_train):
    """Augmentación solo sobre train (no contaminar test)."""
    aug_x, aug_y = [], []
    for frame, label_oh in zip(X_train, y_train):
        aug_x.append(frame)
        aug_y.append(label_oh)
        for _ in range(3):
            aug_x.append(augment_frame(frame))
            aug_y.append(label_oh)
        mirrored = mirror_sequence_258(np.array([frame]))[0]
        aug_x.append(mirrored)
        aug_y.append(label_oh)
        aug_x.append(augment_frame(mirrored))
        aug_y.append(label_oh)
    return np.array(aug_x, dtype=np.float64), np.array(aug_y, dtype=np.float32)


def train_static_model(training_data, output_dir, on_progress_fn, stop_event=None):
    os.makedirs(output_dir, exist_ok=True)
    set_random_seed(RANDOM_STATE)

    validated = validate_training_samples(training_data, label="samples")
    recordings, sample_names = [], []
    for item in validated:
        recordings.append(np.asarray(item["landmarks"], dtype=np.float64))
        sample_names.append(item["signName"])

    if len(recordings) == 0:
        raise ValueError("No se pudieron generar muestras estáticas de entrenamiento.")

    assert_dataset_ready(sample_names, context="static")

    actions = sorted(set(sample_names))
    label_map = {label: num for num, label in enumerate(actions)}
    y_indices = [label_map[name] for name in sample_names]
    y = to_categorical(y_indices, num_classes=len(actions)).astype(np.float32)

    # El split va por grabación, no por frame: dos frames de la misma toma en
    # lados distintos harían que el test mida memorización, no generalización.
    recording_indices = np.arange(len(recordings))
    idx_train, idx_test, y_train_rec, y_test_rec = stratified_train_test_split(
        recording_indices, y
    )
    if len(idx_train) == 0 or len(idx_test) == 0:
        raise ValueError(
            f"Split estático inválido: train={len(idx_train)}, test={len(idx_test)}"
        )

    X_train_full, y_train = _expand_static_train(recordings, idx_train, y_train_rec)
    X_train_full, y_train = _augment_static_train_set(X_train_full, y_train)
    # El test se queda con un frame por grabación: si contara los cinco,
    # testSampleCount y MIN_RELIABLE_TEST_SAMPLES estarían midiendo frames
    # correlacionados en vez de observaciones independientes.
    X_test_full = np.array(
        [_central_frame(recordings[index]) for index in idx_test], dtype=np.float64
    )
    y_test = y_test_rec

    class_weight = compute_class_weights(np.argmax(y_train, axis=1), len(actions))
    X_train = select_pose_landmarks(X_train_full).astype(np.float32)
    X_test = select_pose_landmarks(X_test_full).astype(np.float32)
    logger.info(
        "Dataset estático: %s grabaciones → train=%s frames (con aug), test=%s",
        len(recordings), len(X_train), len(X_test),
    )

    model = Sequential([
        Input(shape=(STATIC_FEATURES_COUNT,)),
        Dense(128, activation='relu'),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(len(actions), activation='softmax'),
    ])

    optimizer = Adam(learning_rate=LEARNING_RATE)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])

    prog_cb = ProgressCallback(on_progress_fn=on_progress_fn, stop_event=stop_event)

    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=32,
        validation_data=(X_test, y_test),
        callbacks=[prog_cb, build_early_stopping()],
        class_weight=class_weight,
        verbose=FIT_VERBOSITY,
    )
    prog_cb.raise_if_cancelled()

    return export_results(
        model,
        output_dir,
        [None, STATIC_FEATURES_COUNT],
        'static',
        1,
        actions,
        history,
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
    trimmed = select_pose_landmarks(res_258)
    return resample_sequence(sequence_to_dynamic(trimmed), sequence_length)


def _augment_dynamic_train_from_258(raw_258_train, y_train, sequence_length):
    """Convierte 258→340 y augments solo en train (incluye espejo sin fugar al test)."""
    aug_x, aug_y = [], []
    for raw_258, label_oh in zip(raw_258_train, y_train):
        bases_258 = [raw_258, mirror_sequence_258(raw_258)]
        for base_258 in bases_258:
            seq = _finalize_dynamic_sequence(base_258, sequence_length)
            if seq is None:
                continue
            aug_x.append(seq)
            aug_y.append(label_oh)
            for _ in range(2):
                aug_x.append(augment_sequence(seq))
                aug_y.append(label_oh)
            aug_x.append(time_warp_sequence(seq, target_length=sequence_length))
            aug_y.append(label_oh)
            aug_x.append(frame_dropout_sequence(seq))
            aug_y.append(label_oh)
    return np.array(aug_x, dtype=np.float32), np.array(aug_y, dtype=np.float32)


def train_dynamic_model(training_data, output_dir, on_progress_fn, stop_event=None, global_static_noise=None):
    os.makedirs(output_dir, exist_ok=True)
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
    raw_258_list, sample_names = [], []

    for item in validated:
        raw_258_list.append(item["landmarks"])
        sample_names.append(item["signName"])

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

    if len(raw_258_list) == 0:
        raise ValueError("No se pudieron generar secuencias de entrenamiento dinámico.")

    assert_dataset_ready(sample_names, context="dynamic")

    actions = sorted(set(sample_names))
    label_map = {label: num for num, label in enumerate(actions)}
    y_indices = [label_map[name] for name in sample_names]
    y = to_categorical(y_indices, num_classes=len(actions)).astype(np.float32)

    # Split por índice sobre muestras originales (sin aug)
    indices = np.arange(len(raw_258_list))
    plan = resolve_split_plan(y_indices)
    idx_train, idx_test = train_test_split(
        indices,
        test_size=plan.test_count,
        random_state=RANDOM_STATE,
        stratify=y_indices if plan.stratify else None,
    )

    if len(idx_train) == 0 or len(idx_test) == 0:
        raise ValueError(
            f"Split dinámico inválido: train={len(idx_train)}, test={len(idx_test)}"
        )

    raw_train = [raw_258_list[i] for i in idx_train]
    y_train = y[idx_train]

    X_test_list, y_test_list = [], []
    for i in idx_test:
        seq = _finalize_dynamic_sequence(raw_258_list[i], sequence_length)
        if seq is None:
            continue
        X_test_list.append(seq)
        y_test_list.append(y[i])

    if len(X_test_list) == 0:
        raise ValueError("No quedaron muestras de test tras preparar secuencias dinámicas.")

    X_test = np.array(X_test_list, dtype=np.float32)
    y_test = np.array(y_test_list, dtype=np.float32)

    class_weight = compute_class_weights(np.argmax(y_train, axis=1), len(actions))
    X_train, y_train = _augment_dynamic_train_from_258(raw_train, y_train, sequence_length)
    if len(X_train) == 0:
        raise ValueError("No quedaron muestras de train tras augmentación dinámica.")
    logger.info("Dataset dinámico: train=%s (con aug), test=%s", len(X_train), len(X_test))

    model = Sequential([
        Input(shape=(sequence_length, DYNAMIC_FEATURES_COUNT)),
        LSTM(64, return_sequences=True, activation='tanh'),
        Dropout(0.2),
        LSTM(128, return_sequences=True, activation='tanh'),
        Dropout(0.2),
        LSTM(64, return_sequences=False, activation='tanh'),
        Dense(64, activation='relu'),
        Dense(32, activation='relu'),
        Dense(len(actions), activation='softmax'),
    ])

    optimizer = Adam(learning_rate=LEARNING_RATE)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])

    prog_cb = ProgressCallback(on_progress_fn=on_progress_fn, stop_event=stop_event)

    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=32,
        validation_data=(X_test, y_test),
        callbacks=[prog_cb, build_early_stopping()],
        class_weight=class_weight,
        verbose=FIT_VERBOSITY,
    )
    prog_cb.raise_if_cancelled()

    return export_results(
        model,
        output_dir,
        [None, sequence_length, DYNAMIC_FEATURES_COUNT],
        'dynamic',
        sequence_length,
        actions,
        history,
        X_test,
        y_test,
        FEATURES_SCHEMA_DYNAMIC,
    )


def train_lstm_model(training_data, output_dir, on_progress_fn, stop_event=None, model_type=None):
    """Dispatcher: la precedencia de modelType vive en normalize_training_payload."""
    resolved_type, samples, noise = normalize_training_payload(
        training_data, fallback_model_type=model_type
    )

    if resolved_type == "static":
        return train_static_model(samples, output_dir, on_progress_fn, stop_event)
    return train_dynamic_model(samples, output_dir, on_progress_fn, stop_event, noise)
