import tempfile
import unittest
from pathlib import Path

import numpy as np

from utils import FEATURES_COUNT, HAND_FEATURE_START, POSE_LANDMARKS
from validation import (
    assert_dataset_ready,
    assert_safe_job_paths,
    is_safe_path,
    validate_training_samples,
)


def _sample(name: str, frames: int = 3, features: int = FEATURES_COUNT):
    return {
        "signName": name,
        "landmarks": np.zeros((frames, features)).tolist(),
    }


def _posed_sample(name: str, half_width: float, pose_value: float = 1.0):
    """Sample con hombros a un ancho conocido, para observar la normalización."""
    frame = np.zeros(FEATURES_COUNT)
    for landmark in range(POSE_LANDMARKS):
        base = landmark * 4
        frame[base : base + 3] = pose_value
        frame[base + 3] = 0.5
    frame[11 * 4] = half_width
    frame[11 * 4 + 1] = 0.0
    frame[12 * 4] = -half_width
    frame[12 * 4 + 1] = 0.0
    frame[HAND_FEATURE_START:] = 0.7
    return {"signName": name, "landmarks": [frame.tolist()]}


class PathSafetyTests(unittest.TestCase):
    def test_rejects_none_and_outside(self):
        self.assertFalse(is_safe_path("/shared", None))
        self.assertFalse(is_safe_path("/shared", "/etc/passwd"))
        self.assertTrue(is_safe_path("/shared", "/shared/training_data/a.json"))
        self.assertTrue(is_safe_path("/shared", "/shared"))

    def test_assert_safe_job_paths(self):
        with self.assertRaises(ValueError):
            assert_safe_job_paths("/shared", None, "/shared/models/x")
        with self.assertRaises(ValueError):
            assert_safe_job_paths("/shared", "/tmp/x.json", "/shared/models/x")
        assert_safe_job_paths(
            "/shared",
            "/shared/training_data/a.json",
            "/shared/models/model_1",
        )


class SampleValidationTests(unittest.TestCase):
    def test_accepts_valid_and_skips_empty(self):
        cleaned = validate_training_samples([
            _sample("A", frames=2),
            {"signName": "B", "landmarks": []},
        ])
        self.assertEqual(len(cleaned), 1)
        self.assertEqual(cleaned[0]["signName"], "A")
        self.assertEqual(cleaned[0]["landmarks"].shape, (2, FEATURES_COUNT))

    def test_rejects_too_many_frames(self):
        with self.assertRaises(ValueError) as ctx:
            validate_training_samples([_sample("A", frames=601)])
        self.assertIn("TRAINER_MAX_FRAMES", str(ctx.exception))

    def test_rejects_too_many_samples(self):
        samples = [_sample("A" if i % 2 == 0 else "B", frames=1) for i in range(2001)]
        with self.assertRaises(ValueError) as ctx:
            validate_training_samples(samples)
        self.assertIn("TRAINER_MAX_SAMPLES", str(ctx.exception))

    def test_rejects_wrong_feature_count(self):
        with self.assertRaises(ValueError) as ctx:
            validate_training_samples([_sample("A", features=10)])
        self.assertIn("258", str(ctx.exception))

    def test_rejects_missing_sign_name(self):
        with self.assertRaises(ValueError):
            validate_training_samples([{"landmarks": [[0.0] * FEATURES_COUNT]}])

    def test_normalizes_pose_scale_on_load(self):
        """El único punto de entrada del dataset tiene que escalar el pose.

        Si no lo hiciera acá, la augmentación y los deltas se derivarían de un
        pose sin escalar y el modelo vería una distribución distinta a la de
        inferencia, que es justo lo que arregla dynamic-v3.
        """
        cleaned = validate_training_samples([_posed_sample("A", half_width=0.25)])
        frame = cleaned[0]["landmarks"][0]
        # Escala 0.5, así que el xyz del pose se duplica.
        np.testing.assert_allclose(frame[0:3], 2.0)
        # visibility y manos quedan intactas.
        self.assertAlmostEqual(frame[3], 0.5)
        np.testing.assert_allclose(frame[HAND_FEATURE_START:], 0.7)

    def test_load_is_invariant_to_camera_distance(self):
        """Dos grabaciones del mismo gesto a distinta distancia cargan iguales."""
        near = validate_training_samples([_posed_sample("A", 0.25, pose_value=1.0)])
        far = validate_training_samples([_posed_sample("A", 0.125, pose_value=0.5)])
        np.testing.assert_allclose(
            near[0]["landmarks"], far[0]["landmarks"]
        )

    def test_assert_dataset_ready(self):
        with self.assertRaises(ValueError):
            assert_dataset_ready(["A"], context="t")
        with self.assertRaises(ValueError):
            assert_dataset_ready(["A", "A"], context="t")
        counts = assert_dataset_ready(["A", "B", "A"], context="t")
        self.assertEqual(counts["A"], 2)
        self.assertEqual(counts["B"], 1)


class TempPathResolveTests(unittest.TestCase):
    def test_resolved_paths_under_base(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp) / "shared"
            base.mkdir()
            data = base / "training_data" / "job.json"
            data.parent.mkdir()
            data.write_text("[]", encoding="utf-8")
            assert_safe_job_paths(str(base), str(data), str(base / "models" / "m1"))


if __name__ == "__main__":
    unittest.main()
