#!/usr/bin/env bash
# Diagnóstico: contenedor + nginx + HTTP
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${RENACE_FORMS_PORT:-3010}"

echo "=== Contenedor ==="
docker ps -a --filter name=renace-forms-app --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true

echo ""
echo "=== App directa (127.0.0.1:${PORT}) ==="
curl -sI "http://127.0.0.1:${PORT}/admin" 2>/dev/null | head -10 || echo "  no responde en :${PORT}"

echo ""
echo "=== Nginx vhost ==="
nginx -t 2>&1 || true
grep -r "forms.renace.tech" /etc/nginx/sites-enabled/ 2>/dev/null | head -5 || echo "  (sin vhost en sites-enabled)"

echo ""
echo "=== HTTPS público ==="
curl -sI https://forms.renace.tech/admin 2>/dev/null | head -12 || echo "  curl falló"

echo ""
echo "=== Logs contenedor ==="
docker logs renace-forms-app --tail 15 2>&1 || true
