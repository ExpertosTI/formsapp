#!/usr/bin/env bash
# Sincroniza uploads a public/uploads Y al volumen Docker (no en la imagen)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOFAST="${ECOFAST_BASE:-/var/www/ecofast}"
DEST="${ROOT}/public/uploads"

mkdir -p "$DEST"

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
  find "$DEST" -type f -exec cp -n {} "$VOL_PATH/" \; 2>/dev/null || true
  vol_count=$(find "$VOL_PATH" -type f 2>/dev/null | wc -l)
  echo "==> Volumen Docker: $vol_count archivos"
else
  echo "==> Volumen Docker aún no creado (se llenará al desplegar el stack)"
fi

echo "==> Sync completado"
