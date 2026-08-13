"""Verifica el trainer contra la especificación compartida del contrato.

El fixture lo genera scripts/generate-ml-feature-fixture.py con aritmética
independiente de utils.py, y la suite del frontend comprueba el mismo archivo.
Si las dos implementaciones de la normalización de pose o del layout de deltas
se separan, uno de los dos lados falla acá.
"""

import json
import unittest
from pathlib import Path

import numpy as np

from utils import (
    DYNAMIC_FEATURES_COUNT,
    FEATURES_COUNT,
    FEATURES_SCHEMA_DYNAMIC,
    FEATURES_SCHEMA_STATIC,
    MODEL_POSE_LANDMARKS,
    STATIC_FEATURES_COUNT,
    normalize_pose_scale,
    pose_scale_factor,
    select_pose_landmarks,
    sequence_to_dynamic,
)

TOLERANCE = 1e-12


def load_fixture() -> dict:
    root = Path(__file__).resolve().parents[2]
    path = root / "schemas" / "fixtures" / "dynamic-v3-golden.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


class GoldenFixtureTest(unittest.TestCase):
    def setUp(self):
        self.fixture = load_fixture()
        self.inputs = np.array(self.fixture["input258"], dtype=np.float64)

    def test_fixture_agrees_with_contract(self):
        self.assertEqual(self.fixture["featuresCount"], FEATURES_COUNT)
        self.assertEqual(self.fixture["staticFeaturesCount"], STATIC_FEATURES_COUNT)
        self.assertEqual(self.fixture["dynamicFeaturesCount"], DYNAMIC_FEATURES_COUNT)
        self.assertEqual(self.fixture["featuresSchemaStatic"], FEATURES_SCHEMA_STATIC)
        self.assertEqual(self.fixture["featuresSchemaDynamic"], FEATURES_SCHEMA_DYNAMIC)
        self.assertEqual(
            self.fixture["modelPoseLandmarks"], list(MODEL_POSE_LANDMARKS)
        )

    def test_pose_scale_factor_matches_fixture(self):
        np.testing.assert_allclose(
            pose_scale_factor(self.inputs),
            np.array(self.fixture["poseScaleFactors"]),
            rtol=0,
            atol=TOLERANCE,
        )

    def test_normalized_pose_matches_fixture(self):
        np.testing.assert_allclose(
            normalize_pose_scale(self.inputs),
            np.array(self.fixture["expectedNormalized258"]),
            rtol=0,
            atol=TOLERANCE,
        )

    def test_selected_landmarks_match_fixture(self):
        expected = np.array(self.fixture["expectedStatic"])
        got = select_pose_landmarks(normalize_pose_scale(self.inputs))
        self.assertEqual(got.shape, expected.shape)
        np.testing.assert_allclose(got, expected, rtol=0, atol=TOLERANCE)

    def test_dynamic_sequence_matches_fixture(self):
        expected = np.array(self.fixture["expectedDynamic"])
        got = sequence_to_dynamic(select_pose_landmarks(normalize_pose_scale(self.inputs)))
        self.assertEqual(got.shape, expected.shape)
        np.testing.assert_allclose(got, expected, rtol=0, atol=TOLERANCE)

    def test_visibility_survives_normalization(self):
        """La confianza vive en [0, 1]: escalarla la sacaría de rango."""
        normalized = normalize_pose_scale(self.inputs)
        visibility = np.arange(33) * 4 + 3
        np.testing.assert_allclose(
            normalized[:, visibility], self.inputs[:, visibility], rtol=0, atol=0
        )

    def test_absent_hand_stays_zero(self):
        """La mano derecha del fixture no está detectada: debe seguir en cero exacto."""
        dynamic = sequence_to_dynamic(
            select_pose_landmarks(normalize_pose_scale(self.inputs))
        )
        right_hand = slice(STATIC_FEATURES_COUNT - 63, STATIC_FEATURES_COUNT)
        self.assertTrue(np.all(dynamic[:, right_hand] == 0.0))


if __name__ == "__main__":
    unittest.main()
