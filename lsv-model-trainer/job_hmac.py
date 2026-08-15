"""HMAC-SHA256 of BullMQ training jobs (must match the Nest sign-training-job helper)."""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any


def _canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [_canonicalize(item) for item in value]
    if isinstance(value, dict):
        return {
            key: _canonicalize(item)
            for key, item in sorted(value.items())
            if key != "jobHmac"
        }
    return value


def canonical_job_json(value: Any) -> str:
    return json.dumps(_canonicalize(value), separators=(",", ":"), ensure_ascii=False)


def sign_training_job(job: dict, secret: str) -> str:
    return hmac.new(
        secret.encode("utf-8"),
        canonical_job_json(job).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_training_job_hmac(job: dict, secret: str) -> bool:
    given = job.get("jobHmac")
    if not isinstance(given, str) or not given:
        return False
    expected = sign_training_job(job, secret)
    return hmac.compare_digest(expected, given)
