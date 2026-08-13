#!/bin/sh
set -eu

# Ensure shared volume dirs exist and are writable by both API (often root)
# and this trainer process (non-root uid 10001). Only the two directories are
# touched: a recursive chmod would rescan every exported model on each boot.
SHARED="${DATA_BASE_DIR:-/shared}"
mkdir -p "$SHARED/training_data" "$SHARED/models"
if [ "$(id -u)" = "0" ]; then
  chown "${TRAINER_UID:-10001}" "$SHARED/training_data" "$SHARED/models" 2>/dev/null || true
  chmod 0777 "$SHARED/training_data" "$SHARED/models" 2>/dev/null || true
fi

if [ "$(id -u)" = "0" ]; then
  # Drop privileges for the long-running worker.
  if command -v gosu >/dev/null 2>&1; then
    exec gosu trainer "$@"
  fi
  if command -v runuser >/dev/null 2>&1; then
    exec runuser -u trainer -- "$@"
  fi
  # No hay forma segura de reconstruir el comando en POSIX sh (printf %q no
  # existe), y correr el worker como root no es una opción.
  echo "docker-entrypoint: gosu/runuser no disponibles, no se puede bajar privilegios" >&2
  exit 1
fi

exec "$@"
