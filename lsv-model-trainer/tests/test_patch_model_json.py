"""Unit tests for TFJS model.json patching (no TensorFlow required)."""

import json
import os
import tempfile
import unittest

from tfjs_export import (
    assert_patched_model_json,
    patch_model_json,
    strip_sequential_weight_prefix,
)


class StripSequentialPrefixTests(unittest.TestCase):
    def test_strips_sequential_variants(self):
        self.assertEqual(
            strip_sequential_weight_prefix("sequential/dense/kernel"),
            "dense/kernel",
        )
        self.assertEqual(
            strip_sequential_weight_prefix("sequential_12/lstm/kernel"),
            "lstm/kernel",
        )
        self.assertEqual(
            strip_sequential_weight_prefix("dense/kernel"),
            "dense/kernel",
        )
        self.assertEqual(
            strip_sequential_weight_prefix("my_sequential/foo"),
            "my_sequential/foo",
        )


class PatchModelJsonTests(unittest.TestCase):
    def test_patches_weights_and_input_shape(self):
        payload = {
            "modelTopology": {
                "model_config": {
                    "layers": [
                        {
                            "class_name": "InputLayer",
                            "config": {"dtype": {"type": "float32"}},
                        },
                        {"class_name": "Dense", "config": {}},
                    ]
                }
            },
            "weightsManifest": [
                {
                    "weights": [
                        {"name": "sequential/dense/kernel", "shape": [3, 2]},
                        {"name": "sequential_1/dense/bias", "shape": [2]},
                    ]
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "model.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload, f)

            patch_model_json(path, [None, 258])

            with open(path, encoding="utf-8") as f:
                patched = json.load(f)

            names = [
                w["name"] for w in patched["weightsManifest"][0]["weights"]
            ]
            self.assertEqual(names, ["dense/kernel", "dense/bias"])
            layer0 = patched["modelTopology"]["model_config"]["layers"][0]
            self.assertEqual(layer0["config"]["batch_input_shape"], [None, 258])
            self.assertEqual(layer0["config"]["dtype"], "float32")
            self.assertFalse(os.path.exists(path + ".tmp"))
            assert_patched_model_json(patched)

    def test_raises_when_export_produced_no_model_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                patch_model_json(os.path.join(tmp, "model.json"), [None, 258])

    def test_tolerates_non_dict_layer_entries(self):
        payload = {
            "modelTopology": {"model_config": {"layers": ["unexpected", None]}},
            "weightsManifest": [{"weights": [{"name": "dense/kernel"}]}],
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "model.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload, f)
            patch_model_json(path, [None, 258])

    def test_assert_rejects_remaining_prefix(self):
        with self.assertRaises(ValueError):
            assert_patched_model_json(
                {
                    "weightsManifest": [
                        {"weights": [{"name": "sequential/dense/kernel"}]}
                    ]
                }
            )


if __name__ == "__main__":
    unittest.main()
