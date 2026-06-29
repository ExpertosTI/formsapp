const fs = require("fs");
const path = require("path");

const baseDir = process.env.ECOFAST_BASE || "/var/www/ecofast";
const tenantsDir = path.join(baseDir, "tenants");
const outPath =
  process.env.OUTPUT_PATH ||
  path.join(__dirname, "data_migration_temp.json");

function extractFromFilesystem() {
  const result = {
    tenants: [],
    timestamp: new Date().toISOString(),
    source: baseDir,
  };

  if (!fs.existsSync(tenantsDir)) {
    console.error(`No existe carpeta tenants: ${tenantsDir}`);
    return result;
  }

  const items = fs.readdirSync(tenantsDir).sort();
  for (const item of items) {
    const itemPath = path.join(tenantsDir, item);
    if (!fs.statSync(itemPath).isDirectory()) continue;

    console.log(`- Tenant carpeta: ${item}`);
    const tenant = {
      slug: item,
      config: { slug: item, name: item },
      submissionsCount: 0,
      submissions: [],
      uploads: [],
    };

    const configPath = path.join(itemPath, "tenant.json");
    if (fs.existsSync(configPath)) {
      try {
        tenant.config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      } catch (e) {
        console.error(`  [ERROR] tenant.json ${item}:`, e.message);
      }
    }

    const subPath = path.join(itemPath, "submissions.json");
    if (fs.existsSync(subPath)) {
      try {
        tenant.submissions = JSON.parse(fs.readFileSync(subPath, "utf8"));
        tenant.submissionsCount = tenant.submissions.length;
        console.log(`  [OK] ${tenant.submissionsCount} solicitudes`);
      } catch (e) {
        console.error(`  [ERROR] submissions.json ${item}:`, e.message);
      }
    }

    const uploadsDir = path.join(itemPath, "uploads");
    if (fs.existsSync(uploadsDir)) {
      tenant.uploads = fs
        .readdirSync(uploadsDir)
        .filter((f) => !f.startsWith("."));
      console.log(`  [OK] ${tenant.uploads.length} archivos`);
    }

    result.tenants.push(tenant);
  }

  return result;
}

const data = extractFromFilesystem();
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`\nGuardado: ${outPath}`);
console.log(`Empresas encontradas: ${data.tenants.length}`);
