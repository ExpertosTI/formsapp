#!/usr/bin/env bash
# deploy.sh — TalentoLink @ catagce.renace.tech
#
# Desde tu Mac (sync por rsync):
#   export DEPLOY_USER=root
#   export DEPLOY_HOST=IP_DEL_SERVIDOR
#   export DEPLOY_PATH=/opt/talentolink
#   ./deploy.sh sync
#
# En el SERVIDOR (primera vez — PostgreSQL):
#   export DB_PASS='clave_postgres'
#   ./deploy.sh db
#
# En el SERVIDOR (después de git pull):
#   ./scripts/setup-server.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

usage() {
    sed -n '1,20p' "$0"
    echo ""
    echo "Comandos: sync | db | help"
    exit 1
}

cmd_sync() {
    : "${DEPLOY_USER:?Definir DEPLOY_USER (usuario SSH)}"
    : "${DEPLOY_HOST:?Definir DEPLOY_HOST (IP del servidor, no el dominio Cloudflare)}"
    : "${DEPLOY_PATH:?Definir DEPLOY_PATH (ej. /opt/talentolink)}"

    echo "==> Sincronizando hacia ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
    ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${DEPLOY_PATH}'"

    rsync -avz --delete \
        --exclude '.git/' \
        --exclude 'node_modules/' \
        --exclude '.next/' \
        --exclude '.npm_cache/' \
        --exclude '.env' \
        --exclude 'uploads/' \
        --exclude 'public/uploads/' \
        "${ROOT}/" \
        "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

    echo "==> Código sincronizado. En el servidor ejecuta: ./scripts/setup-server.sh"
}

cmd_db() {
    DB_NAME="${DB_NAME:-talentolink}"
    DB_USER="${DB_USER:-talentolink}"
    if [ -z "${DB_PASS:-}" ]; then
        echo "Error: export DB_PASS='...' antes de ./deploy.sh db"
        exit 1
    fi

    echo "Iniciando configuración de PostgreSQL para TalentoLink..."

    sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

    sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

    sudo -u postgres psql -d "$DB_NAME" -c "
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
"

    echo "Base de datos '$DB_NAME' lista."
    echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
}

case "${1:-help}" in
    sync) cmd_sync ;;
    db) cmd_db ;;
    -h|--help|help) usage ;;
    *)
        echo "Comando desconocido: $1"
        usage
        ;;
esac
