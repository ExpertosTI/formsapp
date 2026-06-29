#!/usr/bin/env bash
# Build en el HOST (DNS OK) + empaquetado Docker sin apt/npm
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

set +H
set -a
# shellcheck disable=SC1091
[ -f .env ] && source .env
set +a
set -H

MIGRATE_URL="${DATABASE_URL_MIGRATE:-$DATABASE_URL}"

echo "==> 1/4 npm ci + prisma generate..."
npm ci
npx prisma generate

echo "==> 2/4 next build (en el host)..."
npm run build

echo "==> 3/4 docker build (solo copia standalone, --network=host)..."
docker build --network=host -t talentolink:latest -f Dockerfile .

echo "==> 4/4 desplegar stack renace-forms..."
if docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q active; then
  docker stack deploy -c docker-compose.yml renace-forms
else
  docker compose up -d
fi

# Copiar uploads al volumen Docker
if [ -x "$ROOT/scripts/sync-uploads.sh" ]; then
  "$ROOT/scripts/sync-uploads.sh" || true
fi

echo ""
echo "==> Listo: https://forms.renace.tech/admin"
