# LSV Model Trainer

Worker de entrenamiento de modelos de señas (MLP estático / LSTM dinámico).

Consume jobs de la cola BullMQ `training-queue` (Redis/Valkey), lee el JSON de
landmarks desde el volumen compartido, entrena con TensorFlow y exporta el
modelo a TensorFlow.js.

## Flujo

1. El backend (`TriggerTrainingUseCase`) escribe `/shared/training_data/<id>.json`
   y encola un job con `dataPath`, `outputPath`, `modelId`, `modelType`.
2. Este worker verifica el HMAC del job, valida paths (bajo `DATA_BASE_DIR`),
   valida samples 258D y entrena.
3. Exporta a TFJS en una carpeta temporal y la cambia por `outputPath` al final
   (nunca queda un modelo a medias ni shards `.bin` de un export anterior).
4. El resultado del job (accuracy, labels, URLs TFJS, `modelJsonSha256`,
   `binSha256`, métricas) lo consume el backend, que verifica los hashes de
   `model.json` y de cada `.bin` antes de marcar el `LessonModel` como `READY`.

## Payload de entrenamiento

Formato actual:

```json
{
  "modelType": "dynamic",
  "samples": [
    {
      "signName": "Hola",
      "landmarks": [[0.1, 0.2, "...258 floats"], "...frames"],
      "allowMirror": true
    }
  ],
  "globalStaticNoise": []
}
```

`allowMirror` es opcional (default `true`). Ponlo en `false` para señas cuyo
significado depende de la lateralidad (por ejemplo, apuntar hacia un lado): el
espejo las confundiría con su versión invertida.

También se acepta el formato legacy (lista plana de samples) **solo si** el job
BullMQ incluye `modelType` (`static` | `dynamic`). Sin eso el worker falla en
lugar de asumir `dynamic`.

## Observabilidad

- `GET :8089/healthz` — ready cuando el worker BullMQ está escuchando
- `GET :8089/metrics` — contadores Prometheus (`trainer_jobs_*`, RSS), incluidos
  `trainer_jobs_rejected_total` (HMAC inválido) y `trainer_jobs_lock_lost_total`

Escucha en `127.0.0.1` por defecto (lo usa el `HEALTHCHECK` del contenedor). Para
que Prometheus lo scrapee desde otro contenedor, define `TRAINER_HEALTH_BIND=0.0.0.0`.

Si BullMQ no logra renovar el lock de un job (Valkey caído, worker congelado),
el entrenamiento se corta en la época siguiente: otro worker podría tomar el job
y escribir el mismo `outputPath`.

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VALKEY_HOST` | `lsv-valkey` | Host Redis/Valkey |
| `VALKEY_PORT` | `6379` | Puerto |
| `VALKEY_PASSWORD` | — | **Obligatoria** |
| `TRAINER_JOB_SECRET` | — | **Obligatoria.** Secreto HMAC compartido con el backend; distinto de `JWT_SECRET` |
| `DATA_BASE_DIR` | `/shared` | Raíz permitida para `dataPath` / `outputPath` |
| `TRAINING_LOCK_DURATION_MS` | `1800000` (30m) | Lock BullMQ; debe cubrir el fit completo |
| `TRAINER_HEALTH_PORT` | `8089` | Health + métricas |
| `TRAINER_HEALTH_BIND` | `127.0.0.1` | Interfaz del server de health/métricas |
| `TRAINER_MAX_PAYLOAD_MB` | `128` | Tamaño máximo del JSON de entrenamiento |
| `TRAINER_MAX_SAMPLES` | `2000` | Máximo de grabaciones por job |
| `TRAINER_MAX_FRAMES` | `600` | Máximo de frames por grabación |
| `TRAINER_SHUTDOWN_TIMEOUT_S` | `30` | Espera al job en curso durante el shutdown |
| `TRAINER_REDIS_CONNECT_ATTEMPTS` | `10` | Reintentos de conexión a Valkey al arrancar |
| `TRAINER_REDIS_CONNECT_DELAY_S` | `3` | Espera entre reintentos |

El servicio **no** recibe el `.env` completo: solo necesita las variables de
Valkey y `TRAINER_JOB_SECRET`. El `stop_grace_period` del compose (60s) debe ser mayor que
`TRAINER_SHUTDOWN_TIMEOUT_S` para que el job en vuelo alcance a cancelarse en
vez de quedar stalled.

## Requisitos del dataset

El split es por grabación y en tres partes:

- **test**: se aparta primero (`resolve_split_plan`, estratificado) y solo se usa
  para el `accuracy` y las métricas reportadas;
- **validación**: sale de lo que queda (`resolve_validation_plan`) y es la que
  miran el early stopping y `ReduceLROnPlateau`;
- **train**: el resto, con augmentación.

En la práctica:

- mínimo **2 grabaciones por seña**, si no la clase queda fuera del estrato y se
  entrena sin estratificar;
- con **4 o más por seña** validación y test van separados. Con menos, la
  validación cae al test y se agrega un warning: el `accuracy` es optimista;
- con menos de 10 muestras de test, o si el fit llega al máximo de épocas sin
  que la validación deje de mejorar, también se agrega un warning en
  `logs.warnings`. `logs.trainingInfo` trae épocas, mejor época, lr final y el
  tamaño de cada parte.

La augmentación (ruido, escala, espejo, time warp, frame dropout) se aplica
**solo al set de train**. El espejo permuta los landmarks simétricos del pose de
MediaPipe además de negar la X, así que el modelo también aprende la versión
zurda de cada seña (salvo `allowMirror: false`).

En el modelo dinámico todo se perturba sobre la secuencia recortada (202D) y
recién después se derivan los deltas, para que las velocidades sigan siendo la
diferencia entre posiciones como en inferencia. El time warp es no uniforme
(ritmo distinto por tramo): uno uniforme lo desharía el resample.

## Contrato de features

Lo define `schemas/ml-feature-contract.json` y lo comparten backend, frontend y
este worker (`ml_feature_contract_generated.py`, generado por
`scripts/sync-ml-feature-contract.mjs`). Vigentes:

- `static-v2`: 202D, un frame, pose escalado por ancho de hombros;
- `dynamic-v4`: 340D × 30 frames. Se remuestrea a 30 frames **antes** de derivar
  los deltas, así que no dependen de los fps de la cámara. Los modelos
  `dynamic-v3` (deltas antes del resample) hay que reentrenarlos.

`schemas/fixtures/dynamic-v4-golden.json` es la especificación ejecutable: la
verifican `tests/test_golden_fixture.py` y el test equivalente del frontend.

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
main.py            # Worker BullMQ (HMAC, lock, health/métricas, shutdown)
trainer_logic.py   # Split, entrenamiento static/dynamic, métricas, export
tfjs_export.py     # Parche de model.json, shards, hashes, swap atómico de carpeta
job_hmac.py        # HMAC de jobs (igual al helper del backend)
utils.py           # Escala de pose, recorte 258→202, features 202→340, resample, augment
validation.py      # Paths seguros, validación de samples, planes de split
tests/             # Unit tests (sin TensorFlow)
```
