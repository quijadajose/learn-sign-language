"""Regression tests for the run-2 security fixes in the trainer."""

import os
import tempfile
import unittest

import validation


class EmptySampleCapTests(unittest.TestCase):
    def test_empty_samples_count_toward_the_cap(self):
        samples = [{"signName": "a", "landmarks": []}] * (validation.MAX_SAMPLES + 1)
        with self.assertRaises(ValueError):
            validation.validate_training_samples(samples)

    def test_payload_within_cap_is_accepted(self):
        samples = [{"signName": "a", "landmarks": []}] * 5
        self.assertEqual(validation.validate_training_samples(samples), [])


class OutputPathTests(unittest.TestCase):
    def setUp(self):
        self.base = tempfile.mkdtemp(prefix="lsv-base-")
        os.makedirs(os.path.join(self.base, "models"))
        os.makedirs(os.path.join(self.base, "training_data"))
        self.data = os.path.join(self.base, "training_data", "d.json")
        open(self.data, "w").close()

    def test_fresh_output_path_is_accepted(self):
        out = os.path.join(self.base, "models", "model_new")
        self.assertEqual(
            validation.assert_safe_job_paths(self.base, self.data, out),
            (self.data, out),
        )

    def test_existing_output_directory_is_rejected(self):
        existing = os.path.join(self.base, "models", "model_existing")
        os.makedirs(existing)
        with self.assertRaises(ValueError):
            validation.assert_safe_job_paths(self.base, self.data, existing)


if __name__ == "__main__":
    unittest.main()
