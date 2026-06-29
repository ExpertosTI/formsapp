#!/usr/bin/env bash
# Solo build Docker + deploy (migración ya hecha).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Construyendo imagen (node:20-slim, sin Alpine/apk)..."
docker build -t talentolink:latest .

echo "==> Desplegando stack renace-forms → forms.renace.tech"
if docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q active; then
  docker stack deploy -c docker-compose.yml renace-forms
else
  docker compose up -d --build
fi

echo "==> Listo: https://forms.renace.tech/admin"
