#!/usr/bin/env bash
# Lista empresas migradas y sus URLs públicas
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

set -a
# shellcheck disable=SC1091
[ -f .env ] && source .env
set +a

export MIGRATE_URL="${DATABASE_URL_MIGRATE:-$DATABASE_URL}"
export BASE_URL="${NEXT_PUBLIC_BASE_URL:-https://forms.renace.tech}"

node <<'NODE'
const { Client } = require("pg");

(async () => {
  const c = new Client({ connectionString: process.env.MIGRATE_URL });
  await c.connect();
  const base = process.env.BASE_URL;
  const { rows } = await c.query(`
    SELECT slug, name, admin_email, active,
           (SELECT COUNT(*)::int FROM submissions s WHERE s.tenant_id = t.id) AS submissions
    FROM tenants t ORDER BY slug
  `);
  console.log("Empresas en forms_talentolink:\n");
  for (const r of rows) {
    console.log(`  ${r.name}`);
    console.log(`    Formulario: ${base}/forms/${r.slug}`);
    console.log(`    URL corta:  ${base}/${r.slug} → redirige al formulario`);
    console.log(`    Admin email (legacy): ${r.admin_email}`);
    console.log(`    Candidatos: ${r.submissions} | ${r.active ? "activa" : "inactiva"}`);
    console.log("");
  }
  console.log(`Super admin panel: ${base}/admin`);
  await c.end();
})().catch((e) => {
  console.error("ERROR BD:", e.message);
  process.exit(1);
});
NODE
