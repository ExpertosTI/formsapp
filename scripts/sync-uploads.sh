#!/usr/bin/env bash
# Sincroniza uploads a public/uploads Y al volumen Docker (no en la imagen)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOFAST="${ECOFAST_BASE:-/var/www/ecofast}"
DEST="${ROOT}/public/uploads"
# UID/GID del usuario nextjs en la imagen Docker (Dockerfile)
APP_UID="${APP_UID:-1001}"
APP_GID="${APP_GID:-1001}"

mkdir -p "$DEST/logos"

echo "==> Sincronizando desde ${ECOFAST}/tenants/*/uploads"
for dir in "$ECOFAST"/tenants/*/uploads; do
  [ -d "$dir" ] || continue
  tenant=$(basename "$(dirname "$dir")")
  n=$(find "$dir" -type f 2>/dev/null | wc -l)
  echo "   $tenant: $n archivos"
  find "$dir" -type f -exec cp -n {} "$DEST/" \; 2>/dev/null || true
done

flat=$(find "$DEST" -type f 2>/dev/null | wc -l)
echo "==> public/uploads: $flat archivos (gitignored, no va en Docker)"

VOL_NAME=$(docker volume ls -q 2>/dev/null | grep 'renace-forms_uploads' | head -1 || true)
VOL_PATH=""
if [ -n "$VOL_NAME" ]; then
  VOL_PATH=$(docker volume inspect "$VOL_NAME" --format '{{.Mountpoint}}' 2>/dev/null || true)
fi

if [ -n "$VOL_PATH" ] && [ -d "$VOL_PATH" ]; then
  echo "==> Copiando al volumen Docker: $VOL_PATH"
  mkdir -p "$VOL_PATH/logos"
  # Archivos legacy van en la raíz; logos en logos/
  find "$DEST" -maxdepth 1 -type f -exec cp -n {} "$VOL_PATH/" \; 2>/dev/null || true
  if [ -d "$DEST/logos" ]; then
    find "$DEST/logos" -type f -exec cp -n {} "$VOL_PATH/logos/" \; 2>/dev/null || true
  fi
  # El contenedor corre como nextjs (1001); sin esto falla mkdir/write (EACCES)
  chown -R "${APP_UID}:${APP_GID}" "$VOL_PATH" 2>/dev/null || true
  chmod -R u+rwX "$VOL_PATH" 2>/dev/null || true
  vol_count=$(find "$VOL_PATH" -type f 2>/dev/null | wc -l)
  echo "==> Volumen Docker: $vol_count archivos (owner ${APP_UID}:${APP_GID})"
else
  echo "==> Volumen Docker aún no creado (se llenará al desplegar el stack)"
fi

# También dentro del contenedor en marcha (por si el volumen ya estaba montado)
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^renace-forms-app$'; then
  docker exec -u root renace-forms-app mkdir -p /app/public/uploads/logos 2>/dev/null || true
  docker exec -u root renace-forms-app chown -R nextjs:nodejs /app/public/uploads 2>/dev/null || true
fi

echo "==> Sync completado"
