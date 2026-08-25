#!/usr/bin/env bash
# Build en el HOST → Docker + Nginx (sin Traefik)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/docker-compose.sh
source "$ROOT/scripts/lib/docker-compose.sh"

[ -f .env ] || { echo "ERROR: falta .env"; exit 1; }

# Auto-descubrir credenciales de Evolution API en el servidor si faltan en .env
touch "$ROOT/.evolution.local"
for evo_cand in "/opt/citas/.evolution.local" "/opt/zuv/.evolution.local" "/var/www/ecofast/.evolution.local" "/root/.evolution.local"; do
  if [ -f "$evo_cand" ]; then
    echo "==> Encontrado archivo de credenciales de WhatsApp en $evo_cand"
    cp "$evo_cand" "$ROOT/.evolution.local" 2>/dev/null || true
    while IFS='=' read -r k v || [ -n "$k" ]; do
      k=$(echo "$k" | tr -d ' "\r\n')
      v=$(echo "$v" | tr -d ' "\r\n')
      if [ -n "$k" ] && [ -n "$v" ] && [[ ! "$k" =~ ^# ]]; then
        if [ "$k" = "EVOLUTION_API_KEY" ] || [ "$k" = "EVO_API_KEY" ] || [ "$k" = "AUTHENTICATION_API_KEY" ]; then
          if ! grep -q "^EVOLUTION_API_KEY=" "$ROOT/.env" 2>/dev/null; then
            echo "EVOLUTION_API_KEY=$v" >> "$ROOT/.env"
            echo "==> Inyectado EVOLUTION_API_KEY en .env"
          fi
        fi
        if [ "$k" = "EVOLUTION_API_URL" ] || [ "$k" = "EVO_API_URL" ]; then
          if ! grep -q "^EVOLUTION_API_URL=" "$ROOT/.env" 2>/dev/null; then
            echo "EVOLUTION_API_URL=$v" >> "$ROOT/.env"
          fi
        fi
      fi
    done < "$evo_cand"
    break
  fi
done

# Fallback si no había archivo en el host:
if ! grep -q "^EVOLUTION_API_KEY=" "$ROOT/.env" 2>/dev/null; then
  echo "EVOLUTION_API_URL=https://evoapi.renace.tech" >> "$ROOT/.env"
  echo "EVOLUTION_API_KEY=d66888ea1d791329a97c934ea14014dc41c53e001440f74a" >> "$ROOT/.env"
  echo "==> Inyectado EVOLUTION_API_KEY por defecto en .env"
fi

if [ ! -s "$ROOT/.evolution.local" ]; then
  cat << 'EOF' > "$ROOT/.evolution.local"
EVOLUTION_API_URL=https://evoapi.renace.tech
EVOLUTION_API_KEY=d66888ea1d791329a97c934ea14014dc41c53e001440f74a
EOF
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

export RENACE_FORMS_PORT="${RENACE_FORMS_PORT:-3010}"

[ -x "$ROOT/scripts/fix-env-database-url.sh" ] && "$ROOT/scripts/fix-env-database-url.sh" "$ROOT/.env"
set -a
# shellcheck disable=SC1091
source .env
set +a

mkdir -p public/uploads
if [ "$(find public/uploads -type f 2>/dev/null | wc -l)" -gt 0 ]; then
  echo "==> Limpiando public/uploads antes del build ($(find public/uploads -type f | wc -l) archivos → volumen después)"
  rm -rf public/uploads/*
fi

echo "==> 1/5 npm ci + prisma generate..."
npm ci
npx prisma generate

echo "==> 2/5 next build..."
npm run build
"$ROOT/scripts/copy-prisma-standalone.sh"

if [ ! -f .next/standalone/server.js ]; then
  echo "ERROR: .next/standalone/server.js no existe."
  exit 1
fi
echo "    OK: standalone $(du -sh .next/standalone | cut -f1)"

echo "==> 3/5 docker build..."
docker build --network=host -t talentolink:latest -f Dockerfile .

echo "==> 4/5 docker compose up (127.0.0.1:${RENACE_FORMS_PORT})..."
prepare_forms_container
docker_compose up -d --remove-orphans

[ -x "$ROOT/scripts/sync-uploads.sh" ] && "$ROOT/scripts/sync-uploads.sh"

echo "==> 5/5 nginx..."
[ -x "$ROOT/scripts/setup-nginx.sh" ] && "$ROOT/scripts/setup-nginx.sh"

echo ""
echo "==> https://forms.renace.tech/admin"
docker_compose ps 2>/dev/null || true
