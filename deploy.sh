#!/usr/bin/env bash
# deploy.sh — TalentoLink @ forms.renace.tech
#
# Producción (todo en uno):
#   ./scripts/provision-production.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

usage() {
    sed -n '1,12p' "$0"
    echo ""
    echo "Comandos: sync | db | help"
    exit 1
}

cmd_sync() {
    : "${DEPLOY_USER:?Definir DEPLOY_USER}"
    : "${DEPLOY_HOST:?Definir DEPLOY_HOST}"
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

    echo "==> Listo. En el servidor: ./scripts/provision-production.sh"
}

cmd_db() {
    DB_NAME="${DB_NAME:-renace_forms}"
    DB_USER="${DB_USER:-renaceforms}"
    if [ -z "${DB_PASS:-}" ]; then
        echo "Error: export DB_PASS antes de ./deploy.sh db"
        exit 1
    fi

    if ! systemctl is-active --quiet postgresql 2>/dev/null; then
        echo "Error: PostgreSQL no está activo."
        exit 1
    fi

    echo "==> Configurando PostgreSQL para forms.renace.tech..."

    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
    else
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    fi

    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    fi

  sudo -u postgres psql -v ON_ERROR_STOP=1 <<EOSQL
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT CREATE ON SCHEMA public TO ${DB_USER};
ALTER SCHEMA public OWNER TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
EOSQL

    echo "==> Base de datos '$DB_NAME' lista con permisos completos."
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
