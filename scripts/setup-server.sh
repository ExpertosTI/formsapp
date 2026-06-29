#!/usr/bin/env bash
# Ejecutar EN EL SERVIDOR en /opt/talentolink
# Solo despliega forms.renace.tech — no toca renace_forms (legacy) ni Odoo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "==> Crea .env primero: cp .env.example .env && nano .env"
  exit 1
fi

set +H
set -a
# shellcheck disable=SC1091
source .env
set +a
set -H

: "${SUPER_ADMIN_EMAIL:?SUPER_ADMIN_EMAIL requerido}"
: "${SUPER_ADMIN_PASSWORD:?SUPER_ADMIN_PASSWORD requerido}"
: "${ADMIN_SESSION_SECRET:?ADMIN_SESSION_SECRET requerido}"

# Migraciones en el host vía TCP (socket+peer falla cuando se ejecuta como root)
MIGRATE_URL="${DATABASE_URL_MIGRATE:-$DATABASE_URL}"
if [ -z "$MIGRATE_URL" ]; then
  echo "Error: define DATABASE_URL_MIGRATE o DATABASE_URL en .env"
  exit 1
fi

if ! systemctl is-active --quiet postgresql 2>/dev/null; then
  echo "Error: PostgreSQL no está activo. No lo arrancamos automáticamente."
  exit 1
fi

# shellcheck source=scripts/db-safety.sh
source "$ROOT/scripts/db-safety.sh"
DB_CHECK_NAME=$(db_name_from_url "$MIGRATE_URL")
assert_safe_database "$DB_CHECK_NAME"
echo "==> BD verificada: $DB_CHECK_NAME"

echo "==> Instalando dependencias..."
npm ci

echo "==> Generando Prisma client..."
npx prisma generate

echo "==> Aplicando schema (BD dedicada, sin borrar datos)..."
DATABASE_URL="$MIGRATE_URL" npx prisma db push --skip-generate

echo "==> Migrando datos Ecofast (upsert, no borra)..."
DATABASE_URL="$MIGRATE_URL" node migration_backup/migrate_sql.js

echo "==> Construyendo imagen Docker..."
docker build -t talentolink:latest .

echo "==> Desplegando forms.renace.tech..."
SWARM_STATE=$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || echo "inactive")
if [ "$SWARM_STATE" = "active" ]; then
  docker stack deploy -c docker-compose.yml renace-forms
else
  docker compose up -d --remove-orphans
fi

echo ""
echo "==> Listo: https://forms.renace.tech/admin"
echo "    Admin: ${SUPER_ADMIN_EMAIL}"
