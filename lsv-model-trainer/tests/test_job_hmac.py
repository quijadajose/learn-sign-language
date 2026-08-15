import unittest

from job_hmac import canonical_job_json, sign_training_job, verify_training_job_hmac


class JobHmacTests(unittest.TestCase):
    secret = "test-hmac-secret"

    def test_roundtrip(self):
        job = {
            "modelId": "m1",
            "modelType": "static",
            "dataPath": "/shared/training_data/a.json",
            "outputPath": "/shared/models/m1",
        }
        hmac_hex = sign_training_job(job, self.secret)
        self.assertEqual(len(hmac_hex), 64)
        self.assertTrue(
            verify_training_job_hmac({**job, "jobHmac": hmac_hex}, self.secret)
        )

    def test_key_order_independent(self):
        a = sign_training_job({"b": 1, "a": 2, "dataPath": "/x"}, self.secret)
        b = sign_training_job({"dataPath": "/x", "a": 2, "b": 1}, self.secret)
        self.assertEqual(a, b)

    def test_rejects_tamper(self):
        job = {"modelId": "m1", "dataPath": "/shared/a.json"}
        hmac_hex = sign_training_job(job, self.secret)
        self.assertFalse(
            verify_training_job_hmac(
                {**job, "dataPath": "/etc/passwd", "jobHmac": hmac_hex},
                self.secret,
            )
        )

    def test_omits_job_hmac(self):
        self.assertEqual(
            canonical_job_json({"a": 1, "jobHmac": "deadbeef"}),
            canonical_job_json({"a": 1}),
        )

    def test_matches_node_hmac_fixture(self):
        job = {
            "modelId": "m1",
            "modelType": "static",
            "dataPath": "/shared/training_data/a.json",
            "outputPath": "/shared/models/m1",
        }
        self.assertEqual(
            sign_training_job(job, self.secret),
            "07d6e78b4e8e9b74fbb11e8f8652073611bdb381c1bc8f3a680df645812c8133",
        )


if __name__ == "__main__":
    unittest.main()
