import asyncio
import json
import logging
import os
import resource
import signal
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from bullmq import Worker
from redis.asyncio import Redis

from trainer_logic import train_lstm_model
from validation import (
    TrainingCancelledError,
    assert_safe_job_paths,
    normalize_training_payload,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

REDIS_HOST = os.getenv("VALKEY_HOST", "lsv-valkey")
REDIS_PORT = int(os.getenv("VALKEY_PORT", "6379"))
REDIS_PASSWORD = os.getenv("VALKEY_PASSWORD") or None
TRAINING_QUEUE_NAME = "training-queue"
DATA_BASE_DIR = os.getenv("DATA_BASE_DIR", "/shared")
HEALTH_PORT = int(os.getenv("TRAINER_HEALTH_PORT", "8089"))
MAX_PAYLOAD_MB = float(os.getenv("TRAINER_MAX_PAYLOAD_MB", "512"))
SHUTDOWN_TIMEOUT_S = float(os.getenv("TRAINER_SHUTDOWN_TIMEOUT_S", "30"))
REDIS_CONNECT_ATTEMPTS = int(os.getenv("TRAINER_REDIS_CONNECT_ATTEMPTS", "10"))
REDIS_CONNECT_DELAY_S = float(os.getenv("TRAINER_REDIS_CONNECT_DELAY_S", "3"))
REDIS_CONNECT_TIMEOUT_S = 5.0

# Process-level metrics (Prometheus text exposition on /metrics).
_METRICS = {
    "jobs_started": 0,
    "jobs_completed": 0,
    "jobs_failed": 0,
    "jobs_cancelled": 0,
    "last_job_duration_seconds": 0.0,
    "last_job_rss_mb": 0.0,
}
_METRICS_LOCK = threading.Lock()
_WORKER_READY = threading.Event()

# Stop events de los jobs en vuelo, para poder abortar el fit en el shutdown.
_ACTIVE_STOP_EVENTS: set[threading.Event] = set()
_ACTIVE_STOP_LOCK = threading.Lock()

_PAGE_SIZE = os.sysconf("SC_PAGE_SIZE")


def _rss_mb() -> float:
    """RSS actual. `ru_maxrss` no sirve aquí: es el pico y nunca baja."""
    try:
        with open("/proc/self/statm", "r", encoding="utf-8") as f:
            resident_pages = int(f.read().split()[1])
        return resident_pages * _PAGE_SIZE / (1024.0 * 1024.0)
    except (OSError, IndexError, ValueError):
        return 0.0


def _peak_rss_mb() -> float:
    try:
        # Linux: ru_maxrss es KB.
        return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024.0
    except OSError:
        return 0.0


def _format_prom() -> str:
    with _METRICS_LOCK:
        lines = [
            "# HELP trainer_jobs_started_total Training jobs started",
            "# TYPE trainer_jobs_started_total counter",
            f"trainer_jobs_started_total {_METRICS['jobs_started']}",
            "# HELP trainer_jobs_completed_total Training jobs completed",
            "# TYPE trainer_jobs_completed_total counter",
            f"trainer_jobs_completed_total {_METRICS['jobs_completed']}",
            "# HELP trainer_jobs_failed_total Training jobs failed",
            "# TYPE trainer_jobs_failed_total counter",
            f"trainer_jobs_failed_total {_METRICS['jobs_failed']}",
            "# HELP trainer_jobs_cancelled_total Training jobs cancelled",
            "# TYPE trainer_jobs_cancelled_total counter",
            f"trainer_jobs_cancelled_total {_METRICS['jobs_cancelled']}",
            "# HELP trainer_last_job_duration_seconds Last completed/failed job duration",
            "# TYPE trainer_last_job_duration_seconds gauge",
            f"trainer_last_job_duration_seconds {_METRICS['last_job_duration_seconds']}",
            "# HELP trainer_process_rss_mb Current RSS for process (MB)",
            "# TYPE trainer_process_rss_mb gauge",
            f"trainer_process_rss_mb {_rss_mb():.2f}",
            "# HELP trainer_process_max_rss_mb Peak RSS observed for process (MB)",
            "# TYPE trainer_process_max_rss_mb gauge",
            f"trainer_process_max_rss_mb {_peak_rss_mb():.2f}",
            "# HELP trainer_last_job_rss_mb RSS after last job (MB)",
            "# TYPE trainer_last_job_rss_mb gauge",
            f"trainer_last_job_rss_mb {_METRICS['last_job_rss_mb']}",
            "# HELP trainer_worker_ready 1 if BullMQ worker is listening",
            "# TYPE trainer_worker_ready gauge",
            f"trainer_worker_ready {1 if _WORKER_READY.is_set() else 0}",
        ]
    return "\n".join(lines) + "\n"


class _HealthHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):  # noqa: A003
        return

    def do_GET(self):  # noqa: N802
        if self.path in ("/healthz", "/health"):
            ready = _WORKER_READY.is_set()
            body = json.dumps(
                {
                    "status": "ok" if ready else "starting",
                    "ready": ready,
                    "rssMb": round(_rss_mb(), 2),
                    "peakRssMb": round(_peak_rss_mb(), 2),
                }
            ).encode()
            self.send_response(200 if ready else 503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == "/metrics":
            body = _format_prom().encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        self.send_response(404)
        self.end_headers()


def _start_health_server() -> ThreadingHTTPServer:
    server = ThreadingHTTPServer(("0.0.0.0", HEALTH_PORT), _HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info("Health/metrics listening on :%s (/healthz, /metrics)", HEALTH_PORT)
    return server


def _cancel_active_jobs() -> None:
    with _ACTIVE_STOP_LOCK:
        pending = list(_ACTIVE_STOP_EVENTS)
    for stop_event in pending:
        stop_event.set()
    if pending:
        logger.info("Cancelando %s entrenamiento(s) en curso", len(pending))


async def _drain_active_jobs(timeout_s: float) -> None:
    """Espera a que los jobs cancelados dejen su estado escrito en Redis.

    `worker.close()` no espera al job en vuelo: solo marca el worker como
    cerrado y tira la conexión, con lo que el job quedaría stalled. La
    cancelación se evalúa al final de cada época, así que esto tarda como
    máximo una época.
    """
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        with _ACTIVE_STOP_LOCK:
            if not _ACTIVE_STOP_EVENTS:
                return
        await asyncio.sleep(0.5)
    logger.warning("Quedaron jobs activos tras %ss de espera", timeout_s)


def _classify_error(exc: BaseException) -> str:
    message = str(exc).lower()
    if isinstance(exc, MemoryError) or "out of memory" in message or "oom" in message:
        return (
            "OOM: el proceso se quedó sin memoria. "
            "Aumenta el límite de RAM del servicio lsv-model-trainer "
            "o reduce el tamaño del dataset/augmentations."
        )
    if isinstance(exc, TrainingCancelledError):
        return "cancelled"
    return str(exc)


def _load_training_payload(job_data: dict) -> tuple[Any, str]:
    """Valida paths y tamaño antes de meter el JSON completo en memoria."""
    data_path, output_path = assert_safe_job_paths(
        DATA_BASE_DIR, job_data.get("dataPath"), job_data.get("outputPath")
    )

    path = Path(data_path)
    if not path.is_file():
        raise FileNotFoundError(f"Training data file not found: {data_path}")

    size_mb = path.stat().st_size / (1024.0 * 1024.0)
    if size_mb > MAX_PAYLOAD_MB:
        raise ValueError(
            f"El dataset pesa {size_mb:.0f}MB y supera el límite de "
            f"{MAX_PAYLOAD_MB:.0f}MB (TRAINER_MAX_PAYLOAD_MB). Reduce el número "
            f"de grabaciones o de frames por grabación."
        )

    with path.open("r", encoding="utf-8") as f:
        return json.load(f), output_path


async def process_job(job, token):
    logger.info("Procesando trabajo %s: %s", job.id, job.name)
    data = job.data or {}
    started = time.monotonic()

    lesson_variant_id = data.get("lessonVariantId")
    model_id = data.get("modelId")
    stop_event = threading.Event()

    with _METRICS_LOCK:
        _METRICS["jobs_started"] += 1
    with _ACTIVE_STOP_LOCK:
        _ACTIVE_STOP_EVENTS.add(stop_event)

    try:
        raw_data, output_path = _load_training_payload(data)
        model_type, samples, noise = normalize_training_payload(
            raw_data, fallback_model_type=data.get("modelType")
        )

        if not isinstance(samples, list):
            raise ValueError("Training payload 'samples' must be a list")
        if len(samples) == 0:
            raise ValueError("No training data available")

        logger.info(
            "Muestras cargadas: %s (globalStaticNoise: %s, modelType=%s)",
            len(samples),
            len(noise or []),
            model_type,
        )

        async def on_progress(percent, accuracy):
            try:
                await job.updateProgress({
                    "progress": percent,
                    "accuracy": accuracy,
                    "modelId": model_id,
                })
            except Exception as e:
                on_progress.failures = getattr(on_progress, "failures", 0) + 1
                logger.warning(
                    "No se pudo actualizar progreso del trabajo %s "
                    "(fallo %s/3): %s",
                    job.id,
                    on_progress.failures,
                    e,
                )
                if on_progress.failures >= 3:
                    stop_event.set()
                return
            on_progress.failures = 0

        main_loop = asyncio.get_running_loop()

        def on_progress_sync(percent, accuracy):
            if not main_loop.is_closed():
                asyncio.run_coroutine_threadsafe(
                    on_progress(percent, accuracy), main_loop
                )

        model_results = await asyncio.to_thread(
            train_lstm_model,
            raw_data,
            output_path,
            on_progress_sync,
            stop_event,
            model_type,
        )

        duration = time.monotonic() - started
        with _METRICS_LOCK:
            _METRICS["jobs_completed"] += 1
            _METRICS["last_job_duration_seconds"] = duration
            _METRICS["last_job_rss_mb"] = round(_rss_mb(), 2)

        logger.info(
            "Entrenamiento completado para modelo %s (%.1fs, rss=%.0fMB)",
            model_id,
            duration,
            _rss_mb(),
        )

        return {
            "modelId": model_id,
            "lessonVariantId": lesson_variant_id,
            **model_results,
        }

    except TrainingCancelledError:
        with _METRICS_LOCK:
            _METRICS["jobs_cancelled"] += 1
            _METRICS["last_job_duration_seconds"] = time.monotonic() - started
            _METRICS["last_job_rss_mb"] = round(_rss_mb(), 2)
        logger.warning("Entrenamiento cancelado para modelo %s", model_id)
        raise
    except Exception as e:
        classified = _classify_error(e)
        with _METRICS_LOCK:
            _METRICS["jobs_failed"] += 1
            _METRICS["last_job_duration_seconds"] = time.monotonic() - started
            _METRICS["last_job_rss_mb"] = round(_rss_mb(), 2)
        logger.error("Error en entrenamiento: %s", classified, exc_info=True)
        if classified != str(e):
            raise RuntimeError(classified) from e
        raise
    finally:
        with _ACTIVE_STOP_LOCK:
            _ACTIVE_STOP_EVENTS.discard(stop_event)


async def _wait_for_redis() -> None:
    """Sin esto el worker se marca ready aunque Valkey esté caído."""
    last_error: Exception | None = None
    for attempt in range(1, REDIS_CONNECT_ATTEMPTS + 1):
        client = Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            socket_connect_timeout=REDIS_CONNECT_TIMEOUT_S,
        )
        try:
            await client.ping()
            logger.info("Valkey accesible en %s:%s", REDIS_HOST, REDIS_PORT)
            return
        except Exception as e:
            last_error = e
            logger.warning(
                "Valkey no disponible (intento %s/%s): %s",
                attempt,
                REDIS_CONNECT_ATTEMPTS,
                e,
            )
        finally:
            await client.aclose()

        if attempt < REDIS_CONNECT_ATTEMPTS:
            await asyncio.sleep(REDIS_CONNECT_DELAY_S)

    raise RuntimeError(
        f"No se pudo conectar a Valkey en {REDIS_HOST}:{REDIS_PORT}: {last_error}"
    )


def _install_signal_handlers(shutdown_event: asyncio.Event) -> None:
    loop = asyncio.get_running_loop()

    def request_shutdown(signum) -> None:
        logger.info("Señal %s recibida, cerrando worker...", signum)
        shutdown_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, request_shutdown, sig)
        except NotImplementedError:
            signal.signal(sig, lambda signum, _frame: request_shutdown(signum))


async def main():
    lock_duration_ms = int(os.getenv("TRAINING_LOCK_DURATION_MS", "1800000"))
    health_server = _start_health_server()

    logger.info(
        "Worker de entrenamiento iniciado. Redis=%s:%s DATA_BASE_DIR=%s "
        "lockDuration=%sms",
        REDIS_HOST,
        REDIS_PORT,
        DATA_BASE_DIR,
        lock_duration_ms,
    )

    shutdown_event = asyncio.Event()
    _install_signal_handlers(shutdown_event)

    await _wait_for_redis()

    worker = Worker(
        TRAINING_QUEUE_NAME,
        process_job,
        {
            "connection": {
                "host": REDIS_HOST,
                "port": REDIS_PORT,
                "password": REDIS_PASSWORD,
            },
            "concurrency": 1,
            "lockDuration": lock_duration_ms,
            "autorun": False,
        },
    )
    worker_task = asyncio.create_task(worker.run(), name="bullmq-worker")
    _WORKER_READY.set()

    logger.info("Worker esperando trabajos...")
    shutdown_task = asyncio.create_task(shutdown_event.wait(), name="shutdown")
    done, _ = await asyncio.wait(
        {worker_task, shutdown_task}, return_when=asyncio.FIRST_COMPLETED
    )
    _WORKER_READY.clear()
    shutdown_task.cancel()

    # BullMQ no propaga los errores de su loop: `run()` simplemente retorna. Si
    # no lo tratamos como fatal, el proceso sigue vivo sirviendo /healthz 200
    # sin consumir jobs y `restart: unless-stopped` nunca lo levanta.
    worker_died = worker_task in done
    if worker_died:
        error = worker_task.exception() if not worker_task.cancelled() else None
        logger.error(
            "El loop del worker BullMQ terminó inesperadamente: %s",
            error or "sin excepción",
        )

    logger.info("Cerrando worker (abortando entrenamiento en curso)...")
    _cancel_active_jobs()
    await _drain_active_jobs(SHUTDOWN_TIMEOUT_S)

    try:
        await asyncio.wait_for(worker.close(force=worker_died), timeout=10)
    except asyncio.TimeoutError:
        logger.warning("worker.close() no terminó a tiempo; saliendo igual")
    except Exception:
        logger.exception("Error cerrando el worker BullMQ")

    if not worker_task.done():
        worker_task.cancel()

    health_server.shutdown()
    logger.info("Worker detenido.")

    if worker_died:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
