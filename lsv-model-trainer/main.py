import os
import json
import requests
import numpy as np
import tensorflow as tf
from bullmq import Worker
import asyncio
import logging
import threading
from pathlib import Path
from trainer_logic import train_lstm_model

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

REDIS_HOST = os.getenv('VALKEY_HOST', 'lsv-valkey')
REDIS_PORT = int(os.getenv('VALKEY_PORT', 6379))
REDIS_PASSWORD = os.getenv('VALKEY_PASSWORD', None)
API_URL = os.getenv('API_URL', 'http://lsv-api:3000')
API_REQUEST_TIMEOUT = 30
TRAINING_QUEUE_NAME = 'training-queue'

def is_safe_path(base_dir, path):
    try:
        base = Path(base_dir).resolve()
        target = Path(path).resolve()
        return base in target.parents or base == target
    except Exception:
        return False

async def process_job(job, token):
    logger.info(f"Procesando trabajo {job.id}: {job.name}")
    data = job.data
    
    lesson_variant_id = data.get('lessonVariantId')
    model_id = data.get('modelId')
    data_path = data.get('dataPath')
    output_path = data.get('outputPath')

    base_data_dir = os.environ.get('DATA_BASE_DIR', '/')
    if not is_safe_path(base_data_dir, data_path) or not is_safe_path(base_data_dir, output_path):
        logger.error(f"Alerta de seguridad: Paths inválidos detectados. data_path={data_path}, output_path={output_path}")
        raise ValueError("Invalid paths detected")

    try:
        with open(data_path, 'r') as f:
            raw_data = json.load(f)
            
        logger.info(f"Muestras cargadas: {len(raw_data)}")
        
        if not raw_data or len(raw_data) == 0:
            logger.warning("No hay suficientes datos para iniciar el entrenamiento.")
            raise ValueError("No training data available")
        
        stop_event = threading.Event()
        
        async def on_progress(percent, accuracy):
            try:
                print(f"DEBUG: Reportando progreso {percent}%", flush=True)
                await job.updateProgress({
                    "progress": percent,
                    "accuracy": accuracy,
                    "modelId": model_id
                })
            except Exception as e:
                logger.warning(f"No se pudo actualizar progreso del trabajo {job.id}. Cancelando entrenamiento... Error: {e}")
                stop_event.set()

        main_loop = asyncio.get_event_loop()
        def on_progress_sync(percent, accuracy):
            if main_loop.is_running():
                asyncio.run_coroutine_threadsafe(on_progress(percent, accuracy), main_loop)

        model_results = await asyncio.to_thread(
            train_lstm_model, raw_data, output_path, on_progress_sync, stop_event
        )

        logger.info(f"Entrenamiento completado para modelo {model_id}")
        
        return {
            "modelId": model_id,
            "lessonVariantId": lesson_variant_id,
            **model_results
        }
        
    except Exception as e:
        logger.error(f"Error en entrenamiento: {e}", exc_info=True)
        raise e

if __name__ == "__main__":
    logger.info(f"Worker de entrenamiento iniciado. Conectando a {REDIS_HOST}:{REDIS_PORT}...")
    
    worker = Worker(TRAINING_QUEUE_NAME, process_job, {
        "connection": {
            "host": REDIS_HOST,
            "port": REDIS_PORT,
            "password": REDIS_PASSWORD
        },
        "concurrency": 1,
        "lockDuration": 300000
    })
    
    logger.info("Worker esperando trabajos...")

    loop = asyncio.get_event_loop()
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        logger.info("Worker detenido por el usuario.")
    finally:
        loop.close()