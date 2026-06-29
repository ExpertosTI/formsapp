#!/usr/bin/env bash
# Build en el HOST → docker compose up (este servidor NO es Swarm)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/docker-compose.sh
source "$ROOT/scripts/lib/docker-compose.sh"

[ -f .env ] || { echo "ERROR: falta .env"; exit 1; }

# uploads no deben entrar al standalone (volumen Docker + API /api/files)
mkdir -p public/uploads
if [ "$(find public/uploads -type f 2>/dev/null | wc -l)" -gt 0 ]; then
  echo "==> Limpiando public/uploads antes del build ($(find public/uploads -type f | wc -l) archivos → volumen después)"
  rm -rf public/uploads/*
fi

echo "==> 1/4 npm ci + prisma generate..."
npm ci
npx prisma generate

echo "==> 2/4 next build..."
npm run build

if [ ! -f .next/standalone/server.js ]; then
  echo "ERROR: .next/standalone/server.js no existe."
  exit 1
fi
echo "    OK: standalone $(du -sh .next/standalone | cut -f1)"

echo "==> 3/4 docker build..."
docker build --network=host -t talentolink:latest -f Dockerfile .

SWARM_STATE=$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || echo "inactive")
echo "==> 4/4 desplegar (swarm=$SWARM_STATE)..."
if [ "$SWARM_STATE" = "active" ]; then
  docker stack deploy -c docker-compose.yml renace-forms
else
  docker_compose up -d --remove-orphans
fi

[ -x "$ROOT/scripts/sync-uploads.sh" ] && "$ROOT/scripts/sync-uploads.sh"

echo ""
echo "==> https://forms.renace.tech/admin"
docker_compose ps 2>/dev/null || true
