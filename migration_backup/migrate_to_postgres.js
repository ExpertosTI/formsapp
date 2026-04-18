const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dataPath = path.join(__dirname, 'data_migration_temp.json');

async function migrate() {
    console.log('--- STARTING DATABASE MIGRATION ---');
    
    if (!fs.existsSync(dataPath)) {
        console.error('Error: consolidated_data.json not found in migration_backup/');
        return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Found ${data.tenants.length} tenants to migrate.`);

    for (const t of data.tenants) {
        console.log(`\nMigrating tenant: ${t.slug} (${t.config.name})...`);
        
        try {
            // 1. Create Tenant
            const tenant = await prisma.tenant.upsert({
                where: { slug: t.slug },
                update: {},
                create: {
                   slug: t.slug,
                   name: t.config.name || t.slug,
                   adminEmail: t.config.admin_email || `${t.slug}@renace.tech`,
                   adminPassword: t.config.admin_password || '',
                   logo: t.config.logo || '',
                   senderName: t.config.sender_name || t.config.name,
                   primaryColor: t.config.colors?.primary || '#1b2055',
                   accentColor: t.config.colors?.accent || '#2dd17c',
                   backgroundColor: t.config.colors?.bg || '#0f172a',
                   active: t.config.active ?? true,
                   createdAt: t.config.created ? new Date(t.config.created) : new Date(),
                }
            });

            console.log(`  [OK] Tenant created/verified (ID: ${tenant.id})`);

            // 2. Create Submissions
            if (t.submissions && t.submissions.length > 0) {
                console.log(`  Processing ${t.submissions.length} submissions...`);
                
                const submissionsData = t.submissions.map(s => ({
                    tenantId: tenant.id,
                    data: s.datos || {},
                    files: s.archivos || [],
                    status: s.estado || 'nuevo',
                    createdAt: s.fecha ? new Date(s.fecha) : new Date(),
                }));

                // Batch insert (Prisma does not support createMany on all DBs, but on Postgres yes)
                const result = await prisma.submission.createMany({
                    data: submissionsData,
                    skipDuplicates: true,
                });

                console.log(`  [OK] Migrated ${result.count} submissions.`);
            } else {
                console.log(`  [INFO] No submissions found for this tenant.`);
            }

        } catch (error) {
            console.error(`  [ERROR] Failed to migrate tenant ${t.slug}:`, error.message);
        }
    }

    console.log('\n--- MIGRATION FINISHED ---');
}

migrate()
    .catch(e => console.error('Migration failed:', e))
    .finally(() => prisma.$disconnect());
