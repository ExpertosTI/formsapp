#!/usr/bin/env bash
# Re-extrae TODAS las empresas del servidor y re-migra a forms_talentolink
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

set +H
set -a
# shellcheck disable=SC1091
[ -f .env ] && source .env
set +a
set -H

ECOFAST_BASE="${ECOFAST_BASE:-/var/www/ecofast}"
export ECOFAST_BASE

echo "==> 1/4 Extrayendo empresas de ${ECOFAST_BASE}/tenants ..."
node migration_backup/extract_data_node.js

echo ""
echo "==> 2/4 Extrayendo BD legacy renace_forms (si existe) ..."
export LEGACY_DATABASE_URL="${LEGACY_DATABASE_URL:-postgresql://postgres@127.0.0.1:5432/renace_forms}"
node migration_backup/extract_legacy_pg.js 2>/dev/null || echo "    (sin acceso a renace_forms legacy — OK si no aplica)"

echo ""
echo "==> 3/4 Auditoría ..."
DATABASE_URL="${DATABASE_URL_MIGRATE:-$DATABASE_URL}" node scripts/audit-tenants.js

echo ""
echo "==> 4/4 Migrando a forms_talentolink (upsert, no borra) ..."
DATABASE_URL="${DATABASE_URL_MIGRATE:-$DATABASE_URL}" node migration_backup/migrate_sql.js

echo ""
echo "==> Hecho. Revisa la auditoría arriba."
