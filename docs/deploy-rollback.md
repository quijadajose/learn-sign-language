# Deploy por SHA y rollback

Producción nunca usa `:latest`. Cada push a `main` publica las tres imágenes
(`lsv-backend`, `lsv-frontend`, `lsv-model-trainer`) con la etiqueta del SHA del
commit, y el servidor arranca exactamente esa etiqueta. `docker-compose.prod.yml`
exige `IMAGE_TAG`: si falta, compose falla en vez de usar otra imagen.

## Flujo automático (push a `main`)

`.github/workflows/deploy.yml`:

1. `ci`: ejecuta `ci.yml` completo (contrato ML, lint y tests unitarios del
   backend, las 16 suites e2e, frontend y trainer). Si algo falla, no hay build.
2. `build`: publica las imágenes con la etiqueta `${{ github.sha }}`.
3. `deploy`: copia los compose, el `Caddyfile` y `scripts/deploy.sh` al
   servidor y ejecuta `scripts/deploy.sh deploy <sha>`, que:
   - hace `pull` de esa etiqueta (si no existe, se detiene sin tocar nada);
   - hace `pg_dump` de la BD en `~/backups/` (guarda los 7 últimos; si falla, no despliega);
   - hace `up -d --remove-orphans`;
   - guarda la etiqueta en `.deploy/current-tag` y la que había antes en
     `.deploy/previous-tag`.

## Desplegar un SHA concreto

Desde GitHub: **Actions → Build and Deploy LSV → Run workflow**, y en `tag`
pon el SHA completo (40 caracteres) de un commit que ya se haya desplegado
alguna vez (sus imágenes tienen que existir en GHCR). Con `tag` se salta CI y
build, porque esas imágenes ya pasaron la CI cuando se construyeron.

Si dejas `tag` vacío, se ejecuta el flujo completo (CI + build + deploy) sobre
la rama elegida.

Desde el servidor (`cd ~/apps/lsv`), haz antes `docker login ghcr.io` si la sesión caducó:

```bash
bash scripts/deploy.sh deploy <sha-completo>
```

## Rollback

La forma más rápida, en el servidor:

```bash
cd ~/apps/lsv
bash scripts/deploy.sh status     # etiquetas actual y anterior
bash scripts/deploy.sh rollback   # vuelve a desplegar la anterior
```

`rollback` intercambia las dos etiquetas, así que repetirlo vuelve a la versión
de la que se partió. Para ir más atrás, usa `deploy <sha>` o el `workflow_dispatch` con `tag`.

Para ver qué SHA se desplegó en cada momento, revisa el resumen de cada
ejecución de `deploy.yml` en Actions.

## Comandos manuales de compose

Como `IMAGE_TAG` es obligatorio, usa el script para que compose tome la
etiqueta desplegada:

```bash
bash scripts/deploy.sh compose ps
bash scripts/deploy.sh compose logs -f lsv-api
bash scripts/deploy.sh compose restart lsv-model-trainer
```

## Limitaciones

- **Migraciones:** el rollback cambia el código, no el esquema. Las migraciones
  corren al arrancar la API y no se revierten solas. Si la versión nueva aplicó
  una migración incompatible con la anterior, restaura el backup previo al
  deploy (`~/backups/lsv-<fecha>.sql.gz`) antes del rollback, o revierte la
  migración a mano.
- **Archivos de compose:** el rollback reutiliza los `docker-compose*.yml` que
  hay en el servidor. Si el cambio que quieres deshacer está en esos archivos
  (no en las imágenes), haz revert del commit y despliega de nuevo.
- **Retención en GHCR:** solo se puede volver a etiquetas que sigan publicadas.
  No borres versiones antiguas de los paquetes sin revisar esto antes.
