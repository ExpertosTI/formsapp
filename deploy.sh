#!/usr/bin/env bash
# deploy.sh — TalentoLink @ forms.renace.tech
#
# IMPORTANTE: Solo afecta /opt/talentolink y el stack renace-forms.
# No toca Odoo (/opt/odoo) ni otros stacks Docker.
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
    sed -n '1,18p' "$0"
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

    echo "==> Listo. En el servidor: ./scripts/setup-server.sh"
}

cmd_db() {
    DB_NAME="${DB_NAME:-renace_forms}"
    DB_USER="${DB_USER:-renaceforms}"
    if [ -z "${DB_PASS:-}" ]; then
        echo "Error: export DB_PASS='...' antes de ./deploy.sh db"
        exit 1
    fi

    if ! systemctl is-active --quiet postgresql 2>/dev/null; then
        echo "Error: PostgreSQL no está activo. No lo reiniciamos automáticamente (Odoo puede usarlo)."
        echo "  Verifica: systemctl status postgresql"
        exit 1
    fi

    echo "==> Creando usuario/BD para forms.renace.tech (no toca bases de Odoo)..."

    sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

    sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

    sudo -u postgres psql -d "$DB_NAME" -c "
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
"

    echo ""
    echo "Base de datos '$DB_NAME' lista. Copia esto en tu .env:"
    echo ""
    echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@host.docker.internal:5432/${DB_NAME}"
    echo "DATABASE_URL_MIGRATE=postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/var/run/postgresql"
    echo ""
    if pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
        echo "Postgres responde en TCP 127.0.0.1:5432 (OK para Docker)."
    else
        echo "AVISO: Postgres no escucha en TCP 127.0.0.1:5432."
        echo "  Las migraciones usan socket (DATABASE_URL_MIGRATE)."
        echo "  Para Docker, habilita listen_addresses='localhost' en postgresql.conf"
        echo "  y reinicia Postgres en una ventana de mantenimiento (afecta Odoo brevemente)."
    fi
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
