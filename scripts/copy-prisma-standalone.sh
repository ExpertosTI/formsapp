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

echo "    OK: Prisma engine en standalone"
