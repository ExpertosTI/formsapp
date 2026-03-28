<?php
// super_admin.php — Panel de Super Administrador (gestión de empresas)
require_once __DIR__ . '/config.php';

ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');
session_start();

// ── Auth ─────────────────────────────────────────────────────
$isAuth = isset($_SESSION['super_admin']) && $_SESSION['super_admin'] === true;
$loginError = false;
$createdTenant = null;

if (isset($_POST['super_login'])) {
    $pwd = (string) ($_POST['password'] ?? '');
    $hashEnv = SUPER_ADMIN_PASSWORD_HASH;
    $plainEnv = SUPER_ADMIN_PASSWORD;
    $authOk = false;
    if ($pwd !== '') {
        if ($hashEnv !== '') {
            $authOk = password_verify($pwd, $hashEnv);
        } elseif ($plainEnv !== '') {
            $authOk = hash_equals($plainEnv, $pwd);
        }
    }
    if ($authOk) {
        session_regenerate_id(true);
        $_SESSION['super_admin'] = true;
        $_SESSION['csrf_token_sa'] = bin2hex(random_bytes(32));
        $isAuth = true;
    } else {
        $loginError = true;
    }
}

if (isset($_GET['logout'])) {
    unset($_SESSION['super_admin']);
    header('Location: /admin');
    exit;
}

// ── CSRF ─────────────────────────────────────────────────────
if ($isAuth && empty($_SESSION['csrf_token_sa'])) {
    $_SESSION['csrf_token_sa'] = bin2hex(random_bytes(32));
}
$csrf = $_SESSION['csrf_token_sa'] ?? '';

// ── Create tenant ────────────────────────────────────────────
if ($isAuth && isset($_POST['create_tenant'])) {
    if (!hash_equals($csrf, $_POST['csrf_token'] ?? '')) {
        $createdTenant = ['success' => false, 'message' => 'Token inválido'];
    } else {
        $name = trim($_POST['company_name'] ?? '');
        $slug = trim($_POST['company_slug'] ?? '');
        if (empty($slug))
            $slug = slugify($name);
        $email = trim($_POST['admin_email'] ?? '');
        $senderName = trim($_POST['sender_name'] ?? '') ?: $name;
        $colors = [
            'primary' => $_POST['color_primary'] ?? PLATFORM_COLOR_PRIMARY,
            'accent' => $_POST['color_accent'] ?? PLATFORM_COLOR_ACCENT,
            'bg' => $_POST['color_bg'] ?? PLATFORM_COLOR_BG,
        ];

        // Handle logo upload
        $logoPath = '';
        if (isset($_FILES['company_logo']) && $_FILES['company_logo']['error'] == UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES['company_logo']['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'svg', 'webp'])) {
                $logoName = $slug . '_logo.' . $ext;
                $dest = IMAGES_DIR . '/' . $logoName;
                if (!is_dir(IMAGES_DIR))
                    mkdir(IMAGES_DIR, 0755, true);
                if (move_uploaded_file($_FILES['company_logo']['tmp_name'], $dest)) {
                    $logoPath = 'images/' . $logoName;
                }
            }
        }

        $createdTenant = createTenant($name, $slug, $email, $senderName, $colors, $logoPath);
        $_SESSION['csrf_token_sa'] = bin2hex(random_bytes(32));
        $csrf = $_SESSION['csrf_token_sa'];
    }
}

// ── Delete tenant ────────────────────────────────────────────
if ($isAuth && isset($_POST['delete_tenant'])) {
    $delSlug = $_POST['slug'] ?? '';
    if ($delSlug && is_dir(TENANTS_DIR . '/' . $delSlug)) {
        // Recursively delete
        $it = new RecursiveDirectoryIterator(TENANTS_DIR . '/' . $delSlug, RecursiveDirectoryIterator::SKIP_DOTS);
        $files = new RecursiveIteratorIterator($it, RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($files as $file) {
            if ($file->isDir())
                rmdir($file->getRealPath());
            else
                unlink($file->getRealPath());
        }
        rmdir(TENANTS_DIR . '/' . $delSlug);
    }
    header('Location: /admin');
    exit;
}

// ── Toggle tenant ────────────────────────────────────────────
if ($isAuth && isset($_POST['toggle_tenant'])) {
    $tSlug = $_POST['slug'] ?? '';
    $t = loadTenant($tSlug);
    if ($t) {
        $configFile = TENANTS_DIR . '/' . $tSlug . '/tenant.json';
        $config = json_decode(file_get_contents($configFile), true);
        $config['active'] = !($config['active'] ?? true);
        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    header('Location: /admin');
    exit;
}

$tenants = $isAuth ? getAllTenants() : [];

$p = PLATFORM_COLOR_PRIMARY;
$a = PLATFORM_COLOR_ACCENT;
$bg = PLATFORM_COLOR_BG;
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Admin —
        <?= PLATFORM_NAME ?>
    </title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary: <?= $p ?>;
            --accent: <?= $a ?>;
            --bg: <?= $bg ?>;
            --bg2: #1e293b;
            --bg-card: rgba(30, 41, 59, 0.7);
            --border: rgba(255, 255, 255, 0.08);
            --text: #e2e8f0;
            --text-muted: #94a3b8;
            --text-bright: #f8fafc;
            --success: #10b981;
            --danger: #ef4444;
        }

        * {
            box-sizing: border-box;
        }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
        }

        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background:
                radial-gradient(circle at 30% 20%, <?= hexToRgba($p, 0.15) ?> 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, <?= hexToRgba($a, 0.1) ?> 0%, transparent 50%);
            z-index: 0;
        }

        /* ── Login ──────────────────────────── */
        .login-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 1;
        }

        .login-card {
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 48px 40px;
            width: 100%;
            max-width: 420px;
            text-align: center;
        }

        .login-card h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-bright);
            margin-bottom: 8px;
        }

        .login-card p {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-bottom: 32px;
        }

        .login-card .form-control {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border);
            color: var(--text-bright);
            border-radius: 10px;
            padding: 12px 16px;
            font-size: 0.9rem;
            text-align: center;
        }

        .login-card .form-control:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px <?= hexToRgba($a, 0.15) ?>;
            color: white;
            outline: none;
        }

        .btn-primary-custom {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: white;
            border: none;
            padding: 12px;
            width: 100%;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 0.95rem;
        }

        .btn-primary-custom:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px <?= hexToRgba($a, 0.3) ?>;
        }

        .login-error {
            color: #fca5a5;
            font-size: 0.85rem;
            margin-top: 12px;
        }

        /* ── Dashboard ──────────────────────── */
        .dashboard {
            position: relative;
            z-index: 1;
            padding: 24px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            flex-wrap: wrap;
            gap: 16px;
        }

        .top-bar h1 {
            font-size: 1.6rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
        }

        .btn-ghost {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .btn-ghost:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-bright);
        }

        /* ── Cards ──────────────────────────── */
        .card-section {
            background: var(--bg-card);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 24px;
        }

        .card-section h2 {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--text-bright);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .card-section h2 i {
            color: var(--accent);
        }

        /* ── Form controls ──────────────────── */
        .form-label {
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--text);
            margin-bottom: 6px;
        }

        .form-control,
        .form-select {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border);
            border-radius: 10px;
            color: var(--text-bright);
            padding: 10px 14px;
            font-size: 0.9rem;
            transition: all 0.3s;
        }

        .form-control:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px <?= hexToRgba($a, 0.1) ?>;
            outline: none;
            color: white;
        }

        .form-control::placeholder {
            color: var(--text-muted);
            opacity: 0.6;
        }

        input[type="color"] {
            padding: 4px;
            height: 42px;
            cursor: pointer;
        }

        /* ── Company list ───────────────────── */
        .company-row {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            border: 1px solid var(--border);
            border-radius: 12px;
            margin-bottom: 12px;
            transition: all 0.3s;
            background: rgba(255, 255, 255, 0.02);
        }

        .company-row:hover {
            border-color: <?= hexToRgba($a, 0.2) ?>;
            background: rgba(255, 255, 255, 0.04);
        }

        .company-logo {
            width: 64px;
            height: 64px;
            border-radius: 14px;
            background: linear-gradient(160deg, #ffffff, #f1f5f9);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
            border: 1px solid rgba(255, 255, 255, 0.65);
            box-shadow:
                0 6px 18px rgba(0, 0, 0, 0.15),
                0 0 0 1px rgba(0, 0, 0, 0.04);
        }

        .company-logo img {
            max-width: 92%;
            max-height: 92%;
            width: auto;
            height: auto;
            object-fit: contain;
            object-position: center;
        }

        .company-logo .no-logo {
            color: var(--primary);
            font-size: 1.2rem;
            opacity: 0.4;
        }

        .company-info {
            flex: 1;
            min-width: 0;
        }

        .company-info h4 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-bright);
        }

        .company-info p {
            margin: 2px 0 0;
            font-size: 0.8rem;
            color: var(--text-muted);
        }

        .company-actions {
            display: flex;
            gap: 6px;
            flex-shrink: 0;
        }

        .company-badge {
            font-size: 0.72rem;
            padding: 3px 10px;
            border-radius: 12px;
            font-weight: 600;
        }

        .company-badge.active {
            background: rgba(16, 185, 129, 0.15);
            color: #6ee7b7;
        }

        .company-badge.inactive {
            background: rgba(239, 68, 68, 0.15);
            color: #fca5a5;
        }

        .btn-sm-action {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 0.78rem;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
        }

        .btn-sm-action:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-bright);
        }

        .btn-sm-action.danger:hover {
            color: var(--danger);
            border-color: rgba(239, 68, 68, 0.3);
        }

        /* ── Created tenant alert ───────────── */
        .alert-created {
            background: rgba(45, 209, 124, 0.1);
            border: 1px solid rgba(45, 209, 124, 0.3);
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 24px;
        }

        .alert-created h3 {
            color: #6ee7b7;
            font-size: 1rem;
            margin: 0 0 12px;
        }

        .alert-created .pwd-box {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            font-family: monospace;
            font-size: 1.1rem;
            color: #f0fdf4;
            text-align: center;
            margin: 12px 0;
            letter-spacing: 1px;
            user-select: all;
        }

        .alert-created p {
            color: #94a3b8;
            font-size: 0.85rem;
            margin: 4px 0;
        }

        /* ── Responsive ─────────────────────── */
        @media (max-width: 768px) {
            .dashboard {
                padding: 16px;
            }

            .card-section {
                padding: 20px;
            }

            .company-row {
                flex-wrap: wrap;
            }
        }

        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 3px;
        }
    </style>
</head>

<body>

    <?php if (!$isAuth): ?>
        <div class="login-wrapper">
            <div class="login-card">
                <div style="font-size:2.5rem;margin-bottom:20px;opacity:0.8;">
                    <i class="fas fa-crown" style="color:<?= $a ?>;"></i>
                </div>
                <h1>Super Admin</h1>
                <p>
                    <?= PLATFORM_NAME ?> — Gestión de Empresas
                </p>
                <form method="POST">
                    <input type="password" name="password" class="form-control" placeholder="Contraseña maestra" autofocus
                        required>
                    <button type="submit" name="super_login" value="1" class="btn-primary-custom"
                        style="margin-top:16px;">Ingresar</button>
                </form>
                <?php if ($loginError): ?>
                    <div class="login-error"><i class="fas fa-exclamation-triangle"></i> Contraseña incorrecta</div>
                <?php endif; ?>
                <div style="margin-top:24px;"><a href="/"
                        style="color:var(--text-muted);font-size:0.82rem;text-decoration:none;"><i
                            class="fas fa-arrow-left"></i> Volver al inicio</a></div>
            </div>
        </div>

    <?php else: ?>
        <div class="dashboard">
            <div class="top-bar">
                <h1><i class="fas fa-crown"></i> Super Admin</h1>
                <div style="display:flex;gap:10px;">
                    <a href="/" class="btn-ghost"><i class="fas fa-home"></i> Inicio</a>
                    <a href="/admin?logout" class="btn-ghost"><i class="fas fa-sign-out-alt"></i> Salir</a>
                </div>
            </div>

            <!-- Created tenant alert -->
            <?php if ($createdTenant && $createdTenant['success']): ?>
                <div class="alert-created">
                    <h3><i class="fas fa-check-circle"></i> ¡Empresa creada exitosamente!</h3>
                    <p><strong>Slug:</strong>
                        <?= htmlspecialchars($createdTenant['slug'] ?? '') ?>
                    </p>
                    <p><strong>URL del formulario:</strong> <a href="/<?= htmlspecialchars($createdTenant['slug'] ?? '') ?>"
                            target="_blank" style="color:#6ee7b7;">forms.renace.tech/
                            <?= htmlspecialchars($createdTenant['slug'] ?? '') ?>
                        </a></p>
                    <p><strong>URL del admin:</strong> <a href="/<?= htmlspecialchars($createdTenant['slug'] ?? '') ?>/admin"
                            target="_blank" style="color:#6ee7b7;">forms.renace.tech/
                            <?= htmlspecialchars($createdTenant['slug'] ?? '') ?>/admin
                        </a></p>
                    <p><strong>Contraseña de acceso al admin:</strong></p>
                    <div class="pwd-box">
                        <?= htmlspecialchars($createdTenant['password'] ?? '') ?>
                    </div>
                    <p style="color:#fbbf24;"><i class="fas fa-exclamation-triangle"></i> <strong>¡Guarda esta
                            contraseña!</strong> No se mostrará de nuevo.</p>
                </div>
            <?php elseif ($createdTenant && !$createdTenant['success']): ?>
                <div
                    style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:20px;margin-bottom:24px;color:#fca5a5;">
                    <i class="fas fa-exclamation-circle"></i>
                    <?= htmlspecialchars($createdTenant['message']) ?>
                </div>
            <?php endif; ?>

            <!-- Create new company -->
            <div class="card-section">
                <h2><i class="fas fa-plus-circle"></i> Crear Nueva Empresa</h2>
                <form method="POST" enctype="multipart/form-data">
                    <input type="hidden" name="csrf_token" value="<?= $csrf ?>">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Nombre de la Empresa *</label>
                            <input type="text" class="form-control" name="company_name" placeholder="Ej: Mi Empresa SRL"
                                required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Slug (URL) <small style="color:var(--text-muted)">— auto-generado si
                                    vacío</small></label>
                            <input type="text" class="form-control" name="company_slug" placeholder="mi-empresa">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email del administrador *</label>
                            <input type="email" class="form-control" name="admin_email" placeholder="admin@empresa.com"
                                required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Nombre del remitente (emails)</label>
                            <input type="text" class="form-control" name="sender_name" placeholder="Mi Empresa">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Logo de la empresa</label>
                            <input type="file" class="form-control" name="company_logo" accept=".jpg,.jpeg,.png,.svg,.webp">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Color primario</label>
                            <input type="color" class="form-control" name="color_primary" value="<?= $p ?>">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Color acento</label>
                            <input type="color" class="form-control" name="color_accent" value="<?= $a ?>">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Color fondo</label>
                            <input type="color" class="form-control" name="color_bg" value="<?= $bg ?>">
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button type="submit" name="create_tenant" value="1" class="btn-primary-custom"
                                style="width:100%;">
                                <i class="fas fa-plus"></i> Crear
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Companies list -->
            <div class="card-section">
                <h2><i class="fas fa-building"></i> Empresas Registradas (
                    <?= count($tenants) ?>)
                </h2>

                <?php if (empty($tenants)): ?>
                    <div style="text-align:center;padding:40px;color:var(--text-muted);">
                        <i class="fas fa-building" style="font-size:2.5rem;opacity:0.2;margin-bottom:12px;display:block;"></i>
                        <p>No hay empresas registradas aún.</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($tenants as $t): ?>
                        <div class="company-row">
                            <div class="company-logo">
                                <?php if (!empty($t['logo'])): ?>
                                    <img src="/<?= htmlspecialchars($t['logo']) ?>"
                                        alt="Logo de <?= htmlspecialchars($t['name']) ?>" width="56" height="56"
                                        loading="lazy" decoding="async">
                                <?php else: ?>
                                    <div class="no-logo"><i class="fas fa-building"></i></div>
                                <?php endif; ?>
                            </div>
                            <div class="company-info">
                                <h4>
                                    <?= htmlspecialchars($t['name']) ?>
                                </h4>
                                <p>
                                    <span style="color:var(--accent);">/
                                        <?= htmlspecialchars($t['slug']) ?>
                                    </span>
                                    &nbsp;·&nbsp;
                                    <?= htmlspecialchars($t['admin_email'] ?? '—') ?>
                                    &nbsp;·&nbsp; Creada:
                                    <?= htmlspecialchars(substr($t['created'] ?? '', 0, 10)) ?>
                                </p>
                            </div>
                            <span class="company-badge <?= ($t['active'] ?? true) ? 'active' : 'inactive' ?>">
                                <?= ($t['active'] ?? true) ? 'Activa' : 'Inactiva' ?>
                            </span>
                            <div class="company-actions">
                                <a href="/<?= htmlspecialchars($t['slug']) ?>" target="_blank" class="btn-sm-action"
                                    title="Ver formulario"><i class="fas fa-external-link-alt"></i></a>
                                <a href="/<?= htmlspecialchars($t['slug']) ?>/admin" target="_blank" class="btn-sm-action"
                                    title="Panel admin"><i class="fas fa-lock"></i></a>
                                <form method="POST" style="display:inline;">
                                    <input type="hidden" name="slug" value="<?= htmlspecialchars($t['slug']) ?>">
                                    <button type="submit" name="toggle_tenant" value="1" class="btn-sm-action"
                                        title="<?= ($t['active'] ?? true) ? 'Desactivar' : 'Activar' ?>">
                                        <i class="fas <?= ($t['active'] ?? true) ? 'fa-pause' : 'fa-play' ?>"></i>
                                    </button>
                                </form>
                                <form method="POST" style="display:inline;"
                                    onsubmit="return confirm('¿Eliminar esta empresa y todos sus datos?');">
                                    <input type="hidden" name="slug" value="<?= htmlspecialchars($t['slug']) ?>">
                                    <button type="submit" name="delete_tenant" value="1" class="btn-sm-action danger"
                                        title="Eliminar"><i class="fas fa-trash"></i></button>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>

            <!-- Platform info -->
            <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.8rem;">
                <p>
                    <?= PLATFORM_NAME ?> &copy;
                    <?= date('Y') ?> — Super Admin Panel
                </p>
            </div>
        </div>
    <?php endif; ?>

</body>

</html>