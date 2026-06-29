#!/usr/bin/env bash
# Next.js standalone no incluye el query engine de Prisma — hay que copiarlo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE="$ROOT/.next/standalone"

if [ ! -f "$STANDALONE/server.js" ]; then
  echo "ERROR: falta .next/standalone — ejecuta npm run build primero"
  exit 1
fi

if [ ! -d "$ROOT/node_modules/.prisma/client" ]; then
  echo "ERROR: falta prisma client — ejecuta npx prisma generate"
  exit 1
fi

mkdir -p "$STANDALONE/node_modules/.prisma" "$STANDALONE/node_modules/@prisma"
rm -rf "$STANDALONE/node_modules/.prisma/client"
cp -r "$ROOT/node_modules/.prisma/client" "$STANDALONE/node_modules/.prisma/"
cp -r "$ROOT/node_modules/@prisma/client" "$STANDALONE/node_modules/@prisma/"

# .env no debe ir en la imagen (EACCES + secretos)
rm -f "$STANDALONE/.env" "$STANDALONE"/.env.* 2>/dev/null || true

ENGINES=$(find "$STANDALONE/node_modules/.prisma/client" -name 'libquery_engine-*' 2>/dev/null | wc -l)
echo "    OK: Prisma engine en standalone ($ENGINES binaries)"
