#!/usr/bin/env bash
# Despliegue por etiqueta inmutable (SHA del commit) con rollback (INF-06).
# Se ejecuta en el servidor, dentro de ~/apps/lsv. Ver docs/deploy-rollback.md.
#
#   scripts/deploy.sh deploy <sha>     pull + backup de la BD + up con esa etiqueta
#   scripts/deploy.sh rollback         vuelve a desplegar la etiqueta anterior
#   scripts/deploy.sh status           muestra las etiquetas actual y anterior
#   scripts/deploy.sh compose <args>   docker compose (prod) con la etiqueta actual
set -euo pipefail

cd "$(dirname "$0")/.."

STATE_DIR=.deploy
CURRENT_FILE="$STATE_DIR/current-tag"
PREVIOUS_FILE="$STATE_DIR/previous-tag"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
BACKUPS_TO_KEEP=7

compose() {
  docker compose -f docker-compose.yml -f docker-compose.prod.yml "$@"
}

die() {
  echo "deploy.sh: $*" >&2
  exit 1
}

is_sha() {
  [[ "$1" =~ ^[0-9a-f]{40}$ ]]
}

read_tag() {
  [[ -s "$1" ]] && tr -d '[:space:]' < "$1"
}

# Etiqueta que está corriendo ahora. Sin estado guardado (primer deploy con
# este script) se toma de la imagen del contenedor de la API.
running_tag() {
  local tag
  if tag=$(read_tag "$CURRENT_FILE"); then
    echo "$tag"
    return
  fi
  local id
  # IMAGE_TAG solo hace falta aquí para que compose interpole el archivo.
  id=$(IMAGE_TAG=${IMAGE_TAG:-none} compose ps -q lsv-api 2>/dev/null | head -n1)
  [[ -n "$id" ]] || return 1
  tag=$(docker inspect --format '{{.Config.Image}}' "$id" | sed -n 's/.*:\([0-9a-f]\{40\}\)$/\1/p')
  [[ -n "$tag" ]] && echo "$tag"
}

backup_db() {
  if ! compose ps -q lsv-db | grep -q .; then
    echo "lsv-db no está corriendo: se omite el backup."
    return
  fi
  local db_user db_name stamp file
  db_user=$(grep '^DB_USERNAME=' .env | cut -d= -f2-) || die "falta DB_USERNAME en .env"
  db_name=$(grep '^DB_DATABASE=' .env | cut -d= -f2- || true)
  db_name=${db_name:-plataforma}
  stamp=$(date +%Y%m%d-%H%M%S)
  file="$BACKUP_DIR/lsv-$stamp.sql.gz"
  mkdir -p "$BACKUP_DIR"
  # Sin backup no hay deploy: las migraciones corren al arrancar la API.
  if ! compose exec -T lsv-db pg_dump -U "$db_user" -d "$db_name" | gzip > "$file"; then
    rm -f "$file"
    die "pg_dump falló; deploy abortado"
  fi
  echo "Backup: $file"
  ls -t "$BACKUP_DIR"/lsv-*.sql.gz | tail -n +$((BACKUPS_TO_KEEP + 1)) | xargs -r rm -f
}

deploy_tag() {
  local tag=$1 previous
  is_sha "$tag" || die "etiqueta inválida '$tag' (se espera el SHA completo de 40 caracteres)"
  previous=$(running_tag || true)

  export IMAGE_TAG=$tag
  # El pull va primero: si la etiqueta no existe en GHCR, no se toca nada.
  compose pull
  backup_db
  compose up -d --remove-orphans

  mkdir -p "$STATE_DIR"
  if [[ -n "$previous" && "$previous" != "$tag" ]]; then
    echo "$previous" > "$PREVIOUS_FILE"
  fi
  echo "$tag" > "$CURRENT_FILE"
  echo "Desplegado $tag (anterior: ${previous:-desconocida})"
}

case "${1:-}" in
  deploy)
    [[ $# -eq 2 ]] || die "uso: $0 deploy <sha>"
    deploy_tag "$2"
    ;;
  rollback)
    previous=$(read_tag "$PREVIOUS_FILE") || die "no hay etiqueta anterior registrada en $PREVIOUS_FILE"
    deploy_tag "$previous"
    ;;
  status)
    echo "actual:   $(read_tag "$CURRENT_FILE" || echo '-')"
    echo "anterior: $(read_tag "$PREVIOUS_FILE" || echo '-')"
    ;;
  compose)
    shift
    IMAGE_TAG=$(read_tag "$CURRENT_FILE") || die "no hay etiqueta actual en $CURRENT_FILE"
    export IMAGE_TAG
    compose "$@"
    ;;
  *)
    sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
    exit 2
    ;;
esac
