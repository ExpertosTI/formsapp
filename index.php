<?php
// index.php — Router principal de la plataforma Multi-Tenant Forms
require_once __DIR__ . '/config.php';

// Parse the request URI
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);
$path = rtrim($path, '/');
if (empty($path))
    $path = '/';

// Remove base path if behind a subdirectory (not expected but safe)
$segments = array_values(array_filter(explode('/', $path)));

// ── Routing ──────────────────────────────────────────────────

// GET /  → Landing page
if (empty($segments)) {
    require __DIR__ . '/landing.php';
    exit;
}

$firstSegment = $segments[0] ?? '';
$secondSegment = $segments[1] ?? '';

// GET /admin  → Super Admin panel
if ($firstSegment === 'admin' && empty($secondSegment)) {
    require __DIR__ . '/super_admin.php';
    exit;
}

// GET /submit  → Form submission handler (POST)
if ($firstSegment === 'submit') {
    require __DIR__ . '/submit_application.php';
    exit;
}

// ── Tenant-based routes ─────────────────────────────────────
$slug = $firstSegment;
$tenant = loadTenant($slug);

if (!$tenant) {
    // 404 — tenant not found
    http_response_code(404);
    ?>
    <!DOCTYPE html>
    <html lang="es">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>No encontrado —
            <?= htmlspecialchars(PLATFORM_NAME) ?>
        </title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            body {
                background: <?= PLATFORM_COLOR_BG ?>;
                color: #e2e8f0;
                font-family: 'Inter', sans-serif;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .card {
                text-align: center;
                padding: 60px 40px;
                max-width: 460px;
            }

            .code {
                font-size: 5rem;
                font-weight: 800;
                background: linear-gradient(135deg, <?= PLATFORM_COLOR_PRIMARY ?>, <?= PLATFORM_COLOR_ACCENT ?>);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            h2 {
                font-size: 1.3rem;
                margin: 16px 0 12px;
                color: #f8fafc;
            }

            p {
                color: #94a3b8;
                font-size: 0.95rem;
                line-height: 1.6;
                margin-bottom: 28px;
            }

            a {
                display: inline-block;
                background: linear-gradient(135deg, <?= PLATFORM_COLOR_PRIMARY ?>, <?= PLATFORM_COLOR_ACCENT ?>);
                color: #fff;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 10px;
                font-weight: 600;
                transition: all 0.3s;
            }

            a:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(45, 209, 124, 0.25);
            }
        </style>
    </head>

    <body>
        <div class="card">
            <div class="code">404</div>
            <h2>Empresa no encontrada</h2>
            <p>El formulario que buscas no existe o ha sido desactivado.</p>
            <a href="/">← Volver al inicio</a>
        </div>
    </body>

    </html>
    <?php
    exit;
}

// Check if tenant is active
if (!($tenant['active'] ?? true)) {
    http_response_code(403);
    echo '<!DOCTYPE html><html><head><title>Desactivado</title></head><body><h1>Este formulario está temporalmente desactivado.</h1></body></html>';
    exit;
}

// GET /{slug}/admin  → Tenant admin panel
if ($secondSegment === 'admin') {
    $GLOBALS['current_tenant'] = $tenant;
    require __DIR__ . '/admin.php';
    exit;
}

// GET /{slug}  → Tenant form
if (empty($secondSegment)) {
    $GLOBALS['current_tenant'] = $tenant;
    require __DIR__ . '/form.php';
    exit;
}

// Fallback 404
http_response_code(404);
header('Location: /');
exit;
