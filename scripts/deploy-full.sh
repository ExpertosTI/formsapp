#!/usr/bin/env bash
# Deploy completo: sync archivos + re-migrar + build Docker
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

chmod +x scripts/sync-uploads.sh scripts/reextract-and-migrate.sh scripts/deploy-only.sh 2>/dev/null || true

./scripts/sync-uploads.sh
./scripts/reextract-and-migrate.sh
./scripts/deploy-only.sh

echo ""
echo "==> TalentoLink desplegado: https://forms.renace.tech/admin"
