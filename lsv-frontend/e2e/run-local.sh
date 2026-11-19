#!/usr/bin/env bash
# Corre la suite e2e del frontend con base de test limpia (H1).
#
#   npm run test:e2e:local [-- <args de playwright>]
#
# - Recrea los contenedores de test (proyecto lsv-test) para empezar con la base vacía.
# - Arranca la API de test en el puerto 3001 y la apaga al salir.
# - No mata procesos ajenos: si 3001 o 4174 ya están ocupados, se detiene.
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$FRONTEND_DIR/../lsv-backend"
API_PORT=3001
WEB_PORT=4174

port_busy() {
  ss -ltn | grep -q ":$1 "
}

if port_busy "$API_PORT" || port_busy "$WEB_PORT"; then
  echo "run-local: el puerto $API_PORT o $WEB_PORT ya está en uso por otro proceso." >&2
  echo "Ciérralo tú (no lo mato automáticamente) y vuelve a correr el comando." >&2
  exit 1
fi

cd "$BACKEND_DIR"
npm run test:e2e:down >/dev/null 2>&1 || true
npm run test:e2e:up

if [[ ! -f dist/main.js ]] || [[ -n "$(find src -newer dist/main.js -print -quit)" ]]; then
  echo "run-local: compilando la API de test..."
  npm run build
fi

cd "$FRONTEND_DIR"
api_pid=""
cleanup() {
  if [[ -n "$api_pid" ]] && kill -0 "$api_pid" 2>/dev/null; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

bash e2e/start-test-api.sh &
api_pid=$!

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:$API_PORT/health/api" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$api_pid" 2>/dev/null; then
    echo "run-local: la API de test se detuvo al arrancar." >&2
    exit 1
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:$API_PORT/health/api" >/dev/null 2>&1; then
  echo "run-local: la API de test no respondió en 60 s." >&2
  exit 1
fi

npm run test:e2e -- "$@"
