#!/usr/bin/env bash
# ── formsapp — sync Evolution GLOBAL key + deploy ──
# Usage: ./scripts/push-evo.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CITAS_EVO="${CITAS_EVO:-/Users/brainiacx/Library/Mobile Documents/com~apple~CloudDocs/APPS/citas/.evolution.local}"
LOCAL_EVO="${LOCAL_EVO:-$ROOT/.evolution.local}"
VPS="${VPS:-root@85.31.224.232}"
REMOTE_DIR="${REMOTE_DIR:-/opt/talentolink}"

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*" >&2; }

cd "$ROOT"

cyan "── Asegurar clave GLOBAL en .evolution.local ──"
if [ ! -f "$LOCAL_EVO" ] && [ -f "$CITAS_EVO" ]; then
  cp "$CITAS_EVO" "$LOCAL_EVO"
fi

if [ ! -f "$LOCAL_EVO" ]; then
  cat << 'EOF' > "$LOCAL_EVO"
EVOLUTION_API_URL=https://evoapi.renace.tech
EVOLUTION_API_KEY=d66888ea1d791329a97c934ea14014dc41c53e001440f74a
EOF
fi

cyan "── Subir clave al VPS: $VPS:$REMOTE_DIR/.evolution.local ──"
scp -o StrictHostKeyChecking=accept-new "$LOCAL_EVO" "$VPS:$REMOTE_DIR/.evolution.local"

cyan "── Aplicar clave a .env en el VPS y reiniciar contenedor ──"
ssh -o StrictHostKeyChecking=accept-new "$VPS" bash -s -- "$REMOTE_DIR" <<'REMOTE'
set -euo pipefail
REMOTE_DIR="$1"
cd "$REMOTE_DIR"

if [ -f .evolution.local ]; then
  url=$(grep '^EVOLUTION_API_URL=' .evolution.local | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  key=$(grep '^EVOLUTION_API_KEY=' .evolution.local | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r')

  touch .env
  if grep -q '^EVOLUTION_API_URL=' .env; then
    sed -i "s|^EVOLUTION_API_URL=.*|EVOLUTION_API_URL=${url}|" .env
  else
    echo "EVOLUTION_API_URL=${url}" >> .env
  fi

  if grep -q '^EVOLUTION_API_KEY=' .env; then
    sed -i "s|^EVOLUTION_API_KEY=.*|EVOLUTION_API_KEY=${key}|" .env
  else
    echo "EVOLUTION_API_KEY=${key}" >> .env
  fi

  echo "==> EVOLUTION_API_KEY configurada en .env (${#key} caracteres)"
  echo "==> EVOLUTION_API_URL: $url"

  # Reiniciar contenedor si ya existe
  if docker ps -a --format '{{.Names}}' | grep -q '^renace-forms-app$'; then
    docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
    docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null || true
    echo "==> Contenedor renace-forms-app reiniciado con las nuevas credenciales."
  fi
fi
REMOTE

green "✅ Evolution API sincronizada y activa en forms.renace.tech"
