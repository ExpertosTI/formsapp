#!/usr/bin/env bash
# Ejecutar EN EL SERVIDOR en /opt/talentolink
# Solo despliega forms.renace.tech — NO toca Odoo ni otros stacks.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "==> Crea .env primero: cp .env.example .env && nano .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${SUPER_ADMIN_EMAIL:?SUPER_ADMIN_EMAIL requerido}"
: "${SUPER_ADMIN_PASSWORD:?SUPER_ADMIN_PASSWORD requerido}"
: "${ADMIN_SESSION_SECRET:?ADMIN_SESSION_SECRET requerido}"

# Migraciones en el host: socket UNIX (no requiere TCP 5432)
MIGRATE_URL="${DATABASE_URL_MIGRATE:-$DATABASE_URL}"
if [ -z "$MIGRATE_URL" ]; then
  echo "Error: define DATABASE_URL_MIGRATE o DATABASE_URL en .env"
  exit 1
fi

if ! systemctl is-active --quiet postgresql 2>/dev/null; then
  echo "Error: PostgreSQL no está activo. No lo arrancamos automáticamente."
  exit 1
fi

echo "==> Instalando dependencias..."
npm ci

echo "==> Generando Prisma client..."
npx prisma generate

echo "==> Aplicando schema (socket, sin borrar datos)..."
DATABASE_URL="$MIGRATE_URL" npx prisma db push

echo "==> Migrando datos Ecofast (upsert, no borra)..."
DATABASE_URL="$MIGRATE_URL" node migration_backup/migrate_sql.js

echo "==> Construyendo imagen Docker..."
docker build -t talentolink:latest .

echo "==> Desplegando SOLO stack renace-forms (forms.renace.tech)..."
if docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q active; then
  docker stack deploy -c docker-compose.yml renace-forms
else
  docker compose up -d --build
fi

echo ""
echo "==> Listo: https://forms.renace.tech/admin"
echo "    Admin: ${SUPER_ADMIN_EMAIL}"
