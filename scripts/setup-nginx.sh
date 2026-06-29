#!/usr/bin/env bash
# Configura Nginx para proxy → contenedor Docker (sin Traefik).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${RENACE_FORMS_PORT:-3010}"
TEMPLATE="$ROOT/deploy/nginx/forms.renace.tech.conf"
CONF_NAME="forms.renace.tech"
SITES_AVAILABLE="/etc/nginx/sites-available/${CONF_NAME}"
SITES_ENABLED="/etc/nginx/sites-enabled/${CONF_NAME}"

if [ ! -f "$TEMPLATE" ]; then
  echo "ERROR: falta $TEMPLATE"
  exit 1
fi

if ! command -v nginx &>/dev/null; then
  echo "ERROR: nginx no está instalado en este servidor"
  exit 1
fi

if [ ! -f /etc/letsencrypt/live/forms.renace.tech/fullchain.pem ]; then
  echo "ERROR: no hay certificado SSL para forms.renace.tech"
  echo "  Rutas esperadas: /etc/letsencrypt/live/forms.renace.tech/"
  exit 1
fi

echo "==> Nginx: proxy forms.renace.tech → 127.0.0.1:${PORT}"

if [ -f "$SITES_AVAILABLE" ]; then
  cp "$SITES_AVAILABLE" "${SITES_AVAILABLE}.bak.$(date +%Y%m%d%H%M%S)"
  echo "    Backup del vhost anterior guardado"
fi

sed "s/__PORT__/${PORT}/g" "$TEMPLATE" > "$SITES_AVAILABLE"
ln -sf "$SITES_AVAILABLE" "$SITES_ENABLED"

nginx -t
systemctl reload nginx
echo "==> Nginx recargado — https://forms.renace.tech"
