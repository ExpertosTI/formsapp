const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dataPath = path.join(__dirname, 'data_migration_temp.json');

// Simple ID generator to match cuid/random style
const generateID = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

async function migrate() {
    console.log('--- STARTING SQL-DIRECT DATABASE MIGRATION ---');
    
    if (!fs.existsSync(dataPath)) {
        console.error('Error: data_migration_temp.json not found in migration_backup/');
        return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Found ${data.tenants.length} tenants in JSON.`);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL database.');

        for (const t of data.tenants) {
            console.log(`\nMigrating tenant: ${t.slug} (${t.config.name})...`);
            
            // 1. Create/Update Tenant
            const tenantId = generateID();
            const settings = JSON.stringify({
                sections: t.config.sections ?? {},
                notification_emails: t.config.notification_emails ?? '',
            });

            const tenantQuery = `
                INSERT INTO tenants (
                    id, slug, name, admin_email, admin_password, logo, sender_name, 
                    primary_color, accent_color, background_color, pin, settings, active, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, NOW())
                ON CONFLICT (slug) DO UPDATE SET 
                    name = EXCLUDED.name,
                    admin_email = EXCLUDED.admin_email,
                    active = EXCLUDED.active,
                    settings = EXCLUDED.settings
                RETURNING id;
            `;

            const tenantValues = [
                tenantId,
                t.slug,
                t.config.name || t.slug,
                t.config.admin_email || `${t.slug}@renace.tech`,
                t.config.admin_password || '',
                t.config.logo || '',
                t.config.sender_name || t.config.name,
                t.config.colors?.primary || '#1b2055',
                t.config.colors?.accent || '#2dd17c',
                t.config.colors?.bg || '#0f172a',
                '1234',
                settings,
                t.config.active ?? true,
                t.config.created ? new Date(t.config.created) : new Date()
            ];

            const res = await client.query(tenantQuery, tenantValues);
            const dbTenantId = res.rows[0].id;
            console.log(`  [OK] Tenant ready (ID: ${dbTenantId})`);

            // 2. Create Submissions
            if (t.submissions && t.submissions.length > 0) {
                console.log(`  Processing ${t.submissions.length} submissions...`);
                
                for (const s of t.submissions) {
                    const submissionQuery = `
                        INSERT INTO submissions (
                            id, tenant_id, data, files, status, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
                        ON CONFLICT (id) DO NOTHING;
                    `;
                    
                    const subValues = [
                        s.id || generateID(),
                        dbTenantId,
                        JSON.stringify(s.datos || {}),
                        JSON.stringify(s.archivos || {}),
                        s.estado || 'nuevo',
                        s.fecha ? new Date(s.fecha) : new Date()
                    ];
                    
                    await client.query(submissionQuery, subValues);
                }
                console.log(`  [OK] Submissions processed.`);
            }
        }

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await client.end();
        console.log('\n--- MIGRATION FINISHED ---');
    }
}

migrate();
