#!/usr/bin/env bash
# Ejecutar EN EL SERVIDOR (odoo18) después de git pull.
# Uso: ./scripts/setup-server.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "==> Creando .env desde .env.example"
  cp .env.example .env
  echo "    Edita .env con las credenciales reales antes de continuar."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DATABASE_URL:?DATABASE_URL requerido en .env}"
: "${SUPER_ADMIN_EMAIL:?SUPER_ADMIN_EMAIL requerido en .env}"
: "${SUPER_ADMIN_PASSWORD:?SUPER_ADMIN_PASSWORD requerido en .env}"
: "${ADMIN_SESSION_SECRET:?ADMIN_SESSION_SECRET requerido en .env}"

echo "==> Instalando dependencias..."
npm ci

echo "==> Generando Prisma client..."
npx prisma generate

echo "==> Aplicando schema (sin borrar datos)..."
npx prisma db push

echo "==> Migrando datos de Ecofast (upsert, no borra)..."
node migration_backup/migrate_sql.js

echo "==> Construyendo imagen Docker..."
docker build -t talentolink:latest .

echo "==> Desplegando stack..."
docker stack deploy -c docker-compose.yml talentolink --with-registry-auth 2>/dev/null \
  || docker compose up -d --build

echo ""
echo "==> TalentoLink desplegado en ${NEXT_PUBLIC_BASE_URL:-https://catagce.renace.tech}"
echo "    Admin: ${SUPER_ADMIN_EMAIL}"
