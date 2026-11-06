"""Smoke test end-to-end con TensorFlow real (TR-02).

Solo corre con RUN_TF_SMOKE=1: TensorFlow pesa varios GB, así que el job de CI
lo ejecuta en programado/manual y no en cada PR. Usa 2 señas x 4 muestras
sintéticas y 2 épocas: valida entrenamiento, export TF.js, hash de model.json,
shards declarados y que modelJsonUrl salga relativo a DATA_BASE_DIR (TR-05).
"""

import hashlib
import os
import tempfile
import unittest
from unittest import mock

import numpy as np

from utils import FEATURES_COUNT

RUN_TF_SMOKE = os.getenv("RUN_TF_SMOKE") == "1"


@unittest.skipUnless(RUN_TF_SMOKE, "Set RUN_TF_SMOKE=1 to run the TensorFlow smoke test")
class TfStaticExportSmokeTests(unittest.TestCase):
    def test_static_train_and_export_roundtrip(self):
        import trainer_logic

        rng = np.random.default_rng(0)
        samples = []
        for sign in ("hola", "gracias"):
            for _ in range(4):
                frames = rng.normal(size=(5, FEATURES_COUNT)).tolist()
                samples.append({"signName": sign, "allowMirror": True, "landmarks": frames})

        with tempfile.TemporaryDirectory() as base:
            output_dir = os.path.join(base, "models", "smoke")
            env = {"DATA_BASE_DIR": base}
            with mock.patch.dict(os.environ, env), mock.patch.object(trainer_logic, "EPOCHS", 2):
                result = trainer_logic.train_static_model(
                    samples, output_dir, lambda *args, **kwargs: None
                )

            self.assertEqual(result["modelJsonUrl"], "models/smoke/model.json")
            self.assertEqual(sorted(result["labels"]), ["gracias", "hola"])

            model_json = os.path.join(output_dir, "model.json")
            with open(model_json, "rb") as f:
                self.assertEqual(hashlib.sha256(f.read()).hexdigest(), result["modelJsonSha256"])

            self.assertTrue(result["binUrls"], "TF.js export declared no weight shards")
            for name in result["binUrls"]:
                self.assertTrue(os.path.isfile(os.path.join(output_dir, name)), name)
                with open(os.path.join(output_dir, name), "rb") as f:
                    self.assertEqual(
                        hashlib.sha256(f.read()).hexdigest(), result["binSha256"][name]
                    )


if __name__ == "__main__":
    unittest.main()
