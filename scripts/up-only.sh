#!/usr/bin/env bash
# Levanta el contenedor sin rebuild (imagen talentolink:latest ya debe existir).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/lib/docker-compose.sh
source "$ROOT/scripts/lib/docker-compose.sh"
# shellcheck source=scripts/lib/detect-docker-network.sh
source "$ROOT/scripts/lib/detect-docker-network.sh"

[ -f .env ] || { echo "ERROR: falta .env"; exit 1; }
set -a
# shellcheck disable=SC1091
source .env
set +a

RENACE_DOCKER_NETWORK=$(detect_docker_network) || {
  echo "ERROR: no se encontró red Docker para Traefik."
  echo "  Ejecuta: docker network ls"
  echo "  Luego en .env: RENACE_DOCKER_NETWORK=nombre_de_la_red"
  exit 1
}
export RENACE_DOCKER_NETWORK
echo "==> Red Docker: $RENACE_DOCKER_NETWORK"

docker_compose up -d --remove-orphans
[ -x "$ROOT/scripts/sync-uploads.sh" ] && "$ROOT/scripts/sync-uploads.sh"

echo ""
echo "==> https://forms.renace.tech/admin"
docker_compose ps
