# LSV Model Trainer

Worker de entrenamiento de modelos de señas (MLP estático / LSTM dinámico).

Consume jobs de la cola BullMQ `training-queue` (Redis/Valkey), lee el JSON de
landmarks desde el volumen compartido, entrena con TensorFlow y exporta el
modelo a TensorFlow.js.

## Flujo

1. El backend (`TriggerTrainingUseCase`) escribe `/shared/training_data/<id>.json`
   y encola un job con `dataPath`, `outputPath`, `modelId`, `modelType`.
2. Este worker valida paths (bajo `DATA_BASE_DIR`), valida samples 258D y entrena.
3. El resultado del job (accuracy, labels, URLs TFJS, métricas) lo consume el
   backend para marcar el `LessonModel` como `READY`.

## Payload de entrenamiento

Formato actual:

```json
{
  "modelType": "dynamic",
  "samples": [
    { "signName": "Hola", "landmarks": [[0.1, 0.2, "...258 floats"], "...frames"] }
  ],
  "globalStaticNoise": []
}
```

También se acepta el formato legacy (lista plana de samples) **solo si** el job
BullMQ incluye `modelType` (`static` | `dynamic`). Sin eso el worker falla en
lugar de asumir `dynamic`.

## Observabilidad

- `GET :8089/healthz` — ready cuando el worker BullMQ está escuchando
- `GET :8089/metrics` — contadores Prometheus (`trainer_jobs_*`, RSS)

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VALKEY_HOST` | `lsv-valkey` | Host Redis/Valkey |
| `VALKEY_PORT` | `6379` | Puerto |
| `VALKEY_PASSWORD` | _(vacío)_ | Password opcional |
| `DATA_BASE_DIR` | `/shared` | Raíz permitida para `dataPath` / `outputPath` |
| `TRAINING_LOCK_DURATION_MS` | `1800000` (30m) | Lock BullMQ; debe cubrir el fit completo |
| `TRAINER_HEALTH_PORT` | `8089` | Health + métricas |
| `TRAINER_MAX_PAYLOAD_MB` | `512` | Tamaño máximo del JSON de entrenamiento |
| `TRAINER_SHUTDOWN_TIMEOUT_S` | `30` | Espera al job en curso durante el shutdown |
| `TRAINER_REDIS_CONNECT_ATTEMPTS` | `10` | Reintentos de conexión a Valkey al arrancar |
| `TRAINER_REDIS_CONNECT_DELAY_S` | `3` | Espera entre reintentos |

El servicio **no** recibe el `.env` completo: solo necesita las tres variables
de Valkey. El `stop_grace_period` del compose (60s) debe ser mayor que
`TRAINER_SHUTDOWN_TIMEOUT_S` para que el job en vuelo alcance a cancelarse en
vez de quedar stalled.

## Requisitos del dataset

El split de validación es estratificado y se dimensiona con
`resolve_split_plan`, que garantiza `n_test >= n_clases` y `n_train >= n_clases`
(sklearn falla si no se cumple). En la práctica:

- mínimo **2 grabaciones por seña**, si no la clase queda fuera del estrato y se
  entrena sin estratificar;
- con menos de 10 muestras de validación el worker adjunta un warning en
  `logs.warnings`: el `accuracy` reportado no es una medida confiable.

La augmentación (ruido, escala, espejo, time warp, frame dropout) se aplica
**solo al set de train**. El espejo permuta los landmarks simétricos del pose de
MediaPipe además de negar la X, así que el modelo también aprende la versión
zurda de cada seña.

## Ejecución

Con Docker Compose (servicio `lsv-model-trainer`):

```bash
docker compose up -d --build lsv-model-trainer
```

Local (requiere Valkey y volumen `/shared`):

```bash
pip install -r requirements.txt
python -u main.py
```

## Tests

Los tests de utilidades/validación solo necesitan NumPy (nada de TensorFlow):

```bash
pip install -r requirements-dev.txt
ruff check .
mypy
python -m unittest discover -s tests -v
```

## Estructura

```text
main.py            # Worker BullMQ
trainer_logic.py   # Entrenamiento static/dynamic + export TFJS
utils.py           # Escala de pose, recorte 258→202, features 202→340, resample, augment
validation.py      # Paths seguros + validación y normalización de samples
tests/             # Unit tests (sin TensorFlow)
```
