# LSV Backend

API NestJS de la plataforma de aprendizaje de LSV: autenticación, contenido
(lenguas / regiones / etapas / lecciones / quizzes), Sign Studio y
orquestación del entrenamiento ML.

El setup del monorepo (Compose, red `web-proxy`, `.env`) está en el
[README raíz](../README.md). El contrato de features ML está en
[`schemas/ml-feature-contract.json`](../schemas/ml-feature-contract.json).
El worker que consume la cola está documentado en
[`lsv-model-trainer/README.md`](../lsv-model-trainer/README.md).

## Arquitectura

Cortes verticales por feature. Cada slice sigue capas hexagonales:

```text
src/<feature>/
  domain/          # entidades, puertos, reglas (sin Nest)
  application/     # use-cases / servicios de aplicación
  infrastructure/  # controllers, TypeORM, adapters (BullMQ, disco, mail)
```

Las reglas las aplica `dependency-cruiser` (`.dependency-cruiser.js`):

- `domain` no importa `application` ni `infrastructure`
- `application` solo habla con puertos de `domain`, no con adapters
- un slice no importa la `infrastructure` de otro (componer vía módulos Nest)

Kernel compartido: `src/shared/` (entidades TypeORM, uploads, middleware de
`/shared`). Auth y permissions son concerns transversales (guards/decorators).

## Módulos

| Slice | Rol |
|-------|-----|
| `auth` | registro, login, JWT, Google OAuth, reset de password |
| `permissions` / `moderator` | RBAC por lengua/región |
| `language` / `region` / `stage` / `lesson` / `quiz` | contenido y variantes |
| `user-lesson` / `leaderboard` / `users` | progreso y ranking |
| `sign-record` | grabaciones, landmarks, cola de entrenamiento, modelos |
| `health` | probes de API, Postgres, Valkey, SSL y dominio |

## Auth y permisos

JWT global (`JwtAuthGuard`). Rutas públicas llevan `@Public()`.

- **Email/password:** `POST /auth/register`, `POST /auth/login`
- **Google:** `GET /auth/google` → callback guarda un código de un solo uso en
  Valkey y redirige a `{FRONTEND_URL}/login?code=...`. El front intercambia el
  código en `POST /auth/google/exchange`. El JWT **no** va en el redirect.
- **Reset:** `POST /auth/password/reset` + `POST /auth/password/reset/confirm`
- **Roles:** `admin` (acceso total), `moderator` (scopes de lengua/región vía
  `ResourceAccessGuard`), `user`
- Throttling Redis (100 req/min por defecto; auth más estricto)

Header de API: `Authorization: Bearer <jwt>`.

## Pipeline de señas

1. El moderador guarda grabaciones y landmarks (`/sign-record`, body hasta 50 mb).
2. `TriggerTrainingUseCase` escribe
   `{SHARED_DATA_DIR}/training_data/<modelId>.json`, crea un `LessonModel`
   `PENDING` y encola `train-lesson-model` en BullMQ (`training-queue`).
3. El worker valida paths bajo `DATA_BASE_DIR`, entrena (MLP estático / LSTM
   dinámico) y exporta TFJS a `{WORKER_SHARED_DATA_DIR}/models/model_<id>/`.
4. `SignRecordEvents` escucha la cola: `TRAINING` → progreso →
   `SaveModelResultsUseCase` marca el modelo `READY` y notifica por WebSocket.
5. Artefactos: `GET /shared/models/...` exige JWT. `GET /shared/training_data`
   está bloqueado (403).

Jobs con `attempts: 1`. Si falla el enqueue, el use-case hace rollback
(cola + JSON + fila `LessonModel`).

Payload que escribe el backend (el worker lo documenta con más detalle):

```json
{
  "modelType": "dynamic",
  "samples": [{ "signName": "Hola", "landmarks": [[0.1, 0.2]] }],
  "globalStaticNoise": []
}
```

Puede disparar **dos** jobs por variante de lección (estático y dinámico) si
hay grabaciones de ambos tipos.

## Variables de entorno

Validadas al arrancar (`src/config/env-config.ts`). Copia
[`.env.example`](../.env.example) en la raíz del monorepo.

| Variable | Uso |
|----------|-----|
| `NODE_ENV` | `development` \| `production` \| `test` |
| `API_PORT` | Puerto declarado (Compose publica `3000:3000`) |
| `FRONTEND_URL` | CORS + redirect de OAuth |
| `JWT_SECRET` | Firma JWT (obligatorio y distinto en cada entorno) |
| `DB_*` | Postgres (`lsv-db` en Compose, `127.0.0.1` en host) |
| `VALKEY_*` | Cola BullMQ, OAuth codes, throttling |
| `GOOGLE_*` | OAuth (`GOOGLE_CALLBACK_URL` debe coincidir con la consola) |
| `EMAIL_*` | SMTP para reset de password |
| `API_ADMIN_*` / `API_USER_*` | Seed de cuentas (cambiar antes de prod) |
| `SENTRY_DSN` | Opcional |
| `SHARED_DATA_DIR` | Vista API del volumen (`/src/app/shared` en Docker) |
| `WORKER_SHARED_DATA_DIR` | Paths que se meten en el job (`/shared`) |
| `RUN_MIGRATIONS` | Default `true`. `false` si las corre un job aparte (multi-réplica) |

El proceso escucha en `3000` salvo que se defina `PORT`. Compose inyecta
`SHARED_DATA_DIR` y `WORKER_SHARED_DATA_DIR`; no hace falta ponerlas en `.env`
para el flujo Docker.

## Ejecución

Con Docker Compose (recomendado):

```bash
cp .env.example .env
docker network create web-proxy   # solo la primera vez
docker compose up -d --build lsv-api
```

API: http://localhost:3000  
Swagger (solo `NODE_ENV=development`): http://localhost:3000/api/docs

Local (requiere Postgres y Valkey alcanzables vía `.env`):

```bash
npm ci
npm run start:dev
```

Producción: `npm run build` && `npm run start:prod` (o imagen Compose
`docker-compose.prod.yml`).

## Migraciones (TypeORM)

`synchronize: false`. En un solo proceso las migraciones corren al arrancar
(`migrationsRun`).

```bash
npm run migration:generate src/db/migrations/Nombre
npm run migration:run
npm run migration:revert
```

Los scripts usan `--env-file=.env` relativo a `lsv-backend/`. Si el `.env`
vive en la raíz del monorepo, ejecútalos desde Compose o apunta el env file.

## Tests y quality gates

```bash
npm ci
npm run lint:check
npm run validate-infrastructure   # dependency-cruiser
npm run typecheck:strict          # sign-record/domain + oauth-code.store
npm test                          # unit (Jest, umbral global bajo)
npm run test:e2e:smoke            # auth + health + sign-record
# npm run test:e2e                # suite e2e completa (Postgres + Valkey)
```

Smoke e2e lee `../.env.test`. CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Observabilidad e i18n

- Health (públicos): `GET /health/api`, `/health/database`, `/health/valkey`,
  `/health/ssl`, `/health/domain`
- Body: 50 mb en `/sign-record`, 1 mb en el resto
- Mensajes de error ES/EN vía `Accept-Language` (`src/i18n/`)
- Sentry (`src/instrument.ts`) si hay `SENTRY_DSN`

Vulnerabilidades: [SECURITY.md](../SECURITY.md).
