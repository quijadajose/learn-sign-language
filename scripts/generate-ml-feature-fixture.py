#!/usr/bin/env python3
"""Genera schemas/fixtures/dynamic-v3-golden.json.

El fixture es la especificación ejecutable del contrato dynamic-v3: las suites
de Python y de frontend lo cargan y comprueban que su propia implementación
reproduce la salida esperada, en las tres etapas de la cadena (escala de pose,
recorte de landmarks y deltas). Sin esto, `normalize_pose_scale` en el trainer y
`normalizePoseScale` en el frontend pueden divergir sin que ningún test lo note,
que es exactamente la clase de bug que motivó el bump.

Por eso este script NO importa nada del trainer: reimplementa el layout con
aritmética de índices explícita para que sea una segunda opinión y no un eco.

Uso (desde la raíz del repo):
    python3 scripts/generate-ml-feature-fixture.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "schemas" / "ml-feature-contract.json"
OUTPUT_PATH = ROOT / "schemas" / "fixtures" / "dynamic-v3-golden.json"

POSE_LANDMARKS = 33
POSE_VALUES_PER_LANDMARK = 4  # x, y, z, visibility
HAND_LANDMARKS = 21
HAND_VALUES_PER_LANDMARK = 3
HAND_FEATURE_START = POSE_LANDMARKS * POSE_VALUES_PER_LANDMARK  # 132
HAND_BLOCK = HAND_LANDMARKS * HAND_VALUES_PER_LANDMARK  # 63

LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12

# Medias anchuras elegidas para que la escala salga exacta en binario (0.5, 0.5,
# 0.25): así el fixture se puede verificar a mano y el tercer frame demuestra que
# la normalización es por frame, no por secuencia.
SHOULDER_HALF_WIDTHS = [0.25, 0.25, 0.125]
VISIBILITY = 0.9


def build_input_frame(t: int) -> list[float]:
    """258D con pose centrado en el pecho, mano izquierda presente y derecha ausente."""
    frame = [0.0] * (HAND_FEATURE_START + 2 * HAND_BLOCK)

    for landmark in range(POSE_LANDMARKS):
        base = landmark * POSE_VALUES_PER_LANDMARK
        frame[base] = 0.01 * landmark + 0.1 * t
        frame[base + 1] = 0.02 * landmark - 0.05 * t
        frame[base + 2] = 0.005 * landmark
        frame[base + 3] = VISIBILITY

    # Los hombros definen la escala, así que van simétricos respecto al origen.
    half_width = SHOULDER_HALF_WIDTHS[t]
    for landmark, sign in ((LEFT_SHOULDER, 1.0), (RIGHT_SHOULDER, -1.0)):
        base = landmark * POSE_VALUES_PER_LANDMARK
        frame[base] = sign * half_width
        frame[base + 1] = 0.0
        frame[base + 2] = 0.0

    # Mano izquierda relativa a la muñeca; la derecha queda en cero exacto, que
    # es como el frontend codifica "no detectada".
    for joint in range(HAND_LANDMARKS):
        base = HAND_FEATURE_START + joint * HAND_VALUES_PER_LANDMARK
        frame[base] = 0.03 * joint + 0.01 * t
        frame[base + 1] = -0.02 * joint
        frame[base + 2] = 0.01 * joint

    return frame


def pose_scale(frame: list[float]) -> float:
    left = LEFT_SHOULDER * POSE_VALUES_PER_LANDMARK
    right = RIGHT_SHOULDER * POSE_VALUES_PER_LANDMARK
    delta_x = frame[left] - frame[right]
    delta_y = frame[left + 1] - frame[right + 1]
    distance = (delta_x * delta_x + delta_y * delta_y) ** 0.5
    return distance if distance > 1e-6 else 1.0


def normalize(frame: list[float]) -> list[float]:
    """Divide xyz del pose por el ancho de hombros; visibility queda intacto."""
    scale = pose_scale(frame)
    out = list(frame)
    for landmark in range(POSE_LANDMARKS):
        base = landmark * POSE_VALUES_PER_LANDMARK
        out[base] /= scale
        out[base + 1] /= scale
        out[base + 2] /= scale
    return out


def select(frame: list[float], model_landmarks: list[int]) -> list[float]:
    """Recorta el pose al subconjunto del contrato; los bloques de mano pasan enteros."""
    pose = [
        frame[landmark * POSE_VALUES_PER_LANDMARK + offset]
        for landmark in model_landmarks
        for offset in range(POSE_VALUES_PER_LANDMARK)
    ]
    return pose + frame[HAND_FEATURE_START:]


def velocity_indices(landmarks: list[int], model_landmarks: list[int]) -> list[int]:
    """Índices xyz de codos y muñecas, ya sobre el layout recortado."""
    slot = {landmark: position for position, landmark in enumerate(model_landmarks)}
    return [
        slot[landmark] * POSE_VALUES_PER_LANDMARK + axis
        for landmark in landmarks
        for axis in range(3)
    ]


def to_dynamic(
    selected: list[list[float]], velocity_idx: list[int], hand_start: int
) -> list[list[float]]:
    """202D recortado → 340D: base + deltas de manos + deltas de codos/muñecas."""
    output = []
    for t, frame in enumerate(selected):
        previous = selected[t - 1] if t > 0 else None
        hand_deltas = [
            frame[i] - previous[i] if previous else 0.0
            for i in range(hand_start, len(frame))
        ]
        pose_deltas = [
            frame[i] - previous[i] if previous else 0.0 for i in velocity_idx
        ]
        output.append(list(frame) + hand_deltas + pose_deltas)
    return output


def main() -> None:
    contract = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    props = contract["properties"]
    features_count = props["featuresCount"]["const"]
    static_features_count = props["staticFeaturesCount"]["const"]
    dynamic_features_count = props["dynamicFeaturesCount"]["const"]
    velocity_landmarks = props["velocityPoseLandmarks"]["const"]
    model_landmarks = props["modelPoseLandmarks"]["const"]
    model_hand_start = len(model_landmarks) * POSE_VALUES_PER_LANDMARK

    inputs = [build_input_frame(t) for t in range(len(SHOULDER_HALF_WIDTHS))]
    for t, frame in enumerate(inputs):
        if len(frame) != features_count:
            raise AssertionError(
                f"frame {t}: {len(frame)} features, esperaba {features_count}"
            )

    normalized = [normalize(frame) for frame in inputs]
    selected = [select(frame, model_landmarks) for frame in normalized]
    for t, frame in enumerate(selected):
        if len(frame) != static_features_count:
            raise AssertionError(
                f"frame estático {t}: {len(frame)} features, "
                f"esperaba {static_features_count}"
            )

    dynamic = to_dynamic(
        selected,
        velocity_indices(velocity_landmarks, model_landmarks),
        model_hand_start,
    )
    for t, frame in enumerate(dynamic):
        if len(frame) != dynamic_features_count:
            raise AssertionError(
                f"frame dinámico {t}: {len(frame)} features, "
                f"esperaba {dynamic_features_count}"
            )

    payload = {
        "$comment": (
            "AUTO-GENERADO por scripts/generate-ml-feature-fixture.py. "
            "Especificación compartida del contrato de features: lo verifican "
            "lsv-model-trainer/tests/test_golden_fixture.py y "
            "lsv-frontend/src/utils/mlFeatureFixture.test.ts."
        ),
        "featuresSchemaStatic": props["featuresSchemaStatic"]["const"],
        "featuresSchemaDynamic": props["featuresSchemaDynamic"]["const"],
        "featuresCount": features_count,
        "staticFeaturesCount": static_features_count,
        "dynamicFeaturesCount": dynamic_features_count,
        "modelPoseLandmarks": model_landmarks,
        "velocityPoseLandmarks": velocity_landmarks,
        "poseScaleFactors": [pose_scale(frame) for frame in inputs],
        "input258": inputs,
        "expectedNormalized258": normalized,
        "expectedStatic": selected,
        "expectedDynamic": dynamic,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
