"""Smoke tests for trainer export contract consumed by the backend."""

import unittest

from utils import (
    DYNAMIC_FEATURES_COUNT,
    FEATURES_SCHEMA_DYNAMIC,
    FEATURES_SCHEMA_STATIC,
    FIXED_SEQUENCE_LENGTH,
    STATIC_FEATURES_COUNT,
    public_model_json_path,
)

REQUIRED_RESULT_KEYS = {
    "accuracy",
    "labels",
    "logs",
    "modelJsonUrl",
    "binUrls",
    "featuresCount",
    "modelType",
    "featuresSchemaVersion",
    "modelJsonSha256",
    "binSha256",
}


def build_fake_export(*, model_type: str = "static") -> dict:
    """Mirrors the return shape of trainer_logic.train_lstm_model without TF."""
    schema = (
        FEATURES_SCHEMA_STATIC
        if model_type == "static"
        else FEATURES_SCHEMA_DYNAMIC
    )
    features = STATIC_FEATURES_COUNT if model_type == "static" else DYNAMIC_FEATURES_COUNT
    return {
        "accuracy": 0.92,
        "labels": ["hola", "adios"],
        "logs": {"loss": [0.1], "accuracy": [0.9]},
        "modelJsonUrl": "/shared/models/demo/model.json",
        "binUrls": ["group1-shard1of1.bin"],
        "modelJsonSha256": "a" * 64,
        "binSha256": {"group1-shard1of1.bin": "b" * 64},
        "sequenceLength": FIXED_SEQUENCE_LENGTH if model_type == "dynamic" else 1,
        "featuresCount": features,
        "modelType": model_type,
        "featuresSchemaVersion": schema,
        "warnings": [],
        "classMetrics": {},
        "confusionMatrix": [],
    }


class ExportShapeTests(unittest.TestCase):
    def test_static_export_has_backend_required_keys(self):
        payload = build_fake_export(model_type="static")
        self.assertTrue(REQUIRED_RESULT_KEYS.issubset(payload.keys()))
        self.assertEqual(payload["featuresCount"], STATIC_FEATURES_COUNT)
        self.assertEqual(payload["featuresSchemaVersion"], FEATURES_SCHEMA_STATIC)
        self.assertIsInstance(payload["binUrls"], list)
        self.assertTrue(all(isinstance(x, str) for x in payload["binUrls"]))
        self.assertGreaterEqual(payload["accuracy"], 0)
        self.assertLessEqual(payload["accuracy"], 1)
        self.assertEqual(set(payload["binSha256"]), set(payload["binUrls"]))

    def test_dynamic_export_schema(self):
        payload = build_fake_export(model_type="dynamic")
        self.assertEqual(payload["featuresCount"], DYNAMIC_FEATURES_COUNT)
        self.assertEqual(
            payload["featuresSchemaVersion"], FEATURES_SCHEMA_DYNAMIC
        )
        self.assertEqual(payload["sequenceLength"], FIXED_SEQUENCE_LENGTH)


if __name__ == "__main__":
    unittest.main()


def test_public_model_json_path_is_relative_to_data_dir(tmp_path, monkeypatch):
    """TR-05: el trainer reporta modelJsonUrl relativo a DATA_BASE_DIR."""
    base = tmp_path / 'shared'
    model_dir = base / 'models' / 'job1'
    model_dir.mkdir(parents=True)
    monkeypatch.setenv('DATA_BASE_DIR', str(base))
    assert public_model_json_path(str(model_dir / 'model.json')) == 'models/job1/model.json'


def test_public_model_json_path_rejects_outside_data_dir(tmp_path, monkeypatch):
    import pytest

    base = tmp_path / 'shared'
    base.mkdir()
    monkeypatch.setenv('DATA_BASE_DIR', str(base))
    with pytest.raises(RuntimeError):
        public_model_json_path(str(tmp_path / 'elsewhere' / 'model.json'))
