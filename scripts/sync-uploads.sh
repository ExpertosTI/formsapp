#!/usr/bin/env bash
# Sincroniza todos los uploads de ecofast → public/uploads + volumen Docker
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOFAST="${ECOFAST_BASE:-/var/www/ecofast}"
DEST="${ROOT}/public/uploads"
COUNT=0

mkdir -p "$DEST"

echo "==> Sincronizando archivos desde ${ECOFAST}/tenants/*/uploads"
for dir in "$ECOFAST"/tenants/*/uploads; do
  [ -d "$dir" ] || continue
  tenant=$(basename "$(dirname "$dir")")
  n=$(find "$dir" -type f | wc -l)
  echo "   $tenant: $n archivos"
  # cp -n no sobrescribe
  find "$dir" -type f -exec cp -n {} "$DEST/" \; 2>/dev/null || true
  COUNT=$((COUNT + n))
done

flat=$(find "$DEST" -type f | wc -l)
echo "==> Total en public/uploads: $flat archivos"

# Copiar al volumen Docker si el contenedor existe
VOL_PATH=$(docker volume inspect renace-forms_uploads --format '{{.Mountpoint}}' 2>/dev/null || true)
if [ -n "$VOL_PATH" ] && [ -d "$VOL_PATH" ]; then
  echo "==> Copiando al volumen Docker renace-forms_uploads"
  cp -rn "$DEST"/* "$VOL_PATH/" 2>/dev/null || true
fi

echo "==> Sync de uploads completado"
