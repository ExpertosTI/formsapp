#!/usr/bin/env bash
# Asegura DATABASE_URL con 127.0.0.1 para network_mode: host
set -euo pipefail
ENV_FILE="${1:-.env}"
[ -f "$ENV_FILE" ] || exit 0

if grep -q 'host.docker.internal' "$ENV_FILE" 2>/dev/null; then
  echo "==> Actualizando DATABASE_URL → 127.0.0.1 (network_mode: host)"
  sed -i.bak 's|@host.docker.internal:5432|@127.0.0.1:5432|g' "$ENV_FILE"
fi
