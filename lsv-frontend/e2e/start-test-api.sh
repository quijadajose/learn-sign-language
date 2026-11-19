#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../lsv-backend"
# exec: así el proceso que recibe SIGTERM del runner es node, no un bash padre.
exec env FRONTEND_URL="${PLAYWRIGHT_FRONTEND_URL:-http://127.0.0.1:4174}" \
  API_PORT=3001 NODE_ENV=test \
  EMAIL_HOST=127.0.0.1 EMAIL_PORT=1025 EMAIL_SECURE=false \
  node --env-file=../.env.test dist/main.js
