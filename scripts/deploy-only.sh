#!/usr/bin/env bash
# Build en el HOST → Docker empaqueta .next/standalone (ver Dockerfile)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

[ -f .env ] || { echo "ERROR: falta .env — ejecuta ./scripts/provision-production.sh primero"; exit 1; }

echo "==> 1/4 npm ci + prisma generate..."
npm ci
npx prisma generate

echo "==> 2/4 next build..."
npm run build

if [ ! -f .next/standalone/server.js ]; then
  echo "ERROR: .next/standalone/server.js no existe tras el build."
  exit 1
fi
echo "    OK: standalone generado ($(du -sh .next/standalone | cut -f1))"

echo "==> 3/4 docker build..."
docker build --network=host -t talentolink:latest -f Dockerfile .

echo "==> 4/4 docker stack deploy renace-forms..."
if docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q active; then
  docker stack deploy -c docker-compose.yml renace-forms
else
  docker compose up -d
fi

[ -x "$ROOT/scripts/sync-uploads.sh" ] && "$ROOT/scripts/sync-uploads.sh" || true

echo ""
echo "==> https://forms.renace.tech/admin"
