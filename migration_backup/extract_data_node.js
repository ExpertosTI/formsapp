const fs = require('fs');
const path = require('path');

const baseDir = '/Users/brainiac/Documents/DEVSS2026/ecofast';
const tenantsDir = path.join(baseDir, 'tenants');

function extract() {
    console.log('Starting data extraction via Node.js...');
    const result = {
        tenants: [],
        timestamp: new Date().toISOString(),
        source: baseDir
    };

    if (!fs.existsSync(tenantsDir)) {
        console.error('Tenants directory not found.');
        return;
    }

    const items = fs.readdirSync(tenantsDir);
    for (const item of items) {
        const itemPath = path.join(tenantsDir, item);
        if (fs.statSync(itemPath).isDirectory()) {
            console.log(`- Detected tenant: ${item}`);
            const tenant = {
                slug: item,
                config: {},
                submissionsCount: 0,
                submissions: [],
                uploads: []
            };

            // Read tenant.json
            const configPath = path.join(itemPath, 'tenant.json');
            if (fs.existsSync(configPath)) {
                try {
                    tenant.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } catch (e) {
                    console.error(`  [ERROR] Parsing tenant.json for ${item}:`, e.message);
                }
            }

            // Read submissions.json
            const subPath = path.join(itemPath, 'submissions.json');
            if (fs.existsSync(subPath)) {
                try {
                    tenant.submissions = JSON.parse(fs.readFileSync(subPath, 'utf8'));
                    tenant.submissionsCount = tenant.submissions.length;
                    console.log(`  [OK] Found ${tenant.submissionsCount} submissions.`);
                } catch (e) {
                    console.error(`  [ERROR] Parsing submissions.json for ${item}:`, e.message);
                }
            }

            // List uploads
            const uploadsDir = path.join(itemPath, 'uploads');
            if (fs.existsSync(uploadsDir)) {
                tenant.uploads = fs.readdirSync(uploadsDir).filter(f => f !== '.' && f !== '..');
                console.log(`  [OK] Found ${tenant.uploads.length} uploaded files.`);
            }

            result.tenants.push(tenant);
        }
    }

    const outputPath = path.join(baseDir, 'data_migration_temp.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nSUCCESS: Extraction complete.`);
    console.log(`Consolidated data saved to: ${outputPath}`);
}

extract();
