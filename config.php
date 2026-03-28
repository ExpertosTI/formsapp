<?php
// config.php — Configuración global de la plataforma Multi-Tenant Forms

// ── Security Headers ─────────────────────────────────────────
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// ── SMTP Configuration ──────────────────────────────────────
// Secrets must be set via environment (or .user.ini / server config). No defaults in source.
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.hostinger.com');
define('SMTP_PORT', (int) (getenv('SMTP_PORT') ?: 465));
define('SMTP_USERNAME', getenv('SMTP_USERNAME') ?: '');
define('SMTP_PASSWORD', getenv('SMTP_PASSWORD') !== false ? getenv('SMTP_PASSWORD') : '');

// ── Platform Branding ───────────────────────────────────────
define('PLATFORM_NAME', 'RENACE Forms');
define('PLATFORM_DOMAIN', 'forms.renace.tech');

// Platform colors (from Ecofast logo)
define('PLATFORM_COLOR_PRIMARY', '#1b2055');   // Navy dark
define('PLATFORM_COLOR_ACCENT', '#2dd17c');    // Green
define('PLATFORM_COLOR_BG', '#0f172a');        // Dark background

// ── Database Configuration (PostgreSQL) ─────────────────────
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '5432');
define('DB_NAME', getenv('DB_NAME') ?: 'renace_forms');
define('DB_USER', getenv('DB_USER') ?: 'renaceforms');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');

// ── Super Admin ─────────────────────────────────────────────
// Prefer SUPER_ADMIN_PASSWORD_HASH (bcrypt/argon) in production; plain SUPER_ADMIN_PASSWORD only for migration.
define('SUPER_ADMIN_PASSWORD', getenv('SUPER_ADMIN_PASSWORD') !== false ? getenv('SUPER_ADMIN_PASSWORD') : '');
define('SUPER_ADMIN_PASSWORD_HASH', getenv('SUPER_ADMIN_PASSWORD_HASH') !== false ? getenv('SUPER_ADMIN_PASSWORD_HASH') : '');

// ── Directories ─────────────────────────────────────────────
define('BASE_DIR', __DIR__);
define('TENANTS_DIR', __DIR__ . '/tenants');
define('IMAGES_DIR', __DIR__ . '/images');

// ── Timezone ────────────────────────────────────────────────
date_default_timezone_set('America/Santo_Domingo');

// Ensure tenants directory exists
if (!is_dir(TENANTS_DIR)) {
    mkdir(TENANTS_DIR, 0755, true);
}

// ══════════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ══════════════════════════════════════════════════════════════

/**
 * Get a connection to the PostgreSQL database using PDO.
 * Returns the PDO instance or null on failure.
 */
function getDB(): ?PDO
{
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = sprintf(
                "pgsql:host=%s;port=%s;dbname=%s",
                DB_HOST,
                DB_PORT,
                DB_NAME
            );
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            return null;
        }
    }
    return $pdo;
}

// ══════════════════════════════════════════════════════════════
// MULTI-TENANT HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Load a tenant by slug
 * @return array|null Tenant config or null if not found
 */
function loadTenant(string $slug): ?array
{
    $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower($slug));
    $configFile = TENANTS_DIR . '/' . $slug . '/tenant.json';
    if (!file_exists($configFile)) {
        return null;
    }
    $tenant = json_decode(file_get_contents($configFile), true);
    if (!$tenant)
        return null;
    $tenant['slug'] = $slug;
    $tenant['dir'] = TENANTS_DIR . '/' . $slug;
    $tenant['submissions_file'] = TENANTS_DIR . '/' . $slug . '/submissions.json';
    $tenant['uploads_dir'] = TENANTS_DIR . '/' . $slug . '/uploads';
    return $tenant;
}

/**
 * Get all tenants
 * @return array List of tenant configs
 */
function getAllTenants(): array
{
    $tenants = [];
    if (!is_dir(TENANTS_DIR))
        return $tenants;
    $dirs = scandir(TENANTS_DIR);
    foreach ($dirs as $dir) {
        if ($dir === '.' || $dir === '..')
            continue;
        $t = loadTenant($dir);
        if ($t)
            $tenants[] = $t;
    }
    // Sort by creation date desc
    usort($tenants, function ($a, $b) {
        return strcmp($b['created'] ?? '', $a['created'] ?? '');
    });
    return $tenants;
}

/**
 * Create a new tenant
 * @return array ['success' => bool, 'message' => string, 'password' => string|null]
 */
function createTenant(string $name, string $slug, string $adminEmail, string $senderName, array $colors, ?string $logoPath = null): array
{
    $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower($slug));
    if (empty($slug) || strlen($slug) < 2) {
        return ['success' => false, 'message' => 'Slug inválido (mínimo 2 caracteres, solo letras/números/guiones)'];
    }
    $tenantDir = TENANTS_DIR . '/' . $slug;
    if (is_dir($tenantDir)) {
        return ['success' => false, 'message' => 'Ya existe una empresa con ese identificador'];
    }

    // Create directories
    mkdir($tenantDir, 0755, true);
    mkdir($tenantDir . '/uploads', 0755, true);

    // Generate password
    $password = generatePassword();

    // Tenant config
    $tenant = [
        'name' => $name,
        'slug' => $slug,
        'admin_email' => $adminEmail,
        'admin_password' => password_hash($password, PASSWORD_DEFAULT),
        'logo' => $logoPath ?: '',
        'sender_name' => $senderName ?: $name,
        'colors' => [
            'primary' => $colors['primary'] ?? PLATFORM_COLOR_PRIMARY,
            'accent' => $colors['accent'] ?? PLATFORM_COLOR_ACCENT,
            'bg' => $colors['bg'] ?? PLATFORM_COLOR_BG,
        ],
        'created' => date('Y-m-d H:i:s'),
        'active' => true,
    ];

    // Initialize empty submissions
    file_put_contents($tenantDir . '/submissions.json', json_encode([], JSON_PRETTY_PRINT));
    file_put_contents($tenantDir . '/tenant.json', json_encode($tenant, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    return ['success' => true, 'message' => 'Empresa creada exitosamente', 'password' => $password, 'slug' => $slug];
}

/**
 * Update a tenant config
 */
function updateTenant(string $slug, array $updates): bool
{
    $tenant = loadTenant($slug);
    if (!$tenant)
        return false;
    $configFile = TENANTS_DIR . '/' . $slug . '/tenant.json';
    $config = json_decode(file_get_contents($configFile), true);
    $config = array_merge($config, $updates);
    return file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

/**
 * Verify tenant admin password
 */
function verifyTenantPassword(array $tenant, string $password): bool
{
    $configFile = TENANTS_DIR . '/' . $tenant['slug'] . '/tenant.json';
    $config = json_decode(file_get_contents($configFile), true);
    $storedPassword = $config['admin_password'] ?? '';

    // Support both hashed and plain text passwords (for migration)
    if (password_verify($password, $storedPassword)) {
        return true;
    }
    // Fallback: direct comparison (legacy/migration)
    return hash_equals($storedPassword, $password);
}

/**
 * After a successful login: rehash legacy plain-text passwords to bcrypt, and strip admin_password_plain if present.
 * Preserves all other tenant.json fields (name, logo, submissions paths unchanged).
 */
function migrateTenantPasswordToHashIfLegacy(string $slug, string $password): void
{
    $configFile = TENANTS_DIR . '/' . $slug . '/tenant.json';
    if (!is_readable($configFile) || !is_writable($configFile)) {
        return;
    }
    $config = json_decode(file_get_contents($configFile), true);
    if (!$config || !is_array($config)) {
        return;
    }
    $stored = $config['admin_password'] ?? '';
    if ($stored === '') {
        return;
    }

    $dirty = false;
    if (isset($config['admin_password_plain'])) {
        unset($config['admin_password_plain']);
        $dirty = true;
    }

    if (password_verify($password, $stored)) {
        if ($dirty) {
            file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
        return;
    }

    if (hash_equals($stored, $password)) {
        $config['admin_password'] = password_hash($password, PASSWORD_DEFAULT);
        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}

/**
 * Generate a random secure password
 */
function generatePassword(int $length = 12): string
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $password;
}

/**
 * Slugify a string
 */
function slugify(string $text): string
{
    $text = strtolower(trim($text));
    $text = preg_replace('/[áàäâ]/u', 'a', $text);
    $text = preg_replace('/[éèëê]/u', 'e', $text);
    $text = preg_replace('/[íìïî]/u', 'i', $text);
    $text = preg_replace('/[óòöô]/u', 'o', $text);
    $text = preg_replace('/[úùüû]/u', 'u', $text);
    $text = preg_replace('/ñ/u', 'n', $text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text;
}

/**
 * Compute contrasting text color for a background
 */
function contrastColor(string $hex): string
{
    $hex = ltrim($hex, '#');
    $r = hexdec(substr($hex, 0, 2));
    $g = hexdec(substr($hex, 2, 2));
    $b = hexdec(substr($hex, 4, 2));
    $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;
    return $luminance > 0.5 ? '#1e293b' : '#f8fafc';
}

/**
 * Lighten or darken a hex color
 */
function adjustColor(string $hex, int $steps): string
{
    $hex = ltrim($hex, '#');
    $r = max(0, min(255, hexdec(substr($hex, 0, 2)) + $steps));
    $g = max(0, min(255, hexdec(substr($hex, 2, 2)) + $steps));
    $b = max(0, min(255, hexdec(substr($hex, 4, 2)) + $steps));
    return '#' . str_pad(dechex($r), 2, '0', STR_PAD_LEFT) . str_pad(dechex($g), 2, '0', STR_PAD_LEFT) . str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
}

/**
 * Convert hex to rgba
 */
function hexToRgba(string $hex, float $alpha = 1): string
{
    $hex = ltrim($hex, '#');
    $r = hexdec(substr($hex, 0, 2));
    $g = hexdec(substr($hex, 2, 2));
    $b = hexdec(substr($hex, 4, 2));
    return "rgba($r, $g, $b, $alpha)";
}
