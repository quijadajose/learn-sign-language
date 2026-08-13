"""normalize_training_payload must not silently default legacy lists to dynamic."""

import unittest

from validation import normalize_training_payload


class NormalizeTrainingPayloadTest(unittest.TestCase):
    def test_dict_payload_uses_explicit_type(self):
        model_type, samples, noise = normalize_training_payload(
            {"modelType": "static", "samples": [{"a": 1}], "globalStaticNoise": []},
        )
        self.assertEqual(model_type, "static")
        self.assertEqual(len(samples), 1)
        self.assertEqual(noise, [])

    def test_legacy_list_requires_job_model_type(self):
        with self.assertRaises(ValueError):
            normalize_training_payload([{"landmarks": [[0.0] * 258]}])

    def test_legacy_list_uses_job_fallback(self):
        model_type, samples, noise = normalize_training_payload(
            [{"landmarks": [[0.0] * 258]}],
            fallback_model_type="static",
        )
        self.assertEqual(model_type, "static")
        self.assertEqual(len(samples), 1)
        self.assertEqual(noise, [])

    def test_dict_without_type_uses_fallback(self):
        model_type, samples, _noise = normalize_training_payload(
            {"samples": []},
            fallback_model_type="dynamic",
        )
        self.assertEqual(model_type, "dynamic")
        self.assertEqual(samples, [])

    def test_payload_type_wins_over_job_type(self):
        with self.assertLogs("validation", level="WARNING") as logs:
            model_type, _samples, _noise = normalize_training_payload(
                {"modelType": "static", "samples": []},
                fallback_model_type="dynamic",
            )
        self.assertEqual(model_type, "static")
        self.assertIn("usando payload", logs.output[0])

    def test_rejects_non_list_non_dict_payload(self):
        with self.assertRaises(ValueError) as ctx:
            normalize_training_payload("not-a-payload", fallback_model_type="static")
        self.assertIn("Unsupported training payload type", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
