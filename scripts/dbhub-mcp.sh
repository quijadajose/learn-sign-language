#!/usr/bin/env bash
set -euo pipefail

NPM_CONFIG_PREFIX="${HOME}/.cache/dbhub-mcp"
export NPM_CONFIG_PREFIX
export PATH="${NPM_CONFIG_PREFIX}/bin:${PATH}"
mkdir -p "${NPM_CONFIG_PREFIX}/bin"

if [[ ! -x "${NPM_CONFIG_PREFIX}/bin/dbhub" ]]; then
  npm install -g @bytebase/dbhub@latest --omit=optional
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG="${DBHUB_CONFIG:-${PROJECT_ROOT}/dbhub.toml}"

export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_USERNAME="${DB_USERNAME:-user}"
export DB_PASSWORD="${DB_PASSWORD:-password}"
export DB_DATABASE="${DB_DATABASE:-plataforma}"

if [[ -n "${DBHUB_DSN:-}" ]]; then
  exec dbhub --transport stdio --dsn "${DBHUB_DSN}"
fi

if [[ -f "${CONFIG}" ]]; then
  exec dbhub --transport stdio --config "${CONFIG}"
fi

DSN="postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?sslmode=disable"
exec dbhub --transport stdio --dsn "${DSN}"
