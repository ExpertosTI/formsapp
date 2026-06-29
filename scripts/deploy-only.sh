#!/usr/bin/env bash
# Build en el HOST → Docker + Nginx (sin Traefik)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/docker-compose.sh
source "$ROOT/scripts/lib/docker-compose.sh"

[ -f .env ] || { echo "ERROR: falta .env"; exit 1; }
set -a
# shellcheck disable=SC1091
source .env
set +a

export RENACE_FORMS_PORT="${RENACE_FORMS_PORT:-3010}"

mkdir -p public/uploads
if [ "$(find public/uploads -type f 2>/dev/null | wc -l)" -gt 0 ]; then
  echo "==> Limpiando public/uploads antes del build ($(find public/uploads -type f | wc -l) archivos → volumen después)"
  rm -rf public/uploads/*
fi

echo "==> 1/5 npm ci + prisma generate..."
npm ci
npx prisma generate

echo "==> 2/5 next build..."
npm run build

if [ ! -f .next/standalone/server.js ]; then
  echo "ERROR: .next/standalone/server.js no existe."
  exit 1
fi
echo "    OK: standalone $(du -sh .next/standalone | cut -f1)"

echo "==> 3/5 docker build..."
docker build --network=host -t talentolink:latest -f Dockerfile .

echo "==> 4/5 docker compose up (127.0.0.1:${RENACE_FORMS_PORT})..."
docker_compose up -d --remove-orphans

[ -x "$ROOT/scripts/sync-uploads.sh" ] && "$ROOT/scripts/sync-uploads.sh"

echo "==> 5/5 nginx..."
[ -x "$ROOT/scripts/setup-nginx.sh" ] && "$ROOT/scripts/setup-nginx.sh"

echo ""
echo "==> https://forms.renace.tech/admin"
docker_compose ps 2>/dev/null || true
