import os

import numpy as np

from ml_feature_contract_generated import (
    DYNAMIC_FEATURES_COUNT,
    FEATURES_COUNT,
    FEATURES_SCHEMA_DYNAMIC,
    FEATURES_SCHEMA_STATIC,
    FIXED_SEQUENCE_LENGTH,
    LEGACY_FEATURES_SCHEMA_DYNAMIC,
    LEGACY_FEATURES_SCHEMA_STATIC,
    MODEL_POSE_LANDMARKS,
    STATIC_FEATURES_COUNT,
    VELOCITY_POSE_LANDMARKS,
)

# Las constantes del contrato se re-exportan desde aquí: el resto del worker
# importa de `utils` y no del módulo generado.
__all__ = [
    "DYNAMIC_FEATURES_COUNT",
    "FEATURES_COUNT",
    "FEATURES_SCHEMA_DYNAMIC",
    "FEATURES_SCHEMA_STATIC",
    "FIXED_SEQUENCE_LENGTH",
    "HAND_BLOCK_SIZE",
    "HAND_FEATURE_START",
    "HAND_FEATURES",
    "HAND_LANDMARKS",
    "LEGACY_FEATURES_SCHEMA_DYNAMIC",
    "LEGACY_FEATURES_SCHEMA_STATIC",
    "MODEL_HAND_FEATURE_START",
    "MODEL_POSE_LANDMARKS",
    "POSE_LANDMARKS",
    "POSE_MIRROR_PAIRS",
    "POSE_VELOCITY_FEATURES",
    "STATIC_FEATURES_COUNT",
    "VELOCITY_POSE_LANDMARKS",
    "augmentable_mask",
    "build_dynamic_sequence",
    "frame_dropout_sequence",
    "frame_to_dynamic",
    "mirror_frame_258",
    "mirror_sequence_258",
    "normalize_pose_scale",
    "pose_scale_factor",
    "resample_sequence",
    "select_pose_landmarks",
    "sequence_to_dynamic",
    "time_warp_sequence",
]

POSE_LANDMARKS = 33
POSE_VALUES_PER_LANDMARK = 4  # x, y, z, visibility
HAND_FEATURE_START = POSE_LANDMARKS * POSE_VALUES_PER_LANDMARK
HAND_FEATURES = FEATURES_COUNT - HAND_FEATURE_START  # 126
HAND_LANDMARKS = 21
HAND_VALUES_PER_LANDMARK = 3  # x, y, z
HAND_BLOCK_SIZE = HAND_LANDMARKS * HAND_VALUES_PER_LANDMARK  # 63

LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
# Por debajo de esto el ancho de hombros es ruido (o el pose llegó en cero).
POSE_SCALE_EPSILON = 1e-6

# --- Layout del modelo (recortado) ------------------------------------------
#
# Lo capturado y almacenado sigue siendo 258D con los 33 landmarks de MediaPipe.
# Los modelos ven menos: `select_pose_landmarks` proyecta al subconjunto del
# contrato antes de entrenar y de inferir. Es una transformación derivada, así
# que cambiar el subconjunto no invalida ninguna grabación: solo obliga a
# reentrenar.
MODEL_POSE_LANDMARK_COUNT = len(MODEL_POSE_LANDMARKS)
MODEL_HAND_FEATURE_START = MODEL_POSE_LANDMARK_COUNT * POSE_VALUES_PER_LANDMARK

# Posición que ocupa cada landmark de MediaPipe dentro del vector recortado.
# Nada puede seguir asumiendo los índices originales después del recorte.
_MODEL_POSE_SLOT = {
    landmark: slot for slot, landmark in enumerate(MODEL_POSE_LANDMARKS)
}

_SELECT_INDICES = np.array(
    [
        landmark * POSE_VALUES_PER_LANDMARK + offset
        for landmark in MODEL_POSE_LANDMARKS
        for offset in range(POSE_VALUES_PER_LANDMARK)
    ]
    + list(range(HAND_FEATURE_START, FEATURES_COUNT))
)

# Índices xyz de los landmarks cuya velocidad se añade desde dynamic-v3: codos y
# muñecas. La trayectoria del brazo vive en el bloque de pose, así que es el
# único lugar del vector donde el desplazamiento de la mano es observable.
# Se expresan sobre el layout recortado, que es donde se derivan los deltas.
_VELOCITY_POSE_INDICES = np.array(
    [
        _MODEL_POSE_SLOT[landmark] * POSE_VALUES_PER_LANDMARK + axis
        for landmark in VELOCITY_POSE_LANDMARKS
        for axis in range(3)
    ]
)
POSE_VELOCITY_FEATURES = len(_VELOCITY_POSE_INDICES)  # 12

if len(_SELECT_INDICES) != STATIC_FEATURES_COUNT:
    raise AssertionError(
        f"El contrato declara {STATIC_FEATURES_COUNT} features estáticas pero el "
        f"subconjunto de pose produce {len(_SELECT_INDICES)}"
    )

if (
    DYNAMIC_FEATURES_COUNT
    != STATIC_FEATURES_COUNT + HAND_FEATURES + POSE_VELOCITY_FEATURES
):
    raise AssertionError(
        f"El contrato declara {DYNAMIC_FEATURES_COUNT} features dinámicas pero el "
        f"layout produce "
        f"{STATIC_FEATURES_COUNT + HAND_FEATURES + POSE_VELOCITY_FEATURES}"
    )

if not set(VELOCITY_POSE_LANDMARKS).issubset(MODEL_POSE_LANDMARKS):
    raise AssertionError(
        "velocityPoseLandmarks debe ser un subconjunto de modelPoseLandmarks: "
        f"{sorted(set(VELOCITY_POSE_LANDMARKS) - set(MODEL_POSE_LANDMARKS))} "
        "quedarían fuera del vector recortado"
    )

# Índices de MediaPipe Pose que se intercambian al reflejar horizontalmente.
# La nariz (0) no tiene par. Sin este intercambio el espejo produce un cuerpo
# anatómicamente imposible (hombro "izquierdo" en el lado derecho del torso).
POSE_MIRROR_PAIRS = (
    (1, 4), (2, 5), (3, 6),      # ojos
    (7, 8),                       # orejas
    (9, 10),                      # boca
    (11, 12), (13, 14), (15, 16),  # hombros, codos, muñecas
    (17, 18), (19, 20), (21, 22),  # meñique, índice, pulgar
    (23, 24), (25, 26), (27, 28),  # caderas, rodillas, tobillos
    (29, 30), (31, 32),            # talones, punta del pie
)

_POSE_MIRROR_PERMUTATION = np.arange(POSE_LANDMARKS)
for _left, _right in POSE_MIRROR_PAIRS:
    _POSE_MIRROR_PERMUTATION[_left] = _right
    _POSE_MIRROR_PERMUTATION[_right] = _left

# Sobre el layout recortado: es el único que ve la augmentación.
_VISIBILITY_INDICES = (
    np.arange(MODEL_POSE_LANDMARK_COUNT) * POSE_VALUES_PER_LANDMARK + 3
)

_POSE_XYZ_INDICES = np.array(
    [
        landmark * POSE_VALUES_PER_LANDMARK + axis
        for landmark in range(POSE_LANDMARKS)
        for axis in range(3)
    ]
)


def select_pose_landmarks(values: np.ndarray) -> np.ndarray:
    """Proyecta 258D almacenado al subconjunto de pose que ven los modelos.

    MediaPipe emite siempre los 33 landmarks, aunque el encuadre sea de cintura
    para arriba: rodillas, tobillos y pies llegan extrapolados y a veces con
    ``visibility`` alta, así que son ruido con apariencia de señal. Los puntos de
    mano del pose (17-22) son duplicados groseros de los bloques de mano, que ya
    traen 21 landmarks por mano.

    El recorte se hace acá y no en la captura para que lo almacenado conserve el
    frame completo: cambiar el subconjunto no invalida ninguna grabación, solo
    obliga a reentrenar. Los bloques de mano pasan enteros.

    Acepta un frame (1D) o una secuencia (2D).
    """
    array = np.asarray(values, dtype=np.float64)
    return array[..., _SELECT_INDICES]


def pose_scale_factor(values: np.ndarray) -> np.ndarray:
    """Ancho de hombros proyectado, por frame.

    Se mide solo en el plano de imagen (x, y) porque es el tamaño aparente de la
    persona, que es justo lo que cambia con la distancia a la cámara; sumar z
    metería el ruido de la estimación de profundidad de MediaPipe.

    Es recuperable de cualquier 258D ya almacenado: el frontend centra el pose
    en el punto medio de los hombros, así que resta el mismo ``chest`` a los
    landmarks 11 y 12 y la distancia entre ellos se preserva.
    """
    array = np.asarray(values, dtype=np.float64)
    left = LEFT_SHOULDER * POSE_VALUES_PER_LANDMARK
    right = RIGHT_SHOULDER * POSE_VALUES_PER_LANDMARK
    delta_x = array[..., left] - array[..., right]
    delta_y = array[..., left + 1] - array[..., right + 1]
    distance = np.sqrt(delta_x * delta_x + delta_y * delta_y)
    return np.where(distance > POSE_SCALE_EPSILON, distance, 1.0)


def normalize_pose_scale(values: np.ndarray) -> np.ndarray:
    """Divide el xyz del pose por el ancho de hombros, dejando visibility intacto.

    Vuelve el bloque de pose —y por tanto las velocidades que se derivan de él—
    invariante a la distancia a la cámara. Las manos no se tocan: ya llegan
    normalizadas por la distancia muñeca-nudillo desde el frontend.

    Acepta un frame (1D) o una secuencia (2D).
    """
    array = np.array(values, dtype=np.float64, copy=True)
    scale = pose_scale_factor(array)[..., np.newaxis]
    array[..., _POSE_XYZ_INDICES] /= scale
    return array


def resample_sequence(sequence: np.ndarray, target_length: int) -> np.ndarray:
    """Interpolación lineal temporal: N frames → target_length frames uniformes."""
    array = np.asarray(sequence, dtype=np.float64)
    source_length = len(array)
    if source_length == 0:
        return np.empty((0, array.shape[1] if array.ndim > 1 else FEATURES_COUNT))
    if source_length == 1:
        return np.tile(array[0], (target_length, 1))
    if source_length == target_length:
        return array
    positions = np.arange(target_length) * (source_length - 1) / (target_length - 1)
    return _sample_at(array, positions)


def _sample_at(sequence: np.ndarray, positions: np.ndarray) -> np.ndarray:
    """Interpola linealmente la secuencia en posiciones fraccionarias de frame."""
    positions = np.clip(positions, 0, len(sequence) - 1)
    low = np.floor(positions).astype(int)
    high = np.ceil(positions).astype(int)
    weight = (positions - low)[:, np.newaxis]
    return sequence[low] + weight * (sequence[high] - sequence[low])


def frame_to_dynamic(frame_static: np.ndarray, prev_static=None) -> np.ndarray:
    """Convierte un frame recortado (202D) a 340D: velocidad de manos y brazos.

    Los deltas de codos y muñecas se sacan del bloque de pose porque ahí es
    donde está la trayectoria: los bloques de mano llegan relativos a la muñeca,
    así que desplazar el brazo con la mano en forma fija no los mueve.

    Espera la entrada ya pasada por ``select_pose_landmarks``.
    """
    frame = np.asarray(frame_static, dtype=np.float64)
    pose = frame[:MODEL_HAND_FEATURE_START]
    hands = frame[MODEL_HAND_FEATURE_START:]
    if prev_static is None:
        hand_deltas = np.zeros_like(hands)
        pose_deltas = np.zeros(POSE_VELOCITY_FEATURES, dtype=np.float64)
    else:
        prev = np.asarray(prev_static, dtype=np.float64)
        hand_deltas = hands - prev[MODEL_HAND_FEATURE_START:]
        pose_deltas = frame[_VELOCITY_POSE_INDICES] - prev[_VELOCITY_POSE_INDICES]
    return np.concatenate([pose, hands, hand_deltas, pose_deltas])


def sequence_to_dynamic(sequence_static: np.ndarray) -> np.ndarray:
    """Convierte una secuencia recortada (202D) a 340D frame a frame.

    Equivale a aplicar ``frame_to_dynamic`` a cada frame con el anterior, pero
    vectorizado: el primer frame lleva deltas en cero.
    """
    frames = np.asarray(sequence_static, dtype=np.float64)
    if len(frames) == 0:
        return np.empty((0, DYNAMIC_FEATURES_COUNT))
    deltas = np.zeros_like(frames)
    deltas[1:] = frames[1:] - frames[:-1]
    hand_deltas = deltas[:, MODEL_HAND_FEATURE_START:]
    pose_deltas = deltas[:, _VELOCITY_POSE_INDICES]
    return np.concatenate([frames, hand_deltas, pose_deltas], axis=1)


def build_dynamic_sequence(sequence_static: np.ndarray, sequence_length: int) -> np.ndarray:
    """202D recortado → secuencia 340D de ``sequence_length`` frames (dynamic-v4).

    Primero se remuestrea y después se derivan los deltas. Así las velocidades
    quedan medidas en "fracción del gesto" y no en "frames de cámara": una
    grabación a 15 fps y otra a 30 fps del mismo gesto producen los mismos
    deltas, cosa que no pasaba en dynamic-v3 (deltas sobre frames crudos).
    Tiene que coincidir con ``buildDynamicInferenceSequence`` del frontend.
    """
    frames = np.asarray(sequence_static, dtype=np.float64)
    if len(frames) == 0:
        return np.empty((0, DYNAMIC_FEATURES_COUNT))
    return sequence_to_dynamic(resample_sequence(frames, sequence_length))


def time_warp_sequence(
    seq: np.ndarray,
    speed_range: tuple = (0.7, 1.3),
    segments: int = 4,
    target_length: int | None = None,
) -> np.ndarray:
    """Variación de ritmo no uniforme dentro del gesto.

    Divide el tiempo de salida en ``segments`` tramos y a cada uno le asigna una
    velocidad aleatoria: un tramo se ejecuta más lento y otro más rápido, como
    cuando alguien sostiene la configuración de la mano y después acelera el
    movimiento. La curva es monótona y fija los extremos, así que el gesto
    empieza y termina igual.

    Un estiramiento uniforme no aporta nada desde dynamic-v4: el resample a
    longitud fija lo deshace por completo.
    """
    array = np.asarray(seq, dtype=np.float64)
    if len(array) < 2:
        return array
    output_len = target_length if target_length is not None else len(array)
    speeds = np.random.uniform(speed_range[0], speed_range[1], size=segments)
    knots_out = np.linspace(0.0, 1.0, segments + 1)
    knots_src = np.concatenate([[0.0], np.cumsum(speeds) / np.sum(speeds)])
    times = np.linspace(0.0, 1.0, output_len)
    positions = np.interp(times, knots_out, knots_src) * (len(array) - 1)
    return _sample_at(array, positions)


def mirror_frame_258(frame: np.ndarray) -> np.ndarray:
    """Espejo horizontal completo de un frame 258D.

    Niega la X de pose y manos, intercambia los bloques de mano izq/der y
    permuta los landmarks simétricos del pose. Es válido porque el frontend
    entrega el pose centrado en el punto medio de los hombros, así que la X
    ya está centrada en cero.
    """
    out = np.array(frame, dtype=np.float64, copy=True)

    pose = out[:HAND_FEATURE_START].reshape(POSE_LANDMARKS, POSE_VALUES_PER_LANDMARK)
    pose[:, 0] *= -1.0
    out[:HAND_FEATURE_START] = pose[_POSE_MIRROR_PERMUTATION].reshape(-1)

    lh_start = HAND_FEATURE_START
    rh_start = lh_start + HAND_BLOCK_SIZE
    rh_end = rh_start + HAND_BLOCK_SIZE
    left = out[lh_start:rh_start].reshape(HAND_LANDMARKS, HAND_VALUES_PER_LANDMARK).copy()
    right = out[rh_start:rh_end].reshape(HAND_LANDMARKS, HAND_VALUES_PER_LANDMARK).copy()
    left[:, 0] *= -1.0
    right[:, 0] *= -1.0
    out[lh_start:rh_start] = right.reshape(-1)
    out[rh_start:rh_end] = left.reshape(-1)
    return out


def mirror_sequence_258(sequence_258: np.ndarray) -> np.ndarray:
    return np.array([mirror_frame_258(frame) for frame in sequence_258])


def _zero_sensitive_blocks(n_features: int) -> tuple[int, ...]:
    """Offsets de los bloques de 63 que llegan en cero exacto si falta la mano.

    El layout va explícito en vez de deducirse por divisibilidad: con 340
    features ``(340 - 76) % 63`` da 12 y una comprobación así se saltaría el
    enmascarado entero. El bloque de velocidad de brazos no entra en la lista
    porque el pose sigue presente aunque MediaPipe no detecte la mano.
    """
    hands = (MODEL_HAND_FEATURE_START, MODEL_HAND_FEATURE_START + HAND_BLOCK_SIZE)
    if n_features == STATIC_FEATURES_COUNT:
        return hands
    if n_features == DYNAMIC_FEATURES_COUNT:
        return hands + (
            STATIC_FEATURES_COUNT,
            STATIC_FEATURES_COUNT + HAND_BLOCK_SIZE,
        )
    return ()


def augmentable_mask(values: np.ndarray) -> np.ndarray:
    """Máscara booleana de los valores que se pueden perturbar con ruido.

    Excluye la columna ``visibility`` del pose (una confianza en [0, 1] que el
    ruido sacaría de rango) y los bloques de mano/velocidad que llegan en cero
    exacto, porque así es como el frontend codifica una mano no detectada: si
    los ensuciamos, el modelo nunca ve el patrón que recibe en inferencia.

    Acepta un frame (1D) o una secuencia (2D), de 202D o 340D.
    """
    array = np.asarray(values)
    mask = np.ones(array.shape, dtype=bool)
    mask[..., _VISIBILITY_INDICES] = False

    for start in _zero_sensitive_blocks(array.shape[-1]):
        block = array[..., start:start + HAND_BLOCK_SIZE]
        present = np.any(block, axis=-1, keepdims=True)
        mask[..., start:start + HAND_BLOCK_SIZE] &= present
    return mask


def frame_dropout_sequence(seq: np.ndarray, drop_prob: float = 0.08) -> np.ndarray:
    """Simula pérdida de tracking: congela el frame anterior con cierta probabilidad.

    Se aplica sobre la secuencia recortada (202D), antes de derivar deltas: un
    frame congelado produce delta cero, igual que en inferencia. Si el que se
    pierde es el primero, se ponen en cero los bloques de mano, que es como el
    frontend codifica una mano no detectada.
    """
    if len(seq) == 0:
        return seq
    out = np.array(seq, dtype=np.float64, copy=True)
    for i in range(len(out)):
        if np.random.random() < drop_prob:
            if i > 0:
                out[i] = out[i - 1]
            else:
                out[i, MODEL_HAND_FEATURE_START:] = 0.0
    return out


def public_model_json_path(model_json_path: str) -> str:
    """TR-05: devuelve la ruta de model.json relativa a DATA_BASE_DIR.

    El backend es quien decide la URL pública (/shared/...). Así el trainer no
    asume dónde está montado el volumen y no filtra rutas absolutas del worker.
    """
    base = os.path.abspath(os.getenv('DATA_BASE_DIR', '/shared'))
    rel = os.path.relpath(os.path.abspath(model_json_path), base)
    if rel.startswith('..') or os.path.isabs(rel):
        raise RuntimeError(f'model.json fuera de DATA_BASE_DIR: {model_json_path}')
    return rel.replace(os.sep, '/')
