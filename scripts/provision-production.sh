#!/usr/bin/env bash
# Crea .env de producción, arregla permisos Postgres y despliega.
# Ejecutar en el servidor: ./scripts/provision-production.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── Credenciales de producción forms.renace.tech ──
DB_NAME="renace_forms"
DB_USER="renaceforms"
DB_PASS="RenaceForms2026!xK9mP2"
SUPER_ADMIN_EMAIL="admin@renace.tech"
SUPER_ADMIN_PASSWORD="CatagceAdmin2026!"
ADMIN_SESSION_SECRET="tl_8f3a2c91e7b4d605a8e2f1b9c0d7e6a5f4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8"

cat > .env << EOF
NEXT_PUBLIC_BASE_URL=https://forms.renace.tech
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@host.docker.internal:5432/${DB_NAME}
DATABASE_URL_MIGRATE=postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/var/run/postgresql
SUPER_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL}
SUPER_ADMIN_PASSWORD=${SUPER_ADMIN_PASSWORD}
ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}
EOF

chmod 600 .env
echo "==> .env de producción creado"

export DB_NAME DB_USER DB_PASS
./deploy.sh db

./scripts/setup-server.sh
