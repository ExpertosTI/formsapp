#!/usr/bin/env bash
# deploy.sh — RENACE / Ecofast
#
# No sustituye variables de entorno en archivos: los secretos siguen en el servidor (PHP-FPM, panel, etc.).
# No sobrescribe datos de tenants ni subidas: excluye JSON de solicitudes, tenant.json, uploads y data/.
#
# Uso desde tu máquina (actualizar código: seguridad, logos, PHP):
#   export DEPLOY_USER=usuario_ssh
#   export DEPLOY_HOST=dominio_o_ip
#   export DEPLOY_PATH=/var/www/html/ecofast
#   ./deploy.sh sync
#
# Uso en el SERVIDOR (solo primera vez o si falta la tabla; requiere PostgreSQL local):
#   export DB_PASS='tu_clave_postgres'
#   ./deploy.sh db
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

usage() {
    sed -n '1,25p' "$0"
    exit 1
}

cmd_sync() {
    : "${DEPLOY_USER:?Definir DEPLOY_USER (usuario SSH)}"
    : "${DEPLOY_HOST:?Definir DEPLOY_HOST (host o IP)}"
    : "${DEPLOY_PATH:?Definir DEPLOY_PATH (ruta absoluta en el servidor, ej. /var/www/ecofast)}"

    echo "==> Sincronizando hacia ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
    ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${DEPLOY_PATH}'"

    rsync -avz --delete \
        --exclude '.git/' \
        --exclude 'uploads/' \
        --exclude 'data/' \
        --exclude 'tenants/*/uploads/' \
        --exclude 'tenants/*/submissions.json' \
        --exclude 'tenants/*/rate_limits.json' \
        --exclude 'tenants/*/login_attempts.json' \
        --exclude 'tenants/*/tenant.json' \
        "${ROOT}/" \
        "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

    echo "==> Listo. En el servidor, recarga PHP-FPM si aplica, p. ej.: sudo systemctl reload php8.2-fpm"
}

cmd_db() {
    DB_NAME="${DB_NAME:-renace_forms}"
    DB_USER="${DB_USER:-renaceforms}"
    if [ -z "${DB_PASS:-}" ]; then
        echo "Error: en el servidor, export DB_PASS='...' antes de ./deploy.sh db"
        exit 1
    fi

    echo "Iniciando configuración de PostgreSQL para RENACE Forms..."

    sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

    sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

    sudo -u postgres psql -d "$DB_NAME" -c "
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    tenant_slug VARCHAR(100) NOT NULL,
    datos JSONB NOT NULL DEFAULT '{}'::jsonb,
    archivos JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado VARCHAR(30) NOT NULL DEFAULT 'nuevo',
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_tenant_slug ON submissions(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_submissions_fecha ON submissions(fecha DESC);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
"

    echo "Base de datos lista (CREATE IF NOT EXISTS; no borra datos existentes)."
}

case "${1:-sync}" in
    sync) cmd_sync ;;
    db) cmd_db ;;
    -h|--help|help) usage ;;
    *)
        echo "Comando desconocido: $1"
        usage
        ;;
esac
