"""Validación de paths y payloads de entrenamiento."""

from __future__ import annotations

import logging
import math
from collections import Counter
from pathlib import Path
from typing import Any, Iterable, NamedTuple

import numpy as np

from utils import FEATURES_COUNT, normalize_pose_scale

logger = logging.getLogger(__name__)

MIN_SAMPLES_TOTAL = 2
MIN_CLASSES = 2
TEST_SPLIT_RATIO = 0.2
MODEL_TYPES = ("static", "dynamic")


class TrainingCancelledError(Exception):
    """El entrenamiento se detuvo porque el job fue cancelado o perdió el lock."""


def normalize_training_payload(raw_data, fallback_model_type=None):
    """
    Soporta formato legacy (lista) y nuevo ({ modelType, samples, globalStaticNoise }).

    Única fuente de verdad de la precedencia de ``modelType``: gana el del
    payload, el del job es fallback y es obligatorio para el formato legacy
    (una lista pelada NO se asume 'dynamic').
    """
    if isinstance(raw_data, list):
        if fallback_model_type not in MODEL_TYPES:
            raise ValueError(
                "Legacy list payload requires explicit modelType "
                "from the job ('static' | 'dynamic')"
            )
        return fallback_model_type, raw_data, []

    if not isinstance(raw_data, dict):
        raise ValueError(
            f"Unsupported training payload type: {type(raw_data).__name__}"
        )

    payload_model_type = raw_data.get("modelType")
    model_type = payload_model_type or fallback_model_type
    if model_type not in MODEL_TYPES:
        raise ValueError(
            f"Unsupported or missing modelType: {model_type!r}"
        )
    if (
        payload_model_type
        and fallback_model_type
        and payload_model_type != fallback_model_type
    ):
        logger.warning(
            "modelType job=%s vs payload=%s — usando payload",
            fallback_model_type,
            payload_model_type,
        )

    samples = raw_data.get("samples", raw_data.get("trainingData", []))
    global_static_noise = raw_data.get("globalStaticNoise", [])
    return model_type, samples, global_static_noise


class SplitPlan(NamedTuple):
    test_count: int
    stratify: bool


def resolve_split_plan(
    label_indices: Iterable[int],
    ratio: float = TEST_SPLIT_RATIO,
) -> SplitPlan:
    """Decide cuántas muestras van a test y si se puede estratificar.

    Al estratificar, sklearn exige ``n_test >= n_clases`` y
    ``n_train >= n_clases``. Pasarle una fracción cruda rompe en cuanto hay
    pocas grabaciones por seña (8 clases x 4 grabaciones -> n_test = 7 < 8) y
    aborta el entrenamiento con un ValueError críptico, así que fijamos el
    conteo exacto dentro del rango válido.
    """
    labels = np.asarray(list(label_indices))
    n_samples = int(labels.shape[0])
    if n_samples < 2:
        return SplitPlan(test_count=0, stratify=False)

    _, counts = np.unique(labels, return_counts=True)
    n_classes = int(counts.shape[0])
    desired = max(1, math.ceil(n_samples * ratio))

    if counts.min() < 2:
        # Con clases de una sola muestra no se puede estratificar; basta con
        # dejar al menos una muestra de cada lado del split.
        return SplitPlan(test_count=min(desired, n_samples - 1), stratify=False)

    # counts.min() >= 2 implica n_samples >= 2 * n_classes, así que la ventana
    # [n_classes, n_samples - n_classes] siempre tiene al menos un valor.
    return SplitPlan(
        test_count=min(max(desired, n_classes), n_samples - n_classes),
        stratify=True,
    )


def compute_class_weights(
    label_indices: Iterable[int],
    n_classes: int,
) -> dict[int, float]:
    """Pesos inversos a la frecuencia: la augmentación no corrige el desbalance."""
    labels = np.asarray(list(label_indices), dtype=np.int64)
    counts = np.bincount(labels, minlength=n_classes).astype(np.float64)
    total = float(counts.sum())
    return {
        index: (total / (n_classes * count)) if count > 0 else 1.0
        for index, count in enumerate(counts.tolist())
    }


def is_safe_path(base_dir: str, path: str | None) -> bool:
    if not path or not isinstance(path, str):
        return False
    try:
        base = Path(base_dir).resolve()
        target = Path(path).resolve()
        return base == target or base in target.parents
    except (OSError, RuntimeError, TypeError, ValueError):
        return False


def assert_safe_job_paths(
    base_dir: str,
    data_path: str | None,
    output_path: str | None,
) -> tuple[str, str]:
    """Valida ambos paths y los devuelve ya garantizados como no nulos."""
    if not data_path or not output_path:
        raise ValueError("Job data must include dataPath and outputPath")
    if not is_safe_path(base_dir, data_path) or not is_safe_path(base_dir, output_path):
        raise ValueError(
            f"Invalid paths detected (must be under {base_dir}): "
            f"data_path={data_path}, output_path={output_path}"
        )
    return data_path, output_path


def _as_landmark_frames(landmarks: Any, sample_index: int) -> np.ndarray:
    if not isinstance(landmarks, (list, tuple, np.ndarray)):
        raise ValueError(f"Sample {sample_index}: landmarks must be a list of frames")

    if isinstance(landmarks, (list, tuple)) and len(landmarks) == 0:
        return np.empty((0, FEATURES_COUNT), dtype=np.float64)

    frames = np.asarray(landmarks, dtype=np.float64)
    if frames.size == 0:
        return np.empty((0, FEATURES_COUNT), dtype=np.float64)

    if frames.ndim == 1:
        # Un solo frame plano → (1, F)
        frames = frames.reshape(1, -1)
    if frames.ndim != 2:
        raise ValueError(
            f"Sample {sample_index}: landmarks must be 2D (frames, features), got shape {frames.shape}"
        )
    if frames.shape[1] != FEATURES_COUNT:
        raise ValueError(
            f"Sample {sample_index}: expected {FEATURES_COUNT} features per frame, "
            f"got {frames.shape[1]}"
        )
    # Único punto donde entra el dataset, así que normalizar acá garantiza que
    # augmentación, espejo y derivación de deltas vean el pose ya escalado.
    # Es frame a frame a propósito: el modelo estático infiere sobre un frame
    # suelto, sin acceso al resto de la grabación, así que cualquier escala
    # por secuencia divergiría entre entrenamiento e inferencia.
    return normalize_pose_scale(frames)


def validate_training_samples(
    samples: Iterable[Any],
    *,
    label: str = "samples",
) -> list[dict]:
    """Valida estructura y dimensión 258D. Devuelve samples listos para entrenar.

    Omite muestras sin frames (vacías) con warning implícito vía exclusión;
    falla el job si hay keys inválidas o dimensión incorrecta.
    """
    if not isinstance(samples, list):
        raise ValueError(f"Training payload '{label}' must be a list")

    cleaned: list[dict] = []
    for i, item in enumerate(samples):
        if not isinstance(item, dict):
            raise ValueError(f"{label}[{i}] must be an object")

        sign_name = item.get("signName")
        if not sign_name or not isinstance(sign_name, str):
            raise ValueError(f"{label}[{i}] missing or invalid signName")

        frames = _as_landmark_frames(item.get("landmarks"), i)
        if len(frames) == 0:
            continue

        cleaned.append({
            **item,
            "signName": sign_name,
            "landmarks": frames,
        })

    return cleaned


def assert_dataset_ready(sample_names: list[str], *, context: str) -> Counter:
    """Exige mínimo de muestras/clases y avisa clases con una sola muestra."""
    if len(sample_names) < MIN_SAMPLES_TOTAL:
        raise ValueError(
            f"{context}: se necesitan al menos {MIN_SAMPLES_TOTAL} muestras válidas, "
            f"hay {len(sample_names)}"
        )

    counts = Counter(sample_names)
    if len(counts) < MIN_CLASSES:
        raise ValueError(
            f"{context}: se necesitan al menos {MIN_CLASSES} clases, hay {len(counts)}"
        )

    singleton = sorted(name for name, n in counts.items() if n < 2)
    if singleton:
        # No bloquea: el stratify se desactiva solo; sirve como señal de calidad.
        logger.warning(
            "%s: clases con <2 muestras (métricas de validación poco fiables): %s",
            context,
            singleton,
        )
    return counts
