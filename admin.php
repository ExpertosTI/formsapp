<?php
// admin.php — Panel de Administración por Tenant (Multi-Tenant)
require_once __DIR__ . '/config.php';

$tenant = $GLOBALS['current_tenant'] ?? null;
if (!$tenant) {
    header('Location: /');
    exit;
}

$slug = $tenant['slug'];
$brandName = htmlspecialchars($tenant['name']);
$primary = htmlspecialchars($tenant['colors']['primary'] ?? '#1b2055');
$accent = htmlspecialchars($tenant['colors']['accent'] ?? '#2dd17c');
$bg = htmlspecialchars($tenant['colors']['bg'] ?? '#0f172a');

// ── Session Security ────────────────────────────────────────
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);
session_start();

// ── CSRF Token ──────────────────────────────────────────────
function generateCSRFToken()
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}
function validateCSRFToken($token)
{
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// ── Brute-force protection ──────────────────────────────────
function checkLoginAttempts($tenantDir)
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $lockFile = $tenantDir . '/login_attempts.json';
    $attempts = [];
    if (file_exists($lockFile)) {
        $attempts = json_decode(file_get_contents($lockFile), true) ?: [];
    }
    $cutoff = time() - 900;
    $attempts = array_filter($attempts, fn($a) => $a['time'] > $cutoff);
    file_put_contents($lockFile, json_encode($attempts));
    $ipAttempts = array_filter($attempts, fn($a) => $a['ip'] === $ip);
    return count($ipAttempts) < 5;
}
function recordLoginAttempt($tenantDir)
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $lockFile = $tenantDir . '/login_attempts.json';
    $attempts = [];
    if (file_exists($lockFile)) {
        $attempts = json_decode(file_get_contents($lockFile), true) ?: [];
    }
    $attempts[] = ['ip' => $ip, 'time' => time()];
    file_put_contents($lockFile, json_encode($attempts));
}

// ── Authentication ──────────────────────────────────────────
$sessionKey = 'admin_auth_' . $slug;
$isAuth = isset($_SESSION[$sessionKey]) && $_SESSION[$sessionKey] === true;
$loginError = false;
$loginLocked = false;

if (isset($_POST['admin_login'])) {
    if (!checkLoginAttempts($tenant['dir'])) {
        $loginLocked = true;
    } elseif (isset($_POST['password']) && verifyTenantPassword($tenant, $_POST['password'])) {
        migrateTenantPasswordToHashIfLegacy($slug, (string) $_POST['password']);
        session_regenerate_id(true);
        $_SESSION[$sessionKey] = true;
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $isAuth = true;
    } else {
        recordLoginAttempt($tenant['dir']);
        $loginError = true;
    }
}

if (isset($_GET['logout'])) {
    unset($_SESSION[$sessionKey]);
    header('Location: /' . $slug . '/admin');
    exit;
}

// ── API: Update status ──────────────────────────────────────
if ($isAuth && isset($_POST['update_status'])) {
    header('Content-Type: application/json');
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }
    $id = $_POST['id'] ?? '';
    $newStatus = $_POST['status'] ?? '';
    $allowed = ['nuevo', 'revisado', 'contactado', 'rechazado'];

    if ($id && in_array($newStatus, $allowed)) {
        $db = getDB();
        if ($db) {
            try {
                $stmt = $db->prepare("UPDATE submissions SET estado = ? WHERE id = ? AND tenant_slug = ?");
                $stmt->execute([$newStatus, $id, $slug]);
                echo json_encode(['success' => true]);
                exit;
            } catch (PDOException $e) {
                error_log("DB Status Update Error: " . $e->getMessage());
            }
        }

        // Fallback to JSON if DB fails or it's an old record
        if (file_exists($tenant['submissions_file'])) {
            $submissions = json_decode(file_get_contents($tenant['submissions_file']), true) ?: [];
            $updated = false;
            foreach ($submissions as &$s) {
                if ($s['id'] == $id) {
                    $s['estado'] = $newStatus;
                    $updated = true;
                    break;
                }
            }
            unset($s);
            if ($updated) {
                file_put_contents($tenant['submissions_file'], json_encode($submissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                echo json_encode(['success' => true]);
                exit;
            }
        }
    }
    echo json_encode(['success' => false]);
    exit;
}

// ── API: Delete submission ──────────────────────────────────
if ($isAuth && isset($_POST['delete_submission'])) {
    header('Content-Type: application/json');
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }
    $id = $_POST['id'] ?? '';
    if ($id) {
        $db = getDB();
        if ($db) {
            try {
                $stmt = $db->prepare("DELETE FROM submissions WHERE id = ? AND tenant_slug = ?");
                $stmt->execute([$id, $slug]);
                echo json_encode(['success' => true]);
                exit;
            } catch (PDOException $e) {
                error_log("DB Delete Error: " . $e->getMessage());
            }
        }

        // Fallback or delete from local JSON if exists
        if (file_exists($tenant['submissions_file'])) {
            $submissions = json_decode(file_get_contents($tenant['submissions_file']), true) ?: [];
            $initialCount = count($submissions);
            $submissions = array_values(array_filter($submissions, fn($s) => $s['id'] != $id));
            if (count($submissions) !== $initialCount) {
                file_put_contents($tenant['submissions_file'], json_encode($submissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                echo json_encode(['success' => true]);
                exit;
            }
        }
    }
    echo json_encode(['success' => false]);
    exit;
}

// ── Secure File Proxy ───────────────────────────────────────
if ($isAuth && isset($_GET['download'])) {
    $fileRequested = basename($_GET['download']); // Evitar directory traversal
    $filePath = $tenant['uploads_dir'] . '/' . $fileRequested;

    if (file_exists($filePath) && is_file($filePath)) {
        $mime = mime_content_type($filePath);
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($filePath));

        // Inline view for PDFs and Images instead of force direct download
        if (strpos($mime, 'image') !== false || $mime === 'application/pdf') {
            header('Content-Disposition: inline; filename="' . $fileRequested . '"');
        } else {
            header('Content-Disposition: attachment; filename="' . $fileRequested . '"');
        }

        readfile($filePath);
        exit;
    } else {
        header("HTTP/1.0 404 Not Found");
        echo "Archivo no encontrado.";
        exit;
    }
}

// ── API: Real-Time Sync ─────────────────────────────────────
if ($isAuth && isset($_GET['api_sync'])) {
    header('Content-Type: application/json');
    $db = getDB();
    if ($db) {
        try {
            $stmt = $db->prepare("SELECT COUNT(id) FROM submissions WHERE tenant_slug = ?");
            $stmt->execute([$slug]);
            $count = $stmt->fetchColumn();
            echo json_encode(['success' => true, 'total' => (int) $count]);
            exit;
        } catch (PDOException $e) {
            // fail silent
        }
    }
    echo json_encode(['success' => false]);
    exit;
}

// ── API: Update Settings ────────────────────────────────────
if ($isAuth && isset($_POST['update_settings'])) {
    header('Content-Type: application/json');
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    // Default all to false, then override with true if present in POST
    $sectionsConfig = [
        'documentos' => false,
        'datos_familiares' => false,
        'preparacion_academica' => false,
        'experiencia_laboral' => false,
        'informacion_general' => false
    ];

    foreach ($sectionsConfig as $key => $val) {
        if (isset($_POST[$key]) && $_POST[$key] === '1') {
            $sectionsConfig[$key] = true;
        }
    }

    // Cargar config actual y actualizar 'sections'
    $configFile = $tenant['dir'] . '/tenant.json';
    if (file_exists($configFile)) {
        $configData = json_decode(file_get_contents($configFile), true) ?: [];
        $configData['sections'] = $sectionsConfig;

        $notificationEmails = trim($_POST['notification_emails'] ?? '');
        if ($notificationEmails !== '') {
            $configData['notification_emails'] = $notificationEmails;
        } else {
            unset($configData['notification_emails']);
        }

        file_put_contents($configFile, json_encode($configData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Config file not found']);
    }
    exit;
}

// ── Load data ───────────────────────────────────────────────
$submissions = [];
if ($isAuth) {
    // 1. Cargar desde la Base de Datos
    $db = getDB();
    if ($db) {
        try {
            $stmt = $db->prepare("SELECT id, datos, archivos, estado, fecha FROM submissions WHERE tenant_slug = ? ORDER BY fecha DESC");
            $stmt->execute([$slug]);
            while ($row = $stmt->fetch()) {
                // Postgres devuelve JSONB como string, lo parseamos
                $row['datos'] = json_decode($row['datos'], true) ?: [];
                $row['archivos'] = json_decode($row['archivos'], true) ?: [];
                $submissions[] = $row;
            }
        } catch (PDOException $e) {
            error_log("DB Select Error: " . $e->getMessage());
        }
    }

    // 2. Cargar legado de JSON (Local) para no perder solicitudes previas
    if (file_exists($tenant['submissions_file'])) {
        $localSubs = json_decode(file_get_contents($tenant['submissions_file']), true) ?: [];
        $localSubs = array_reverse($localSubs);

        // Unir evitando duplicados por ID
        $existingIds = array_column($submissions, 'id');
        foreach ($localSubs as $ls) {
            if (!in_array($ls['id'], $existingIds)) {
                $submissions[] = $ls;
            }
        }

        // Re-ordenar por fecha descendente
        usort($submissions, function ($a, $b) {
            return strtotime($b['fecha']) - strtotime($a['fecha']);
        });
    }
}

$totalCount = count($submissions);
$todayCount = 0;
$weekCount = 0;
$today = date('Y-m-d');
$weekAgo = date('Y-m-d', strtotime('-7 days'));
$statusCounts = ['nuevo' => 0, 'revisado' => 0, 'contactado' => 0, 'rechazado' => 0];

foreach ($submissions as $s) {
    $d = substr($s['fecha'] ?? '', 0, 10);
    if ($d === $today)
        $todayCount++;
    if ($d >= $weekAgo)
        $weekCount++;
    $estado = $s['estado'] ?? 'nuevo';
    if (isset($statusCounts[$estado]))
        $statusCounts[$estado]++;
}

$tenantSections = $tenant['sections'] ?? [
    'documentos' => true,
    'datos_familiares' => true,
    'preparacion_academica' => true,
    'experiencia_laboral' => true,
    'informacion_general' => true
];

$notifEmails = htmlspecialchars($tenant['notification_emails'] ?? $tenant['admin_email'] ?? '');
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin — <?= $brandName ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <style>
        :root {
            --primary:
                <?= $primary ?>
            ;
            --primary-dark:
                <?= adjustColor($primary, -30) ?>
            ;
            --accent:
                <?= $accent ?>
            ;
            --bg:
                <?= $bg ?>
            ;
            --bg2: #1e293b;
            --bg-card: rgba(30, 41, 59, 0.7);
            --border: rgba(255, 255, 255, 0.08);
            --text: #e2e8f0;
            --text-muted: #94a3b8;
            --text-bright: #f8fafc;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info:
                <?= $accent ?>
            ;
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
                radial-gradient(circle at 20% 20%,
                    <?= hexToRgba($primary, 0.1) ?>
                    0%, transparent 40%),
                radial-gradient(circle at 80% 80%,
                    <?= hexToRgba($accent, 0.07) ?>
                    0%, transparent 40%);
            z-index: 0;
            animation: bgPulse 15s ease-in-out infinite;
        }

        @keyframes bgPulse {

            0%,
            100% {
                opacity: 1;
            }

            50% {
                opacity: 0.7;
            }
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

        .login-logo-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 8px;
        }

        .tenant-logo-mark {
            margin: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            max-width: 240px;
            min-height: 56px;
            max-height: 80px;
            padding: 14px 22px;
            border-radius: 16px;
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
            border: 1px solid rgba(255, 255, 255, 0.55);
            box-shadow:
                0 8px 28px rgba(0, 0, 0, 0.14),
                0 0 0 1px rgba(0, 0, 0, 0.04);
        }

        .tenant-logo-mark img {
            max-width: 100%;
            max-height: 56px;
            width: auto;
            height: auto;
            object-fit: contain;
            object-position: center;
        }

        .tenant-logo-mark--compact {
            max-width: 200px;
            max-height: 56px;
            min-height: 44px;
            padding: 8px 14px;
            border-radius: 14px;
        }

        .tenant-logo-mark--compact img {
            max-height: 44px;
        }

        .top-bar-brand {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
            min-width: 0;
        }

        .brand-title-wrap .brand-sub {
            display: block;
            font-size: 0.78rem;
            color: var(--text-muted);
            font-weight: 500;
            margin-top: 2px;
        }

        .top-bar-brand h1 {
            font-size: 1.45rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
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
            box-shadow: 0 0 0 3px
                <?= hexToRgba($accent, 0.15) ?>
            ;
            color: white;
        }

        .login-card .btn-login {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: white;
            border: none;
            padding: 12px;
            width: 100%;
            border-radius: 10px;
            font-weight: 600;
            margin-top: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .login-card .btn-login:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px
                <?= hexToRgba($accent, 0.3) ?>
            ;
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

        .top-bar-brand h1 {
            font-size: 1.35rem;
        }

        .top-bar .actions {
            display: flex;
            gap: 10px;
            align-items: center;
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

        /* ── KPI Cards ──────────────────────── */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }

        .kpi-card {
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.4s;
            position: relative;
            overflow: hidden;
        }

        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--accent));
            opacity: 0;
            transition: opacity 0.3s;
        }

        .kpi-card:hover {
            border-color:
                <?= hexToRgba($accent, 0.25) ?>
            ;
            transform: translateY(-4px);
            box-shadow: 0 12px 40px
                <?= hexToRgba($accent, 0.08) ?>
            ;
        }

        .kpi-card:hover::before {
            opacity: 1;
        }

        .kpi-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            margin-bottom: 16px;
        }

        .kpi-value {
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--text-bright);
            line-height: 1;
            margin-bottom: 6px;
        }

        .kpi-label {
            font-size: 0.82rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        .kpi-icon.blue {
            background:
                <?= hexToRgba($accent, 0.15) ?>
            ;
            color: var(--accent);
        }

        .kpi-icon.green {
            background: rgba(16, 185, 129, 0.15);
            color: var(--success);
        }

        .kpi-icon.yellow {
            background: rgba(245, 158, 11, 0.15);
            color: var(--warning);
        }

        .kpi-icon.purple {
            background: rgba(139, 92, 246, 0.15);
            color: #8b5cf6;
        }

        /* ── Table ──────────────────────────── */
        .table-wrapper {
            background: var(--bg-card);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
        }

        .table-toolbar {
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            flex-wrap: wrap;
            gap: 12px;
        }

        .table-toolbar h2 {
            margin: 0;
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--text-bright);
        }

        .search-box {
            position: relative;
        }

        .search-box input {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 8px 12px 8px 36px;
            color: var(--text-bright);
            font-size: 0.85rem;
            width: 260px;
            transition: all 0.3s;
        }

        .search-box input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px
                <?= hexToRgba($accent, 0.1) ?>
            ;
            outline: none;
        }

        .search-box i {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 0.8rem;
        }

        .filter-btns {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .filter-btn {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.78rem;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }

        .filter-btn:hover,
        .filter-btn.active {
            background:
                <?= hexToRgba($accent, 0.15) ?>
            ;
            border-color:
                <?= hexToRgba($accent, 0.3) ?>
            ;
            color: var(--accent);
        }

        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            padding: 14px 20px;
            text-align: left;
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            font-weight: 600;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--border);
            white-space: nowrap;
        }

        td {
            padding: 16px 20px;
            font-size: 0.88rem;
            border-bottom: 1px solid var(--border);
            white-space: nowrap;
        }

        /* Fix clipping for Solicitante name grouping */
        td.solicitante-col {
            min-width: 280px;
            white-space: normal;
        }

        tr:hover td {
            background:
                <?= hexToRgba($accent, 0.03) ?>
            ;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .applicant-name {
            font-weight: 600;
            color: var(--text-bright);
        }

        .applicant-email {
            font-size: 0.8rem;
            color: var(--text-muted);
        }

        .badge-status {
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: capitalize;
            cursor: pointer;
            transition: all 0.3s;
        }

        .badge-nuevo {
            background:
                <?= hexToRgba($accent, 0.15) ?>
            ;
            color: #7dd3fc;
            box-shadow: 0 0 12px
                <?= hexToRgba($accent, 0.1) ?>
            ;
        }

        .badge-revisado {
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
        }

        .badge-contactado {
            background: rgba(16, 185, 129, 0.15);
            color: #6ee7b7;
        }

        .badge-rechazado {
            background: rgba(239, 68, 68, 0.15);
            color: #fca5a5;
        }

        .btn-delete {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 6px 8px;
            border-radius: 8px;
            transition: all 0.3s;
        }

        .btn-delete:hover {
            color: var(--danger);
            background: rgba(239, 68, 68, 0.12);
            transform: scale(1.1);
        }

        /* ── Modal ──────────────────────────── */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal-card {
            background: var(--bg2);
            border: 1px solid var(--border);
            border-radius: 16px;
            width: 100%;
            max-width: 700px;
            max-height: 85vh;
            overflow-y: auto;
            animation: modalIn 0.3s ease;
        }

        @keyframes modalIn {
            from {
                transform: scale(0.95);
                opacity: 0;
            }

            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        .modal-header-custom {
            padding: 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            background: var(--bg2);
            z-index: 2;
        }

        .modal-header-custom h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-bright);
        }

        .modal-close {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 1.2rem;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .modal-close:hover {
            color: white;
            background: rgba(255, 255, 255, 0.1);
        }

        .modal-body {
            padding: 24px;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .detail-item {
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            border: 1px solid var(--border);
        }

        .detail-item.full {
            grid-column: 1 / -1;
        }

        .detail-item .label {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
            font-weight: 600;
        }

        .detail-item .value {
            font-size: 0.9rem;
            color: var(--text-bright);
            font-weight: 500;
            word-wrap: break-word;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-muted);
        }

        .empty-state i {
            font-size: 3rem;
            margin-bottom: 16px;
            opacity: 0.3;
        }

        .empty-state p {
            font-size: 0.95rem;
        }

        /* ── Attachments ────────────────────── */
        .attachment-card {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 16px;
        }

        .attachment-icon {
            font-size: 2rem;
            color: var(--accent);
        }

        .attachment-info {
            flex-grow: 1;
        }

        .attachment-info h4 {
            margin: 0 0 4px 0;
            color: var(--text-bright);
            font-size: 0.95rem;
        }

        .btn-download {
            background: var(--primary);
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.2s;
        }

        .btn-download:hover {
            background: var(--accent);
            color: #1e293b;
        }

        .applicant-photo {
            width: 100%;
            max-width: 250px;
            height: auto;
            border-radius: 12px;
            border: 2px solid var(--border);
            margin-top: 12px;
            display: block;
        }

        /* ── Settings Controls ──────────────── */
        .settings-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .setting-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            padding: 16px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .setting-item:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color:
                <?= hexToRgba($accent, 0.2) ?>
            ;
        }

        .setting-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .setting-title {
            color: var(--text-bright);
            font-weight: 600;
            font-size: 0.95rem;
        }

        .setting-title i {
            width: 20px;
            color: var(--accent);
            opacity: 0.8;
            margin-right: 4px;
        }

        .setting-desc {
            color: var(--text-muted);
            font-size: 0.8rem;
        }

        .switch {
            position: relative;
            display: inline-block;
            width: 46px;
            height: 26px;
        }

        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.1);
            transition: .4s;
            border: 1px solid var(--border);
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: #94a3b8;
            transition: .4s;
        }

        input:checked+.slider {
            background-color: var(--accent);
            border-color: var(--accent);
        }

        input:focus+.slider {
            box-shadow: 0 0 1px var(--accent);
        }

        input:checked+.slider:before {
            transform: translateX(20px);
            background-color: var(--bg);
        }

        .slider.round {
            border-radius: 34px;
        }

        .slider.round:before {
            border-radius: 50%;
        }

        /* ── Toast ──────────────────────────── */
        .admin-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: rgba(16, 185, 129, 0.9);
            backdrop-filter: blur(10px);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            font-size: 0.88rem;
            font-weight: 500;
            z-index: 9999;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.4s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .admin-toast.show {
            transform: translateY(0);
            opacity: 1;
        }

        /* ── Responsive ─────────────────────── */
        @media (max-width: 768px) {
            .dashboard {
                padding: 14px;
            }

            .kpi-grid {
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            .kpi-card {
                padding: 16px;
            }

            .kpi-value {
                font-size: 1.6rem;
            }

            .kpi-icon {
                width: 36px;
                height: 36px;
                font-size: 1rem;
                margin-bottom: 12px;
            }

            .detail-grid {
                grid-template-columns: 1fr;
            }

            .search-box input {
                width: 100%;
            }

            .table-toolbar {
                flex-direction: column;
                align-items: stretch;
            }

            .top-bar h1,
            .top-bar-brand h1 {
                font-size: 1.3rem;
            }
        }

        @media (max-width: 480px) {
            .kpi-grid {
                grid-template-columns: 1fr;
            }

            .kpi-value {
                font-size: 1.8rem;
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
            <!-- Login -->
            <div class="login-wrapper">
                <div class="login-card">
                    <div class="login-logo-wrap">
                        <?php if (!empty($tenant['logo'])): ?>
                                <figure class="tenant-logo-mark" aria-label="Logo de <?= $brandName ?>">
                                    <img src="/<?= htmlspecialchars($tenant['logo']) ?>" alt="Logo de <?= $brandName ?>"
                                        width="200" height="64" loading="lazy" decoding="async">
                                </figure>
                        <?php endif; ?>
                    </div>
                    <h1><i class="fas fa-shield-halved" style="color:var(--accent);margin-right:8px;"></i> Panel Admin</h1>
                    <p><?= $brandName ?></p>
                    <form method="POST">
                        <input type="password" name="password" class="form-control" placeholder="Contraseña de administrador"
                            autofocus required>
                        <button type="submit" name="admin_login" value="1" class="btn-login">Ingresar</button>
                    </form>
                    <?php if ($loginLocked): ?>
                            <div class="login-error"><i class="fas fa-lock"></i> Demasiados intentos. Espera 15 minutos.</div>
                    <?php elseif ($loginError): ?>
                            <div class="login-error"><i class="fas fa-exclamation-triangle"></i> Contraseña incorrecta</div>
                    <?php endif; ?>
                    <div style="margin-top:24px;"><a href="/<?= $slug ?>"
                            style="color:var(--text-muted);font-size:0.82rem;text-decoration:none;"><i
                                class="fas fa-arrow-left"></i> Volver al formulario</a></div>
                </div>
            </div>

    <?php else: ?>
            <!-- Dashboard -->
            <div class="dashboard">
                <div class="top-bar">
                    <div class="top-bar-brand">
                        <?php if (!empty($tenant['logo'])): ?>
                                <figure class="tenant-logo-mark tenant-logo-mark--compact" aria-label="Logo de <?= $brandName ?>">
                                    <img src="/<?= htmlspecialchars($tenant['logo']) ?>" alt="Logo de <?= $brandName ?>"
                                        width="160" height="48" loading="lazy" decoding="async">
                                </figure>
                        <?php endif; ?>
                        <div class="brand-title-wrap">
                            <h1><?php if (empty($tenant['logo'])): ?><i class="fas fa-chart-bar"></i> <?php endif; ?><?= $brandName ?></h1>
                            <span class="brand-sub">Panel de administración</span>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="btn-ghost" onclick="openSettingsModal()"><i class="fas fa-cog"></i>
                            Configuración</button>
                        <a href="/<?= $slug ?>" class="btn-ghost" target="_blank"><i class="fas fa-external-link-alt"></i> Ver
                            formulario</a>
                        <a href="/" class="btn-ghost"><i class="fas fa-home"></i> Inicio</a>
                        <a href="/<?= $slug ?>/admin?logout" class="btn-ghost"><i class="fas fa-sign-out-alt"></i> Salir</a>
                    </div>
                </div>

                <!-- KPIs -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-icon blue"><i class="fas fa-users"></i></div>
                        <div class="kpi-value"><?= $totalCount ?></div>
                        <div class="kpi-label">Total solicitudes</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon green"><i class="fas fa-calendar-day"></i></div>
                        <div class="kpi-value"><?= $todayCount ?></div>
                        <div class="kpi-label">Hoy</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon yellow"><i class="fas fa-calendar-week"></i></div>
                        <div class="kpi-value"><?= $weekCount ?></div>
                        <div class="kpi-label">Esta semana</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon purple"><i class="fas fa-star"></i></div>
                        <div class="kpi-value"><?= $statusCounts['nuevo'] ?></div>
                        <div class="kpi-label">Nuevas</div>
                    </div>
                </div>

                <!-- Table -->
                <div class="table-wrapper">
                    <div class="table-toolbar">
                        <div>
                            <h2><i class="fas fa-inbox" style="margin-right:8px;opacity:0.5;"></i> Solicitudes</h2>
                            <div class="filter-btns" style="margin-top:12px;">
                                <button class="filter-btn active" onclick="filterTable('all', this)">Todas</button>
                                <button class="filter-btn" onclick="filterTable('nuevo', this)">Nuevas
                                    (<?= $statusCounts['nuevo'] ?>)</button>
                                <button class="filter-btn" onclick="filterTable('revisado', this)">Revisadas
                                    (<?= $statusCounts['revisado'] ?>)</button>
                                <button class="filter-btn" onclick="filterTable('contactado', this)">Contactadas
                                    (<?= $statusCounts['contactado'] ?>)</button>
                                <button class="filter-btn" onclick="filterTable('rechazado', this)">Rechazadas
                                    (<?= $statusCounts['rechazado'] ?>)</button>
                            </div>
                        </div>
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Buscar solicitante..." id="searchInput" oninput="searchTable()">
                        </div>
                    </div>

                    <?php if (empty($submissions)): ?>
                            <div class="empty-state">
                                <i class="fas fa-inbox"></i>
                                <p>Aún no hay solicitudes recibidas</p>
                            </div>
                    <?php else: ?>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Postulante</th>
                                            <th>Fecha de Solicitud</th>
                                            <th>Estado</th>
                                            <th style="text-align: right;">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="submissionsTable">
                                        <?php foreach ($submissions as $s):
                                            $d = $s['datos'] ?? [];
                                            $nombreCompleto = trim(($d['nombre'] ?? 'Sin nombre') . ' ' . ($d['apellido'] ?? ''));
                                            $estado = $s['estado'] ?? 'nuevo';
                                            $archivos = $s['archivos'] ?? [];
                                            $tieneDocs = !empty($archivos);
                                            $correo = $d['correo'] ?? '';
                                            $statusIcons = ['nuevo' => 'fa-sparkles', 'revisado' => 'fa-eye', 'contactado' => 'fa-phone', 'rechazado' => 'fa-times'];
                                            ?>
                                                <tr data-status="<?= htmlspecialchars($estado) ?>"
                                                    data-search="<?= strtolower(htmlspecialchars($nombreCompleto . ' ' . ($d['oficio_profesion'] ?? '') . ' ' . $correo)) ?>">

                                                    <!-- Columna Principal de Postulante -->
                                                    <td class="solicitante-col"
                                                        onclick='showDetail(<?= htmlspecialchars(json_encode($s, JSON_HEX_APOS | JSON_HEX_QUOT), ENT_QUOTES) ?>)'
                                                        style="cursor:pointer">
                                                        <div style="display:flex; align-items:center; gap:16px;">
                                                            <div class="kpi-icon blue"
                                                                style="margin:0; width:44px; height:44px; border-radius:12px; font-size:1.1rem; flex-shrink:0;">
                                                                <?= strtoupper(substr($nombreCompleto, 0, 1)) ?>
                                                            </div>
                                                            <div>
                                                                <div class="applicant-name"
                                                                    style="font-size: 1.05rem; display:flex; align-items:center; gap:8px;">
                                                                    <?= htmlspecialchars($nombreCompleto) ?>
                                                                    <?php if ($tieneDocs): ?>
                                                                            <span
                                                                                style="background:var(--accent); color:#1e293b; font-size:0.65rem; padding:2px 6px; border-radius:4px; font-weight:700;"><i
                                                                                    class="fas fa-paperclip"
                                                                                    style="margin-right:3px;"></i>ADJUNTOS</span>
                                                                    <?php endif; ?>
                                                                </div>
                                                                <div class="applicant-email"
                                                                    style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:6px;">
                                                                    <span><i class="fas fa-envelope"
                                                                            style="opacity:0.6; margin-right:4px;"></i><?= htmlspecialchars($correo) ?></span>
                                                                    <?php if (!empty($d['oficio_profesion'])): ?>
                                                                            <span style="color:var(--border);">|</span>
                                                                            <span style="color:var(--text-bright); font-weight:500;"><i
                                                                                    class="fas fa-briefcase"
                                                                                    style="color:var(--accent); opacity:0.8; margin-right:4px;"></i><?= htmlspecialchars($d['oficio_profesion']) ?></span>
                                                                    <?php endif; ?>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <!-- Fecha -->
                                                    <td onclick='showDetail(<?= htmlspecialchars(json_encode($s, JSON_HEX_APOS | JSON_HEX_QUOT), ENT_QUOTES) ?>)'
                                                        style="cursor:pointer; color:var(--text-muted); font-size:0.9rem;">
                                                        <i class="far fa-calendar-alt"
                                                            style="margin-right:6px;"></i><?= date('d/m/Y', strtotime($s['fecha'] ?? 'now')) ?>
                                                    </td>

                                                    <!-- Estado -->
                                                    <td>
                                                        <span class="badge-status badge-<?= $estado ?>"
                                                            onclick="cycleStatus('<?= $s['id'] ?>', '<?= $estado ?>', this)">
                                                            <i class="fas <?= $statusIcons[$estado] ?? 'fa-circle' ?>"
                                                                style="margin-right:4px;"></i><?= $estado ?>
                                                        </span>
                                                    </td>

                                                    <!-- Acciones -->
                                                    <td style="text-align: right;">
                                                        <div style="display:flex; justify-content:flex-end; gap:8px;">
                                                            <button class="btn-ghost"
                                                                onclick='showDetail(<?= htmlspecialchars(json_encode($s, JSON_HEX_APOS | JSON_HEX_QUOT), ENT_QUOTES) ?>)'
                                                                style="padding: 8px 16px; background:rgba(255,255,255,0.03); color:var(--accent); font-weight:600; border:1px solid rgba(255,255,255,0.05);">
                                                                Ver Detalle <i class="fas fa-chevron-right"
                                                                    style="margin-left:6px; font-size:0.8rem;"></i>
                                                            </button>
                                                            <button class="btn-delete" title="Eliminar"
                                                                onclick="deleteSubmission('<?= $s['id'] ?>', this)"
                                                                style="padding:8px 12px; background:rgba(239, 68, 68, 0.05);">
                                                                <i class="fas fa-trash-alt"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Detail Modal -->
            <div class="modal-overlay" id="detailModal">
                <div class="modal-card">
                    <div class="modal-header-custom">
                        <h3><i class="fas fa-user" style="margin-right:8px;color:var(--accent);"></i> Detalle de Solicitud</h3>
                        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body" id="detailContent"></div>
                </div>
            </div>

            <!-- Settings Modal -->
            <div class="modal-overlay" id="settingsModal">
                <div class="modal-card" style="max-width: 500px;">
                    <div class="modal-header-custom">
                        <h3><i class="fas fa-cog" style="margin-right:8px;color:var(--accent);"></i> Configuración del
                            Formulario</h3>
                        <button class="modal-close" onclick="closeSettingsModal()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="settingsForm" onsubmit="saveSettings(event)">
                            <input type="hidden" name="update_settings" value="1">
                            <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">

                            <div class="settings-list">
                                <label class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-title"><i class="fas fa-file-upload"></i> Documentos</span>
                                        <span class="setting-desc">Fotos y Currículum Vitae (PDF/DOC)</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" name="documentos" value="1" <?= ($tenantSections['documentos'] ?? true) ? 'checked' : '' ?>>
                                        <span class="slider round"></span>
                                    </label>
                                </label>

                                <label class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-title"><i class="fas fa-users"></i> Datos Familiares</span>
                                        <span class="setting-desc">Información sobre familiares directos</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" name="datos_familiares" value="1"
                                            <?= ($tenantSections['datos_familiares'] ?? true) ? 'checked' : '' ?>>
                                        <span class="slider round"></span>
                                    </label>
                                </label>

                                <label class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-title"><i class="fas fa-graduation-cap"></i> Preparación
                                            Académica</span>
                                        <span class="setting-desc">Grados de estudio, diplomados y más</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" name="preparacion_academica" value="1"
                                            <?= ($tenantSections['preparacion_academica'] ?? true) ? 'checked' : '' ?>>
                                        <span class="slider round"></span>
                                    </label>
                                </label>

                                <label class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-title"><i class="fas fa-briefcase"></i> Experiencia Laboral</span>
                                        <span class="setting-desc">Historial de trabajos anteriores</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" name="experiencia_laboral" value="1"
                                            <?= ($tenantSections['experiencia_laboral'] ?? true) ? 'checked' : '' ?>>
                                        <span class="slider round"></span>
                                    </label>
                                </label>

                                <label class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-title"><i class="fas fa-info-circle"></i> Información
                                            General</span>
                                        <span class="setting-desc">Datos de vehículo, licencia, salud, etc.</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" name="informacion_general" value="1"
                                            <?= ($tenantSections['informacion_general'] ?? true) ? 'checked' : '' ?>>
                                        <span class="slider round"></span>
                                    </label>
                                </label>

                                <div class="setting-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
                                    <div class="setting-info">
                                        <span class="setting-title" style="margin-bottom:4px;"><i class="fas fa-envelope"></i>
                                            Correos de notificación</span>
                                        <span class="setting-desc">Múltiples correos separados por coma. Si se deja en blanco,
                                            no se enviarán alertas de nuevas solicitudes.</span>
                                    </div>
                                    <input type="text" name="notification_emails" class="form-control"
                                        style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border); color: var(--text-bright); border-radius: 8px; padding: 10px 14px;"
                                        value="<?= $notifEmails ?>" placeholder="ejemplo@correo.com, otro@correo.com">
                                </div>
                            </div>

                            <div style="margin-top: 24px; text-align: right;">
                                <button type="submit" class="btn-ghost"
                                    style="background:var(--accent); color:var(--bg); font-weight:600; padding:10px 20px;">Guardar
                                    Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Toast -->
            <div class="admin-toast" id="adminToast"><i class="fas fa-check-circle"></i> <span id="toastMsg"></span></div>

            <script>
                const CSRF = '<?= generateCSRFToken() ?>';
                const SLUG = '<?= $slug ?>';
                let currentSubmissionsCount = <?= $totalCount ?? 0 ?>;

                function showToast(msg, isReloadAction = false) {
                    const t = document.getElementById('adminToast');
                    document.getElementById('toastMsg').innerHTML = msg;
                    if (isReloadAction) {
                        t.style.cursor = 'pointer';
                        t.onclick = () => location.reload();
                        t.classList.add('show');
                        // Doesn't hide automatically so user can click it
                    } else {
                        t.style.cursor = 'default';
                        t.onclick = null;
                        t.classList.add('show');
                        setTimeout(() => t.classList.remove('show'), 3000);
                    }
                }

                // Real-Time Polling
                setInterval(() => {
                    fetch(`/${SLUG}/admin?api_sync=1`)
                        .then(r => r.json())
                        .then(d => {
                            if (d.success && d.total > currentSubmissionsCount) {
                                const diff = d.total - currentSubmissionsCount;
                                showToast(`¡Hay ${diff} nueva(s) solicitud(es)! <u style="margin-left:8px;">Haz clic para recargar</u>`, true);
                            }
                        })
                        .catch(() => {}); // silent fail
                }, 15000);

                function cycleStatus(id, current, el) {
                    const order = ['nuevo', 'revisado', 'contactado', 'rechazado'];
                    const next = order[(order.indexOf(current) + 1) % order.length];
                    const fd = new FormData();
                    fd.append('update_status', '1');
                    fd.append('id', id);
                    fd.append('status', next);
                    fd.append('csrf_token', CSRF);
                    fetch('/' + SLUG + '/admin', { method: 'POST', body: fd })
                        .then(r => r.json())
                        .then(d => {
                            if (d.success) {
                                el.className = 'badge-status badge-' + next;
                                const icons = { nuevo: 'fa-sparkles', revisado: 'fa-eye', contactado: 'fa-phone', rechazado: 'fa-times' };
                                el.innerHTML = '<i class="fas ' + (icons[next] || 'fa-circle') + '" style="margin-right:4px;"></i>' + next;
                                el.setAttribute('onclick', `cycleStatus('${id}', '${next}', this)`);
                                el.closest('tr').setAttribute('data-status', next);
                                showToast('Estado → ' + next);
                            }
                        });
                }

                function deleteSubmission(id, el) {
                    if (!confirm('¿Eliminar esta solicitud?')) return;
                    const fd = new FormData();
                    fd.append('delete_submission', '1');
                    fd.append('id', id);
                    fd.append('csrf_token', CSRF);
                    fetch('/' + SLUG + '/admin', { method: 'POST', body: fd })
                        .then(r => r.json())
                        .then(d => {
                            if (d.success) {
                                const row = el.closest('tr');
                                row.style.opacity = '0'; row.style.transform = 'translateX(50px)';
                                setTimeout(() => row.remove(), 300);
                                showToast('Solicitud eliminada');
                            }
                        });
                }

                function filterTable(status, btn) {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.querySelectorAll('#submissionsTable tr').forEach(row => {
                        row.style.display = (status === 'all' || row.dataset.status === status) ? '' : 'none';
                    });
                }

                function searchTable() {
                    const q = document.getElementById('searchInput').value.toLowerCase();
                    document.querySelectorAll('#submissionsTable tr').forEach(row => {
                        row.style.display = row.dataset.search.includes(q) ? '' : 'none';
                    });
                }

                function showDetail(sub) {
                    const d = sub.datos || {};
                    const fields = [
                        ['Nombre', d.nombre], ['Apellido', d.apellido], ['Cédula', d.cedula],
                        ['Fecha Nacimiento', d.fecha_nacimiento], ['Lugar Nacimiento', d.lugar_nacimiento],
                        ['Nacionalidad', d.nacionalidad], ['Sexo', d.sexo], ['Estado Civil', d.estado_civil],
                        ['Dirección', d.direccion, true], ['Tel. Casa', d.tel_casa], ['Celular', d.celular],
                        ['Correo', d.correo], ['Oficio/Profesión', d.oficio_profesion], ['Sueldo Aspirado', d.sueldo_aspirado],
                        ['Primaria', d.primaria], ['Secundaria', d.secundaria], ['Universitaria', d.universitaria],
                        ['Diplomado', d.diplomado], ['Especialidad', d.especialidad], ['Maestría', d.maestria],
                        ['Doctorado', d.doctorado], ['Experiencia', d.experiencia, true],
                        ['Estudia actualmente', d.estudia_actualmente], ['Trabaja actualmente', d.trabajando_actualmente],
                        ['Razón dejar empleo', d.razon_dejar_empleo], ['Disponibilidad', d.tiempo_disponible],
                        ['Familiar en empresa', d.familiar_empresa], ['Recomendado por', d.recomendado],
                        ['Licencia', d.licencia_conducir], ['Vehículo', d.vehiculo],
                        ['Enfermedad', d.enfermedad], ['Cuál enfermedad', d.cual_enfermedad],
                        ['Religión', d.religion], ['Deporte', d.practica_deporte], ['Cuál deporte', d.cual_deporte],
                        ['Familiares', d.familiares, true]
                    ];
                    let html = '<div class="detail-grid">';
                    html += `<div class="detail-item"><div class="label">ID</div><div class="value">${sub.id}</div></div>`;
                    html += `<div class="detail-item"><div class="label">Fecha</div><div class="value">${sub.fecha}</div></div>`;
                    fields.forEach(([label, val, full]) => {
                        if (val) html += `<div class="detail-item ${full ? 'full' : ''}"><div class="label">${label}</div><div class="value">${val}</div></div>`;
                    });
                    html += '</div>';

                    // Mostrar Archivos si existen
                    const arch = sub.archivos || {};
                    if (arch.foto || arch.curriculum) {
                        html += `<h4 style="margin:24px 0 12px 0; color:var(--text-bright); border-bottom:1px solid var(--border); padding-bottom:8px;">Documentos Adjuntos</h4>`;

                        if (arch.foto) {
                            html += `
                        <div class="attachment-card">
                            <div class="attachment-icon"><i class="fas fa-camera-retro"></i></div>
                            <div class="attachment-info">
                                <h4>Fotografía (Selfie)</h4>
                                <img src="/${SLUG}/admin?download=${encodeURIComponent(arch.foto)}" class="applicant-photo" alt="Foto">
                            </div>
                            <a href="/${SLUG}/admin?download=${encodeURIComponent(arch.foto)}" target="_blank" class="btn-download"><i class="fas fa-external-link-alt"></i></a>
                        </div>`;
                        }

                        if (arch.curriculum) {
                            html += `
                        <div class="attachment-card">
                            <div class="attachment-icon"><i class="fas fa-file-pdf"></i></div>
                            <div class="attachment-info">
                                <h4>Currículum Vitae</h4>
                                <div style="font-size:0.8rem; color:var(--text-muted);">${arch.curriculum}</div>
                            </div>
                            <a href="/${SLUG}/admin?download=${encodeURIComponent(arch.curriculum)}" class="btn-download"><i class="fas fa-download"></i> Descargar</a>
                        </div>`;
                        }
                    }

                    document.getElementById('detailContent').innerHTML = html;
                    document.getElementById('detailModal').classList.add('active');
                }

                function closeModal() { document.getElementById('detailModal').classList.remove('active'); }
                document.getElementById('detailModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

                function openSettingsModal() { document.getElementById('settingsModal').classList.add('active'); }
                function closeSettingsModal() { document.getElementById('settingsModal').classList.remove('active'); }
                document.getElementById('settingsModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeSettingsModal(); });

                function saveSettings(e) {
                    e.preventDefault();
                    const form = e.target;
                    const fd = new FormData(form);
                    const btn = form.querySelector('button[type="submit"]');
                    const origText = btn.textContent;
                    btn.textContent = 'Guardando...';
                    btn.disabled = true;

                    fetch('/' + SLUG + '/admin', { method: 'POST', body: fd })
                        .then(r => r.json())
                        .then(d => {
                            btn.textContent = origText;
                            btn.disabled = false;
                            if (d.success) {
                                showToast('Configuración guardada');
                                setTimeout(() => location.reload(), 1000);
                            } else {
                                showToast('Error al guardar: ' + (d.error || ''));
                            }
                        })
                        .catch(() => {
                            btn.textContent = origText;
                            btn.disabled = false;
                            showToast('Error de conexión');
                        });
                }
            </script>
    <?php endif; ?>

</body>

</html>