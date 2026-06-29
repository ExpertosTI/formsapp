/**
 * Extrae solicitudes de la BD legacy renace_forms (tabla submissions con tenant_slug)
 * y las fusiona en data_migration_temp.json
 *
 * Uso en servidor:
 *   LEGACY_DATABASE_URL="postgresql://...@127.0.0.1:5432/renace_forms" node migration_backup/extract_legacy_pg.js
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const dataPath = path.join(__dirname, "data_migration_temp.json");
const ecofastBase = process.env.ECOFAST_BASE || "/var/www/ecofast";

async function main() {
  const legacyUrl = process.env.LEGACY_DATABASE_URL;
  if (!legacyUrl) {
    console.log("LEGACY_DATABASE_URL no definida — omitiendo extracción PG legacy.");
    return;
  }

  const client = new Client({ connectionString: legacyUrl });
  await client.connect();

  const hasTable = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'submissions'
    ) AS ok
  `);

  if (!hasTable.rows[0]?.ok) {
    console.log("Tabla submissions no existe en BD legacy — nada que extraer.");
    await client.end();
    return;
  }

  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'submissions' AND table_schema = 'public'
  `);
  const colSet = new Set(cols.rows.map((r) => r.column_name));

  if (!colSet.has("tenant_slug")) {
    console.log("Tabla submissions sin columna tenant_slug — formato distinto.");
    await client.end();
    return;
  }

  const slugs = await client.query(`
    SELECT tenant_slug, COUNT(*)::int AS n
    FROM submissions GROUP BY tenant_slug ORDER BY tenant_slug
  `);

  console.log("\n--- BD legacy renace_forms ---");
  for (const row of slugs.rows) {
    console.log(`  ${row.tenant_slug}: ${row.n} solicitudes`);
  }

  let data = { tenants: [] };
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  }

  const bySlug = new Map(data.tenants.map((t) => [t.slug, t]));

  for (const row of slugs.rows) {
    const slug = row.tenant_slug;
    const res = await client.query(
      `SELECT id, tenant_slug, datos, archivos, estado, fecha
       FROM submissions WHERE tenant_slug = $1 ORDER BY fecha`,
      [slug]
    );

    const submissions = res.rows.map((s) => ({
      id: String(s.id),
      fecha: s.fecha ? new Date(s.fecha).toISOString().replace("T", " ").slice(0, 19) : null,
      estado: s.estado || "nuevo",
      datos: s.datos || {},
      archivos: s.archivos || {},
    }));

    let tenant = bySlug.get(slug);
    if (!tenant) {
      const configPath = path.join(ecofastBase, "tenants", slug, "tenant.json");
      let config = { slug, name: slug };
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      }
      tenant = {
        slug,
        config,
        submissionsCount: 0,
        submissions: [],
        uploads: [],
      };
      data.tenants.push(tenant);
      bySlug.set(slug, tenant);
      console.log(`  + Empresa nueva desde PG: ${slug}`);
    }

    // Preferir la fuente con más solicitudes
    if (submissions.length > (tenant.submissions?.length || 0)) {
      tenant.submissions = submissions;
      tenant.submissionsCount = submissions.length;
      console.log(`  ↑ ${slug}: actualizado desde PG (${submissions.length} solicitudes)`);
    }
  }

  data.timestamp = new Date().toISOString();
  data.legacy_pg = true;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`\nFusionado en ${dataPath} — total empresas: ${data.tenants.length}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
