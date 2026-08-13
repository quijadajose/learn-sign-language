# Plataforma para el Aprendizaje del Lenguaje de Señas Venezolano (LSV)

Monorepo con backend NestJS, frontend React y worker de entrenamiento TensorFlow para detección de señas.

[![Status](https://img.shields.io/badge/Estado-Monitor-brightgreen)](https://stats.uptimerobot.com/n46WRvlnZD)

## Estructura

| Paquete | Stack | Rol |
|---------|--------|-----|
| `lsv-backend` | NestJS, TypeORM, PostgreSQL, BullMQ, Valkey | API, auth, lecciones, pipeline de signos |
| `lsv-frontend` | React 18, Vite, Tailwind, TF.js, MediaPipe | UI estudiante / admin / Sign Studio |
| `lsv-model-trainer` | Python 3.11, TensorFlow | Worker de entrenamiento (cola BullMQ) |

Contrato compartido de features ML: [`schemas/ml-feature-contract.json`](schemas/ml-feature-contract.json).

### i18n (ES / EN)

- **Frontend:** `i18next` + `react-i18next` (`lsv-frontend/src/i18n/`). Selector de idioma de interfaz en landing, auth y navbar (independiente del idioma de señas).
- **Backend:** mensajes de error localizados vía `Accept-Language` (`lsv-backend/src/i18n/`). El front envía el locale actual en cada request.
- **Python trainer:** sin i18n (solo códigos/datos consumidos por Nest).

Regenerar constantes FE/BE/Python tras cambiar el schema:

```bash
node scripts/sync-ml-feature-contract.mjs
node scripts/sync-ml-feature-contract.mjs --check   # CI
```

Si cambia el layout del vector de features, regenerar también el fixture dorado
que las suites de Python y de frontend usan para detectar divergencias entre las
dos implementaciones:

```bash
python3 scripts/generate-ml-feature-fixture.py
```

## Requisitos previos

1. Docker + Docker Compose
2. Red externa `web-proxy` (usada por Compose):

```bash
docker network create web-proxy
```

3. Copia `.env.example` → `.env` y **cambia todos los secretos** antes de cualquier entorno compartido.

## Desarrollo local

```bash
cp .env.example .env
docker network create web-proxy   # solo la primera vez
docker compose up -d
```

- Frontend: http://localhost:8080  
- API: http://localhost:3000  
- El override de desarrollo monta código con hot-reload y expone Postgres/pgAdmin/Redis Commander.

### Quality gates locales

```bash
# En la raíz (instala husky)
npm install

# Backend
cd lsv-backend && npm ci && npm run lint && npm test && npm run build
# Smoke e2e (requires Postgres + Valkey reachable via .env.test)
# npm run test:e2e:smoke

# Frontend
cd lsv-frontend && npm ci && npm run typecheck && npm run lint && npm test

# Trainer
cd lsv-model-trainer && pip install numpy && python -m unittest discover -s tests -v
```

Husky ejecuta lint/tests del paquete tocado en cada commit.

## Producción

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Incluye `lsv-api`, `lsv-frontend` y `lsv-model-trainer` (imágenes GHCR).  
El deploy a producción está automatizado con GitHub Actions al hacer push a `main`.

CI en PRs: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (lint/test backend, frontend y trainer).

## Contribuciones

1. Fork + rama `feature/...`
2. Asegura que pasan los checks de CI
3. Abre un pull request

## Seguridad

Ver [SECURITY.md](SECURITY.md) para reportar vulnerabilidades.

## Roadmap

[Projects](https://github.com/quijadajose?tab=projects)
