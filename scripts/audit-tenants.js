#!/usr/bin/env node
/**
 * Auditoría: empresas en JSON vs BD forms_talentolink vs carpetas ecofast
 */
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../migration_backup/data_migration_temp.json");
const ecofastBase = process.env.ECOFAST_BASE || "/var/www/ecofast";
const tenantsDir = path.join(ecofastBase, "tenants");

console.log("\n══════════════════════════════════════════════════");
console.log("  AUDITORÍA DE EMPRESAS — TalentoLink");
console.log("══════════════════════════════════════════════════\n");

// 1. Carpetas en servidor ecofast
const folderSlugs = [];
if (fs.existsSync(tenantsDir)) {
  for (const item of fs.readdirSync(tenantsDir).sort()) {
    const p = path.join(tenantsDir, item);
    if (fs.statSync(p).isDirectory()) folderSlugs.push(item);
  }
}
console.log(`📁 Carpetas en ${tenantsDir}: ${folderSlugs.length}`);
folderSlugs.forEach((s) => console.log(`   - ${s}`));

// 2. JSON de migración
let jsonTenants = [];
if (fs.existsSync(dataPath)) {
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  jsonTenants = data.tenants || [];
}
console.log(`\n📄 JSON migración (${path.basename(dataPath)}): ${jsonTenants.length}`);
let totalSubs = 0;
for (const t of jsonTenants) {
  const n = t.submissionsCount ?? t.submissions?.length ?? 0;
  totalSubs += n;
  console.log(`   - ${t.slug.padEnd(14)} | ${(t.config?.name || "?").slice(0, 35).padEnd(35)} | ${n} solicitudes`);
}
console.log(`   TOTAL solicitudes en JSON: ${totalSubs}`);

// 3. BD forms_talentolink (si DATABASE_URL)
async function auditDb() {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_MIGRATE;
  if (!url) {
    console.log("\n🗄️  BD forms_talentolink: (define DATABASE_URL_MIGRATE para auditar)");
    return;
  }
  try {
    const { Client } = require("pg");
    const c = new Client({ connectionString: url });
    await c.connect();
    const tenants = await c.query(`
      SELECT t.slug, t.name, t.active, COUNT(s.id)::int AS submissions
      FROM tenants t
      LEFT JOIN submissions s ON s.tenant_id = t.id
      GROUP BY t.id ORDER BY t.slug
    `);
    console.log(`\n🗄️  BD forms_talentolink: ${tenants.rows.length} empresas`);
    let dbTotal = 0;
    for (const r of tenants.rows) {
      dbTotal += r.submissions;
      console.log(`   - ${r.slug.padEnd(14)} | ${r.name.slice(0, 35).padEnd(35)} | ${r.submissions} solicitudes | ${r.active ? "activa" : "inactiva"}`);
    }
    console.log(`   TOTAL solicitudes en BD: ${dbTotal}`);
    await c.end();
  } catch (e) {
    console.log("\n🗄️  BD forms_talentolink: error —", e.message);
  }
}

// 4. Faltantes
const jsonSlugs = new Set(jsonTenants.map((t) => t.slug));
const missingInJson = folderSlugs.filter((s) => !jsonSlugs.has(s));
const missingFolders = [...jsonSlugs].filter((s) => !folderSlugs.includes(s));

console.log("\n⚠️  En carpetas pero NO en JSON:");
if (missingInJson.length === 0) console.log("   (ninguna)");
else missingInJson.forEach((s) => console.log(`   → ${s}  ← FALTA MIGRAR`));

console.log("\n⚠️  En JSON pero sin carpeta ecofast:");
if (missingFolders.length === 0) console.log("   (ninguna)");
else missingFolders.forEach((s) => console.log(`   → ${s}`));

console.log("\n══════════════════════════════════════════════════\n");

auditDb();
