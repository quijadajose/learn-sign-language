"""Ensure trainer constants stay aligned with schemas/ml-feature-contract.json."""

import json
import unittest
from pathlib import Path

from utils import (
    DYNAMIC_FEATURES_COUNT,
    FEATURES_COUNT,
    FEATURES_SCHEMA_DYNAMIC,
    FEATURES_SCHEMA_STATIC,
    FIXED_SEQUENCE_LENGTH,
    LEGACY_FEATURES_SCHEMA_DYNAMIC,
    LEGACY_FEATURES_SCHEMA_STATIC,
    MODEL_POSE_LANDMARKS,
    POSE_LANDMARKS,
    STATIC_FEATURES_COUNT,
    VELOCITY_POSE_LANDMARKS,
)


class FeatureContractSyncTest(unittest.TestCase):
    def test_utils_match_shared_schema(self):
        root = Path(__file__).resolve().parents[2]
        contract_path = root / "schemas" / "ml-feature-contract.json"
        with contract_path.open(encoding="utf-8") as f:
            contract = json.load(f)

        props = contract["properties"]
        self.assertEqual(FEATURES_COUNT, props["featuresCount"]["const"])
        self.assertEqual(
            STATIC_FEATURES_COUNT, props["staticFeaturesCount"]["const"]
        )
        self.assertEqual(
            DYNAMIC_FEATURES_COUNT, props["dynamicFeaturesCount"]["const"]
        )
        self.assertEqual(
            FIXED_SEQUENCE_LENGTH, props["fixedDynamicSequenceLength"]["const"]
        )
        self.assertEqual(
            FEATURES_SCHEMA_STATIC, props["featuresSchemaStatic"]["const"]
        )
        self.assertEqual(
            FEATURES_SCHEMA_DYNAMIC, props["featuresSchemaDynamic"]["const"]
        )
        self.assertEqual(
            list(LEGACY_FEATURES_SCHEMA_STATIC),
            props["legacyFeaturesSchemaStatic"]["const"],
        )
        self.assertEqual(
            list(LEGACY_FEATURES_SCHEMA_DYNAMIC),
            props["legacyFeaturesSchemaDynamic"]["const"],
        )
        self.assertEqual(
            list(MODEL_POSE_LANDMARKS),
            props["modelPoseLandmarks"]["const"],
        )
        self.assertEqual(
            list(VELOCITY_POSE_LANDMARKS),
            props["velocityPoseLandmarks"]["const"],
        )

    def test_current_versions_are_not_listed_as_legacy(self):
        self.assertNotIn(FEATURES_SCHEMA_STATIC, LEGACY_FEATURES_SCHEMA_STATIC)
        self.assertNotIn(FEATURES_SCHEMA_DYNAMIC, LEGACY_FEATURES_SCHEMA_DYNAMIC)

    def test_model_pose_landmarks_are_a_valid_subset(self):
        self.assertEqual(
            list(MODEL_POSE_LANDMARKS), sorted(set(MODEL_POSE_LANDMARKS))
        )
        self.assertTrue(set(MODEL_POSE_LANDMARKS).issubset(range(POSE_LANDMARKS)))
        # Los deltas se derivan del bloque recortado: si un landmark de
        # velocidad quedara fuera, el remapeo de índices no tendría destino.
        self.assertTrue(
            set(VELOCITY_POSE_LANDMARKS).issubset(MODEL_POSE_LANDMARKS)
        )


if __name__ == "__main__":
    unittest.main()
