<?php
// submit_application.php — Multi-Tenant Form Submission Handler
require_once __DIR__ . '/config.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
set_time_limit(300);
header('Content-Type: application/json');

// Incluir FPDF y PHPMailer
require('fpdf/fpdf.php');
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ── Load tenant ─────────────────────────────────────────────
$tenantSlug = $_POST['tenant_slug'] ?? '';
$tenant = loadTenant($tenantSlug);

if (!$tenant) {
    echo json_encode(["success" => false, "message" => "Empresa no válida."]);
    exit;
}

$tenantDir = $tenant['dir'];
$submissionsFile = $tenant['submissions_file'];
$uploadsDir = $tenant['uploads_dir'];
$adminEmail = $tenant['admin_email'] ?? '';
$senderName = $tenant['sender_name'] ?? $tenant['name'];
$brandName = $tenant['name'];

// Ensure directories exist
if (!is_dir($tenantDir))
    mkdir($tenantDir, 0755, true);
if (!is_dir($uploadsDir))
    mkdir($uploadsDir, 0755, true);

// Log function
function logMessage($message)
{
    $logFile = __DIR__ . '/data/email_log.txt';
    if (!is_dir(dirname($logFile)))
        mkdir(dirname($logFile), 0755, true);
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

logMessage("[$tenantSlug] Script started. POST data received.");

// ── Rate Limiting ───────────────────────────────────────────
$clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = $tenantDir . '/rate_limits.json';
$rateLimits = [];
if (file_exists($rateLimitFile)) {
    $rateLimits = json_decode(file_get_contents($rateLimitFile), true) ?: [];
}
$now = time();
$cutoffHour = $now - 3600;
$cutoffMinute = $now - 60;

// Filter out old records > 1 hour
$rateLimits = array_filter($rateLimits, fn($r) => $r['time'] > $cutoffHour);
$ipSubmissionsHour = array_filter($rateLimits, fn($r) => $r['ip'] === $clientIP);
$ipSubmissionsMinute = array_filter($ipSubmissionsHour, fn($r) => $r['time'] > $cutoffMinute);

if (count($ipSubmissionsMinute) >= 1) {
    logMessage("[$tenantSlug] Rate limit exceeded (1/min) for IP: $clientIP");
    echo json_encode(["success" => false, "message" => "Por favor, espera un minuto antes de enviar otra solicitud."]);
    exit;
}

if (count($ipSubmissionsHour) >= 3) {
    logMessage("[$tenantSlug] Rate limit exceeded (3/hour) for IP: $clientIP");
    echo json_encode(["success" => false, "message" => "Has excedido el límite de envíos por hora. Intenta más tarde."]);
    exit;
}

// ── Validation functions ────────────────────────────────────
function sanitizeInput($data)
{
    return htmlspecialchars(stripslashes(trim($data)), ENT_QUOTES, 'UTF-8');
}
function validateEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}
function validatePhone($phone)
{
    return preg_match('/^[0-9\-\+\(\)\s]{7,20}$/', $phone);
}
function validateCedula($cedula)
{
    $clean = preg_replace('/[\s\-]/', '', $cedula);
    return preg_match('/^[0-9]{11}$/', $clean);
}
function validateFileType($file, $allowedTypes)
{
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    return in_array($ext, $allowedTypes);
}
function validateFileSize($file, $maxSize = 5242880)
{
    return $file['size'] <= $maxSize;
}
function validateFileMime($file, $allowedMimes)
{
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    return in_array($mime, $allowedMimes);
}
function sanitizeFileName($name)
{
    $name = basename($name);
    $name = preg_replace('/[^a-zA-Z0-9._-]/', '_', $name);
    return $name;
}

// ── Validate form data ─────────────────────────────────────
$errors = [];
$formData = [];

$requiredFields = [
    'nombre',
    'apellido',
    'cedula',
    'fecha_nacimiento',
    'lugar_nacimiento',
    'nacionalidad',
    'sexo',
    'estado_civil',
    'direccion',
    'celular',
    'correo',
    'oficio_profesion',
    'sueldo_aspirado'
];

foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        $errors[] = "El campo " . ucfirst(str_replace('_', ' ', $field)) . " es requerido.";
    } else {
        $formData[$field] = sanitizeInput($_POST[$field]);
    }
}

$optionalFields = [
    'tel_casa',
    'familiares',
    'primaria',
    'secundaria',
    'universitaria',
    'diplomado',
    'especialidad',
    'maestria',
    'doctorado',
    'experiencia',
    'estudia_actualmente',
    'dia_clases',
    'trabajando_actualmente',
    'razon_dejar_empleo',
    'tiempo_disponible',
    'familiar_empresa',
    'recomendado',
    'licencia_conducir',
    'vehiculo',
    'enfermedad',
    'cual_enfermedad',
    'religion',
    'practica_deporte',
    'cual_deporte'
];

foreach ($optionalFields as $field) {
    if (isset($_POST[$field]) && !empty(trim($_POST[$field]))) {
        $formData[$field] = sanitizeInput($_POST[$field]);
    }
}

if (isset($formData['correo']) && !validateEmail($formData['correo'])) {
    $errors[] = "El correo electrónico no es válido.";
}
if (isset($formData['celular']) && !validatePhone($formData['celular'])) {
    $errors[] = "El número de celular no es válido.";
}
if (isset($formData['cedula']) && !validateCedula($formData['cedula'])) {
    $errors[] = "La cédula debe contener 11 dígitos.";
}

if (!empty($errors)) {
    logMessage("[$tenantSlug] Validation errors: " . implode(", ", $errors));
    echo json_encode(["success" => false, "message" => "Por favor, corrija los siguientes errores:", "errors" => $errors]);
    exit;
}

// ── Process files ───────────────────────────────────────────
$uploadedFiles = [];
$allowedDocTypes = ['pdf', 'doc', 'docx'];
$allowedImageTypes = ['jpg', 'jpeg', 'png'];
$allowedDocMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
$allowedImageMimes = ['image/jpeg', 'image/png'];

// Curriculum
if (isset($_FILES['curriculum']) && $_FILES['curriculum']['error'] == UPLOAD_ERR_OK) {
    if (!validateFileType($_FILES['curriculum'], $allowedDocTypes)) {
        $errors[] = "El curriculum debe ser PDF o DOC.";
    } elseif (!validateFileMime($_FILES['curriculum'], $allowedDocMimes)) {
        $errors[] = "El tipo de archivo del curriculum no es válido.";
    } elseif (!validateFileSize($_FILES['curriculum'])) {
        $errors[] = "El curriculum no debe exceder 5MB.";
    } else {
        $safeName = sanitizeFileName($_FILES['curriculum']['name']);
        $dest = $uploadsDir . '/' . time() . "_curriculum_" . $safeName;
        if (move_uploaded_file($_FILES['curriculum']['tmp_name'], $dest)) {
            $uploadedFiles['curriculum'] = $dest;
        } else {
            $errors[] = "Error al subir el curriculum.";
        }
    }
}

// Foto
if (isset($_FILES['foto']) && $_FILES['foto']['error'] == UPLOAD_ERR_OK) {
    if (!validateFileType($_FILES['foto'], $allowedImageTypes)) {
        $errors[] = "La foto debe ser JPG o PNG.";
    } elseif (!validateFileMime($_FILES['foto'], $allowedImageMimes)) {
        $errors[] = "El tipo de archivo de la foto no es válido.";
    } elseif (!validateFileSize($_FILES['foto'])) {
        $errors[] = "La foto no debe exceder 5MB.";
    } else {
        $safeName = pathinfo($_FILES['foto']['name'], PATHINFO_FILENAME);
        // Force output as JPG to save space
        $dest = $uploadsDir . '/' . time() . "_foto_" . preg_replace('/[^a-zA-Z0-9_\-]/', '', $safeName) . ".jpg";

        // Optimizar con GD
        $tmpName = $_FILES['foto']['tmp_name'];
        $mimeReq = mime_content_type($tmpName);

        $image = false;
        if ($mimeReq == 'image/jpeg') {
            $image = @imagecreatefromjpeg($tmpName);
        } elseif ($mimeReq == 'image/png') {
            $image = @imagecreatefrompng($tmpName);
        }

        if ($image) {
            $width = imagesx($image);
            $height = imagesy($image);
            $maxDim = 1200;

            if ($width > $maxDim || $height > $maxDim) {
                $ratio = $width / $height;
                if ($ratio > 1) {
                    $newWidth = $maxDim;
                    $newHeight = $maxDim / $ratio;
                } else {
                    $newHeight = $maxDim;
                    $newWidth = $maxDim * $ratio;
                }
                $newImage = imagecreatetruecolor($newWidth, $newHeight);
                // Handle transp for PNGs going to JPG context
                $white = imagecolorallocate($newImage, 255, 255, 255);
                imagefill($newImage, 0, 0, $white);
                imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($image);
                $image = $newImage;
            }

            // Save at 75% quality
            if (imagejpeg($image, $dest, 75)) {
                $uploadedFiles['foto'] = $dest;
            } else {
                $errors[] = "Error al comprimir y guardar la foto.";
            }
            imagedestroy($image);

        } else {
            // Fallback to normal moving if GD fails reading
            $fallbackDest = $uploadsDir . '/' . time() . "_foto_" . sanitizeFileName($_FILES['foto']['name']);
            if (move_uploaded_file($tmpName, $fallbackDest)) {
                $uploadedFiles['foto'] = $fallbackDest;
            } else {
                $errors[] = "Error al subir la foto.";
            }
        }
    }
}

if (!empty($errors)) {
    echo json_encode(["success" => false, "message" => "Error en archivos:", "errors" => $errors]);
    exit;
}

// ── Save to Database ────────────────────────────────────────────
$db = getDB();
$submissionId = uniqid(strtoupper(substr($tenantSlug, 0, 3)) . '_', true);

if ($db) {
    try {
        $stmt = $db->prepare("INSERT INTO submissions (tenant_slug, datos, archivos, estado, fecha) VALUES (?, ?, ?, ?, ?) RETURNING id");
        $stmt->execute([
            $tenantSlug,
            json_encode($formData, JSON_UNESCAPED_UNICODE),
            json_encode(array_map('basename', $uploadedFiles), JSON_UNESCAPED_UNICODE),
            'nuevo',
            date('Y-m-d H:i:s')
        ]);
        $row = $stmt->fetch();
        if ($row && isset($row['id'])) {
            $submissionId = $row['id'];
        }
    } catch (PDOException $e) {
        error_log("DB Insert Error: " . $e->getMessage());
        // Continuamos igual enviando email y guardando JSON viejo por si falla DB temporalmente
    }
}

$submission = [
    'id' => $submissionId,
    'fecha' => date('Y-m-d H:i:s'),
    'estado' => 'nuevo',
    'datos' => $formData,
    'archivos' => array_map('basename', $uploadedFiles)
];

// Fallback legacy (JSON) if needed but we mainly rely on DB now
$submissions = [];
if (file_exists($submissionsFile)) {
    $content = file_get_contents($submissionsFile);
    $submissions = json_decode($content, true) ?: [];
}
$submissions[] = $submission;
file_put_contents($submissionsFile, json_encode($submissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Record rate limit
$rateLimits[] = ['ip' => $clientIP, 'time' => time()];
file_put_contents($rateLimitFile, json_encode($rateLimits));

// ── Generate PDF ────────────────────────────────────────────
$pdf = new FPDF();
$pdf->AddPage();

// Header bar
$pdf->SetFillColor(12, 74, 110);
$pdf->Rect(0, 0, 210, 40, 'F');
$pdf->SetTextColor(255, 255, 255);
$pdf->SetFont('Arial', 'B', 20);
$pdf->SetXY(15, 8);
$pdf->Cell(180, 10, utf8_decode('Solicitud de Empleo'), 0, 1);
$pdf->SetFont('Arial', '', 11);
$pdf->SetXY(15, 20);
$pdf->Cell(180, 8, utf8_decode($brandName . '  |  ' . date('d/m/Y H:i')), 0, 1);

// Applicant name
$pdf->SetTextColor(12, 74, 110);
$pdf->SetFont('Arial', 'B', 14);
$pdf->SetXY(15, 48);
$pdf->Cell(0, 10, utf8_decode(($formData['nombre'] ?? '') . ' ' . ($formData['apellido'] ?? '')), 0, 1);

// Accent line
$pdf->SetDrawColor(14, 165, 233);
$pdf->SetLineWidth(0.8);
$pdf->Line(15, 60, 195, 60);

// Helper: draw a section
function pdfSection(&$pdf, $title, $fields, &$formData)
{
    $pdf->Ln(4);
    $pdf->SetFillColor(240, 249, 255);
    $pdf->SetTextColor(12, 74, 110);
    $pdf->SetFont('Arial', 'B', 11);
    $pdf->Cell(180, 8, utf8_decode('  ' . $title), 0, 1, 'L', true);
    $pdf->Ln(2);
    foreach ($fields as $field) {
        if (isset($formData[$field]) && !empty($formData[$field])) {
            $label = ucfirst(str_replace('_', ' ', $field));
            $pdf->SetTextColor(100, 116, 139);
            $pdf->SetFont('Arial', 'B', 9);
            $pdf->Cell(55, 7, utf8_decode($label . ':'), 0, 0);
            $pdf->SetTextColor(51, 65, 85);
            $pdf->SetFont('Arial', '', 10);
            $pdf->MultiCell(125, 7, utf8_decode($formData[$field]));
        }
    }
}

$pdf->SetXY(15, 66);
pdfSection($pdf, 'DATOS PERSONALES', ['nombre', 'apellido', 'cedula', 'fecha_nacimiento', 'lugar_nacimiento', 'nacionalidad', 'sexo', 'estado_civil', 'direccion', 'tel_casa', 'celular', 'correo'], $formData);
pdfSection($pdf, 'EDUCACION', ['primaria', 'secundaria', 'universitaria', 'diplomado', 'especialidad', 'maestria', 'doctorado'], $formData);
pdfSection($pdf, 'INFORMACION PROFESIONAL', ['oficio_profesion', 'sueldo_aspirado', 'experiencia', 'estudia_actualmente', 'trabajando_actualmente', 'razon_dejar_empleo', 'tiempo_disponible'], $formData);
pdfSection($pdf, 'INFORMACION ADICIONAL', ['familiar_empresa', 'recomendado', 'licencia_conducir', 'vehiculo', 'enfermedad', 'cual_enfermedad', 'religion', 'practica_deporte', 'cual_deporte', 'familiares'], $formData);

// Footer
$pdf->SetY(-20);
$pdf->SetFillColor(241, 245, 249);
$pdf->Rect(0, $pdf->GetY(), 210, 20, 'F');
$pdf->SetTextColor(148, 163, 184);
$pdf->SetFont('Arial', '', 8);
$pdf->Cell(0, 10, utf8_decode($brandName . ' | ' . date('d/m/Y H:i:s') . ' | ID: ' . $submission['id']), 0, 0, 'C');

$pdfFileName = $uploadsDir . "/solicitud_" . time() . ".pdf";
$pdf->Output('F', $pdfFileName);
logMessage("[$tenantSlug] PDF generated: $pdfFileName");

// ── Email function ──────────────────────────────────────────
function sendSMTPMail($to, $subject, $body, $isHTML = false, $attachments = [], $replyTo = null, $senderName = 'RENACE Forms')
{
    if (SMTP_USERNAME === '' || SMTP_PASSWORD === '') {
        logMessage('SMTP not configured (missing SMTP_USERNAME / SMTP_PASSWORD).');
        return false;
    }
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = SMTP_PORT;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom(SMTP_USERNAME, $senderName);
        if (is_array($to)) {
            foreach ($to as $address) {
                $address = trim($address);
                if (filter_var($address, FILTER_VALIDATE_EMAIL)) {
                    $mail->addAddress($address);
                }
            }
        } else {
            $mail->addAddress($to);
        }

        if ($replyTo) {
            if (is_array($replyTo)) {
                $mail->addReplyTo($replyTo['email'], $replyTo['name'] ?? '');
            } else {
                $mail->addReplyTo($replyTo);
            }
        }

        foreach ($attachments as $filePath) {
            if (file_exists($filePath)) {
                $mail->addAttachment($filePath);
            }
        }

        $mail->isHTML($isHTML);
        $mail->Subject = $subject;
        $mail->Body = $body;
        if ($isHTML) {
            $mail->AltBody = strip_tags($body);
        }

        $mail->send();
        return true;
    } catch (Exception $e) {
        logMessage("Mailer Error sending to $to: " . $mail->ErrorInfo);
        return false;
    }
}

// ── Admin email ─────────────────────────────────────────────
$adminAttachments = [];
if (isset($uploadedFiles['curriculum']))
    $adminAttachments[] = $uploadedFiles['curriculum'];
if (isset($uploadedFiles['foto']))
    $adminAttachments[] = $uploadedFiles['foto'];
$adminAttachments[] = $pdfFileName;

$adminBody = "
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='max-width:650px;margin:0 auto;font-family:Segoe UI,Arial,sans-serif;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;'>
    <tr>
        <td bgcolor='#0c4a6e' style='background-color:#0c4a6e;padding:28px 30px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:22px;font-weight:700;'>Nueva Solicitud de Empleo</h1>
            <p style='color:#93c5fd;margin:8px 0 0;font-size:14px;'>{$brandName}</p>
        </td>
    </tr>
    <tr>
        <td bgcolor='#f8fafc' style='background-color:#f8fafc;padding:24px 30px;'>
            <table width='100%' cellpadding='0' cellspacing='0' border='0'>";

foreach ($formData as $key => $value) {
    $label = ucfirst(str_replace('_', ' ', $key));
    $adminBody .= "
                <tr>
                    <td style='padding:9px 10px;font-weight:600;color:#1e293b;width:40%;border-bottom:1px solid #e2e8f0;font-size:14px;'>{$label}</td>
                    <td style='padding:9px 10px;color:#475569;border-bottom:1px solid #e2e8f0;font-size:14px;'>{$value}</td>
                </tr>";
}

$adminBody .= "
            </table>
            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top:20px;'>
                <tr>
                    <td bgcolor='#dbeafe' style='background-color:#dbeafe;padding:14px 16px;border-radius:6px;text-align:center;'>
                        <p style='margin:0;color:#1e40af;font-size:13px;'>Se adjuntan el PDF de la solicitud y los documentos del aplicante.</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td bgcolor='#e2e8f0' style='background-color:#e2e8f0;padding:14px;text-align:center;'>
            <p style='margin:0;color:#64748b;font-size:11px;'>{$brandName} &copy; " . date('Y') . "</p>
        </td>
    </tr>
</table>";

$adminEmailSent = false;
$notifyEmails = $tenant['notification_emails'] ?? $adminEmail;
$notifyList = is_array($notifyEmails) ? $notifyEmails : array_map('trim', explode(',', $notifyEmails));
$notifyList = array_filter($notifyList);

if (!empty($notifyList)) {
    $adminEmailSent = sendSMTPMail(
        $notifyList,
        "📋 Nueva Solicitud - {$brandName} | {$formData['nombre']} {$formData['apellido']}",
        $adminBody,
        true,
        $adminAttachments,
        ['email' => $formData['correo'], 'name' => $formData['nombre'] . ' ' . $formData['apellido']],
        $senderName
    );
}

// ── Applicant confirmation email ────────────────────────────
$applicantBody = "
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;margin:0 auto;font-family:Segoe UI,Arial,sans-serif;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;'>
    <tr>
        <td bgcolor='#0c4a6e' style='background-color:#0c4a6e;padding:32px 30px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:21px;font-weight:700;'>¡Gracias por tu interés!</h1>
            <p style='color:#93c5fd;margin:8px 0 0;font-size:14px;'>{$brandName}</p>
        </td>
    </tr>
    <tr>
        <td bgcolor='#f8fafc' style='background-color:#f8fafc;padding:28px 30px;'>
            <p style='color:#1e293b;font-size:15px;line-height:1.7;margin:0 0 12px;'>Hola <strong>{$formData['nombre']}</strong>,</p>
            <p style='color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;'>Hemos recibido tu solicitud de empleo exitosamente. Nuestro equipo la revisará cuidadosamente y nos pondremos en contacto contigo a la brevedad.</p>
            <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                <tr>
                    <td style='border-left:4px solid #0ea5e9;background-color:#eff6ff;padding:14px 18px;'>
                        <p style='margin:0 0 8px;color:#0c4a6e;font-weight:600;font-size:14px;'>Resumen de tu solicitud:</p>
                        <p style='margin:3px 0;color:#1e293b;font-size:13px;'><strong>Nombre:</strong> {$formData['nombre']} {$formData['apellido']}</p>
                        <p style='margin:3px 0;color:#1e293b;font-size:13px;'><strong>Posición:</strong> {$formData['oficio_profesion']}</p>
                        <p style='margin:3px 0;color:#1e293b;font-size:13px;'><strong>Fecha:</strong> " . date('d/m/Y H:i') . "</p>
                    </td>
                </tr>
            </table>
            <p style='color:#64748b;font-size:13px;margin:20px 0 0;'>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        </td>
    </tr>
    <tr>
        <td bgcolor='#e2e8f0' style='background-color:#e2e8f0;padding:16px;text-align:center;'>
            <p style='margin:0;color:#64748b;font-size:12px;'>Saludos cordiales,</p>
            <p style='margin:4px 0 0;color:#0c4a6e;font-weight:600;font-size:13px;'>{$brandName}</p>
        </td>
    </tr>
</table>";

$applicantEmailSent = sendSMTPMail(
    $formData['correo'],
    "✅ Confirmación de Solicitud - {$brandName}",
    $applicantBody,
    true,
    [],
    $adminEmail,
    $senderName
);

// ── JSON response ───────────────────────────────────────────
if ($adminEmailSent && $applicantEmailSent) {
    logMessage("[$tenantSlug] Success: Both emails sent.");
    echo json_encode(["success" => true, "message" => "¡Tu solicitud ha sido enviada exitosamente! Te hemos enviado un correo de confirmación."]);
} elseif (!$adminEmailSent && !$applicantEmailSent) {
    logMessage("[$tenantSlug] Error: Both emails failed.");
    echo json_encode(["success" => true, "message" => "¡Solicitud registrada! Los correos de notificación se procesarán pronto."]);
} else {
    logMessage("[$tenantSlug] Partial success.");
    echo json_encode(["success" => true, "message" => "¡Solicitud registrada! Es posible que uno de los correos no se haya enviado, pero tu solicitud está guardada."]);
}
?>