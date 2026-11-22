"""TR-01: cada job libera la sesión de Keras y fuerza un gc, también si falla.

CI no instala TensorFlow, BullMQ ni redis (requirements-dev.txt), así que se
sustituyen por stubs antes de importar `main`. No se entrena ningún modelo.
"""

import asyncio
import gc
import os
import sys
import threading
import types
import unittest
from unittest import mock

from validation import TrainingCancelledError


def _import_main_with_stubs():
    bullmq = types.ModuleType("bullmq")
    bullmq.Worker = mock.MagicMock()
    bullmq.UnrecoverableError = type("UnrecoverableError", (Exception,), {})
    redis = types.ModuleType("redis")
    redis_asyncio = types.ModuleType("redis.asyncio")
    redis_asyncio.Redis = mock.MagicMock()
    redis.asyncio = redis_asyncio
    trainer_logic = types.ModuleType("trainer_logic")
    trainer_logic.train_model = mock.MagicMock()
    trainer_logic.clear_keras_session = mock.MagicMock()

    stubs = {
        "bullmq": bullmq,
        "redis": redis,
        "redis.asyncio": redis_asyncio,
        "trainer_logic": trainer_logic,
    }
    env = {"VALKEY_PASSWORD": "test", "TRAINER_JOB_SECRET": "test"}
    # patch.dict restaura sys.modules entero: lo que `main` importe por primera
    # vez aquí dentro se descarta luego. `gc` ya está importado arriba, así que
    # el test y `main` comparten el mismo módulo y se puede parchear.
    with mock.patch.dict(sys.modules, stubs), mock.patch.dict(os.environ, env):
        sys.modules.pop("main", None)
        import main

        sys.modules.pop("main", None)
    return main


main = _import_main_with_stubs()


class _Job:
    id = "job-1"
    name = "train"
    data = {"modelId": "m1", "lessonVariantId": "v1", "modelType": "static"}

    async def updateProgress(self, _payload):  # noqa: N802
        return None


class ProcessJobMemoryCleanupTest(unittest.TestCase):
    def setUp(self):
        self.calls: list[tuple[str, int]] = []

        def record(name):
            return lambda *a, **k: self.calls.append((name, threading.get_ident()))

        self.clear_session = mock.Mock(side_effect=record("clear_session"))
        self.gc_collect = mock.Mock(side_effect=record("gc_collect"))
        self.train = mock.Mock()
        patches = [
            mock.patch.object(main, "verify_training_job_hmac", return_value=True),
            mock.patch.object(
                main, "_load_training_payload", return_value=({"samples": [1]}, "/out")
            ),
            mock.patch.object(
                main, "normalize_training_payload", return_value=("static", [1], [])
            ),
            mock.patch.object(main, "train_model", self.train),
            mock.patch.object(main, "clear_keras_session", self.clear_session, create=True),
            mock.patch.object(gc, "collect", self.gc_collect),
        ]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)

    def _set_train(self, result=None, exc=None):
        def train(*_args):
            self.calls.append(("train", threading.get_ident()))
            if exc is not None:
                raise exc
            return result

        self.train.side_effect = train

    def _run_job(self):
        return asyncio.run(main.process_job(_Job(), "token"))

    def _assert_cleaned_once_after_training(self):
        names = [name for name, _ in self.calls]
        self.assertEqual(names, ["train", "clear_session", "gc_collect"])
        # Keras 3 guarda su estado por hilo: hay que limpiar en el hilo que entrenó.
        threads = {tid for _, tid in self.calls}
        self.assertEqual(len(threads), 1)

    def test_cleans_up_after_successful_job(self):
        self._set_train(result={"modelJsonUrl": "/out/model.json"})
        result = self._run_job()
        self.assertEqual(result["modelJsonUrl"], "/out/model.json")
        self._assert_cleaned_once_after_training()

    def test_cleans_up_after_failed_job(self):
        self._set_train(exc=ValueError("dataset roto"))
        with self.assertRaises(ValueError):
            self._run_job()
        self._assert_cleaned_once_after_training()

    def test_cleans_up_after_cancelled_job(self):
        self._set_train(exc=TrainingCancelledError("cancelled"))
        with self.assertRaises(TrainingCancelledError):
            self._run_job()
        self._assert_cleaned_once_after_training()

    def test_cleans_up_on_every_job(self):
        self._set_train(result={})
        for _ in range(3):
            self._run_job()
        names = [name for name, _ in self.calls]
        self.assertEqual(names, ["train", "clear_session", "gc_collect"] * 3)

    def test_cleanup_error_does_not_mask_training_result(self):
        self._set_train(result={"ok": True})
        self.clear_session.side_effect = RuntimeError("keras")
        with self.assertLogs(main.logger, level="WARNING"):
            result = self._run_job()
        self.assertTrue(result["ok"])
        self.gc_collect.assert_called_once()


if __name__ == "__main__":
    unittest.main()
