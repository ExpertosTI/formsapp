<?php
// landing.php — Página principal de RENACE Forms
require_once __DIR__ . '/config.php';
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RENACE — Plataforma de Formularios</title>
    <meta name="description"
        content="RENACE — Plataforma centralizada de formularios de solicitud de empleo para empresas.">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary:
                <?= PLATFORM_COLOR_PRIMARY ?>
            ;
            --accent:
                <?= PLATFORM_COLOR_ACCENT ?>
            ;
            --bg:
                <?= PLATFORM_COLOR_BG ?>
            ;
            --bg2: #1e293b;
            --border: rgba(255, 255, 255, 0.08);
            --text: #e2e8f0;
            --text-muted: #94a3b8;
            --text-bright: #f8fafc;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background:
                radial-gradient(circle at 20% 30%, rgba(27, 32, 85, 0.25) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(45, 209, 124, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(27, 32, 85, 0.08) 0%, transparent 70%);
            z-index: 0;
            animation: bgFloat 20s ease-in-out infinite;
        }

        @keyframes bgFloat {

            0%,
            100% {
                transform: translate(0, 0);
            }

            33% {
                transform: translate(-2%, 1%);
            }

            66% {
                transform: translate(1%, -2%);
            }
        }

        .container {
            position: relative;
            z-index: 1;
            text-align: center;
            max-width: 700px;
            padding: 40px 24px;
        }

        /* ── Logo / Brand ──────────────────── */
        .brand-logo {
            width: 80px;
            height: 80px;
            border-radius: 22px;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 32px;
            box-shadow: 0 12px 40px rgba(45, 209, 124, 0.2), 0 0 60px rgba(27, 32, 85, 0.15);
            animation: logoFloat 4s ease-in-out infinite;
        }

        .brand-logo i {
            font-size: 2rem;
            color: white;
        }

        @keyframes logoFloat {

            0%,
            100% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-6px);
            }
        }

        .brand-name {
            font-size: 2.8rem;
            font-weight: 900;
            letter-spacing: -0.03em;
            margin-bottom: 8px;
            animation: fadeUp 0.6s ease both;
        }

        .brand-name .r {
            color: var(--accent);
        }

        .brand-name .rest {
            color: var(--text-bright);
        }

        .brand-tagline {
            font-size: 1.1rem;
            color: var(--text-muted);
            font-weight: 400;
            margin-bottom: 48px;
            line-height: 1.6;
            animation: fadeUp 0.6s ease 0.1s both;
        }

        /* ── Features ──────────────────────── */
        .features {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 48px;
            animation: fadeUp 0.6s ease 0.2s both;
        }

        .feature {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 24px 16px;
            transition: all 0.3s;
        }

        .feature:hover {
            border-color: rgba(45, 209, 124, 0.2);
            background: rgba(255, 255, 255, 0.06);
            transform: translateY(-4px);
        }

        .feature-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(45, 209, 124, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 14px;
            color: var(--accent);
            font-size: 1.1rem;
        }

        .feature h3 {
            font-size: 0.88rem;
            font-weight: 600;
            color: var(--text-bright);
            margin-bottom: 6px;
        }

        .feature p {
            font-size: 0.78rem;
            color: var(--text-muted);
            line-height: 1.5;
        }

        /* ── Contact ───────────────────────── */
        .contact-section {
            animation: fadeUp 0.6s ease 0.3s both;
        }

        .contact-info {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 24px;
            margin-bottom: 32px;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px 20px;
            transition: all 0.3s;
            text-decoration: none;
            color: var(--text);
        }

        .contact-item:hover {
            border-color: rgba(45, 209, 124, 0.25);
            background: rgba(255, 255, 255, 0.08);
        }

        .contact-item i {
            color: var(--accent);
            font-size: 1rem;
        }

        .contact-item span {
            font-size: 0.88rem;
            font-weight: 500;
        }

        /* ── Footer ────────────────────────── */
        .footer {
            margin-top: 40px;
            font-size: 0.78rem;
            color: var(--text-muted);
            opacity: 0.6;
        }

        @keyframes fadeUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 640px) {
            .features {
                grid-template-columns: 1fr;
            }

            .brand-name {
                font-size: 2.2rem;
            }

            .contact-info {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
</head>

<body>

    <div class="container">
        <!-- Logo -->
        <div class="brand-logo"><i class="fas fa-bolt"></i></div>

        <!-- Name -->
        <div class="brand-name">
            <span class="r">R</span><span class="rest">ENACE</span>
        </div>
        <p class="brand-tagline">
            Soluciones tecnológicas para la gestión empresarial.<br>
            Plataforma de formularios inteligentes.
        </p>

        <!-- Features -->
        <div class="features">
            <div class="feature">
                <div class="feature-icon"><i class="fas fa-building"></i></div>
                <h3>Multi-Empresa</h3>
                <p>Gestión de formularios para múltiples empresas desde una sola plataforma.</p>
            </div>
            <div class="feature">
                <div class="feature-icon"><i class="fas fa-shield-halved"></i></div>
                <h3>Seguro</h3>
                <p>Datos aislados por empresa con acceso protegido por contraseña.</p>
            </div>
            <div class="feature">
                <div class="feature-icon"><i class="fas fa-envelope"></i></div>
                <h3>Notificaciones</h3>
                <p>Emails automáticos al admin y confirmación al solicitante.</p>
            </div>
        </div>

        <!-- Contact -->
        <div class="contact-section">
            <div class="contact-info">
                <a href="https://renace.tech" target="_blank" class="contact-item">
                    <i class="fas fa-globe"></i>
                    <span>renace.tech</span>
                </a>
                <a href="mailto:info@renace.space" class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <span>info@renace.space</span>
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            &copy; <?= date('Y') ?> RENACE — Todos los derechos reservados
        </div>
    </div>

</body>

</html>