#!/usr/bin/env bash
# Crea .env de producción, BD AISLADA de Odoo, y despliega.
# Ejecutar en el servidor: ./scripts/provision-production.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# BD dedicada — NUNCA renace_forms (en este servidor es Odoo)
DB_NAME="forms_talentolink"
DB_USER="renaceforms"
DB_PASS="RenaceForms2026!xK9mP2"

node <<NODE
const fs = require("fs");
const DB_NAME = "${DB_NAME}";
const DB_USER = "${DB_USER}";
const DB_PASS = "${DB_PASS}";
const enc = encodeURIComponent(DB_PASS);
const env = \`NEXT_PUBLIC_BASE_URL=https://forms.renace.tech
DATABASE_URL=postgresql://\${DB_USER}:\${enc}@host.docker.internal:5432/\${DB_NAME}
DATABASE_URL_MIGRATE=postgresql://\${DB_USER}:\${enc}@127.0.0.1:5432/\${DB_NAME}
SUPER_ADMIN_EMAIL=admin@renace.tech
SUPER_ADMIN_PASSWORD=CatagceAdmin2026!
ADMIN_SESSION_SECRET=tl_8f3a2c91e7b4d605a8e2f1b9c0d7e6a5f4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8
RENACE_FORMS_PORT=3010
\`;
fs.writeFileSync(".env", env, { mode: 0o600 });
console.log("==> .env creado — BD dedicada: " + DB_NAME);
NODE

export DB_NAME DB_USER DB_PASS
./deploy.sh db
./scripts/setup-server.sh
