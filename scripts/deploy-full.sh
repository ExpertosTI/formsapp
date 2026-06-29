#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

chmod +x scripts/*.sh 2>/dev/null || true
./scripts/sync-uploads.sh
./scripts/reextract-and-migrate.sh
./scripts/deploy-only.sh
