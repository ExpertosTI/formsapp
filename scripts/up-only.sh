#!/usr/bin/env bash
# Levanta contenedor + nginx (sin rebuild).
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
echo "==> Puerto local: 127.0.0.1:${RENACE_FORMS_PORT}"

prepare_forms_container
docker_compose up -d --remove-orphans
[ -x "$ROOT/scripts/sync-uploads.sh" ] && "$ROOT/scripts/sync-uploads.sh"
[ -x "$ROOT/scripts/setup-nginx.sh" ] && "$ROOT/scripts/setup-nginx.sh"

echo ""
echo "==> https://forms.renace.tech/admin"
docker_compose ps
