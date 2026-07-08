<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/mail-config.php';
if (!is_readable($configPath)) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'Почта не настроена. Добавьте SMTP_PASS в GitHub Secrets или api/mail-config.php на сервере.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/** @var array<string, mixed> $PS_MAIL_CONFIG */
$PS_MAIL_CONFIG = require $configPath;

$cors = (string)($PS_MAIL_CONFIG['cors_origin'] ?? 'https://pacificstar.ru');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === $cors || $origin === 'https://www.pacificstar.ru') {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: ' . $cors);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/smtp.php';

function ps_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function ps_is_valid_email(string $value): bool
{
    return (bool)preg_match('/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/', $value);
}

function ps_is_valid_phone(string $value): bool
{
    return strlen(preg_replace('/\D/', '', $value)) >= 10;
}

function ps_escape_html(string $str): string
{
    return htmlspecialchars($str, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function ps_normalize_contact(array $raw): array
{
    $data = $raw;
    $parts = [];

    if (!empty($data['route'])) {
        $parts[] = 'Маршрут: ' . $data['route'];
    }
    if (!empty($data['cargo'])) {
        $parts[] = 'Груз: ' . $data['cargo'];
    }
    if (!empty($data['source']) && empty($data['service'])) {
        $data['service'] = $data['source'];
    }
    if (empty($data['message']) && $parts) {
        $data['message'] = implode("\n", $parts);
    }
    if (!empty($data['source'])) {
        if (!empty($data['message'])) {
            $data['message'] = 'Источник: ' . $data['source'] . "\n" . $data['message'];
        } else {
            $data['message'] = 'Источник: ' . $data['source'];
        }
    }

    return $data;
}

function ps_contact_html(array $data): string
{
    $d = ps_normalize_contact($data);
    $rows = [
        ['Имя', $d['name'] ?? '—'],
        ['E-mail', $d['email'] ?? '—'],
        ['Телефон', $d['phone'] ?? '—'],
        ['Услуга', $d['service'] ?? '—'],
        ['Сообщение', $d['message'] ?? '—'],
    ];

    $html = '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">';
    $html .= '<h2 style="color:#1a2744;">Новая заявка с сайта pacificstar.ru</h2><table style="border-collapse:collapse;width:100%;">';

    $last = count($rows) - 1;
    foreach ($rows as $i => $row) {
        $tl = $i === $last ? 'padding:8px;font-weight:bold;vertical-align:top;' : 'padding:8px;border-bottom:1px solid #eee;font-weight:bold;';
        $tv = $i === $last ? 'padding:8px;' : 'padding:8px;border-bottom:1px solid #eee;';
        $html .= '<tr><td style="' . $tl . '">' . ps_escape_html($row[0]) . '</td>';
        $html .= '<td style="' . $tv . '">' . ps_escape_html((string)$row[1]) . '</td></tr>';
    }

    $html .= '</table></body></html>';
    return $html;
}

function ps_confirmation_html(string $name): string
{
    $safe = ps_escape_html($name);
    return '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">'
        . '<div style="background:#1a2744;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">'
        . '<h1 style="margin:0;font-size:1.4rem;">Pacific Star</h1>'
        . '<p style="margin:4px 0 0;opacity:.8;font-size:.9rem;">Транспортно-логистическая компания</p></div>'
        . '<div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">'
        . '<h2 style="margin:0 0 12px;font-size:1.2rem;">Добро пожаловать, ' . $safe . '!</h2>'
        . '<p style="color:#555;line-height:1.6;">Ваша регистрация в личном кабинете Pacific Star прошла успешно.</p>'
        . '<p style="color:#999;font-size:.82rem;text-align:center;">© Pacific Star · pacificstar.ru</p></div></body></html>';
}

function ps_smtp_ready(array $config): bool
{
    return !empty($config['smtp_host'])
        && !empty($config['smtp_user'])
        && !empty($config['smtp_pass']);
}

function ps_send_mail(array $config, string $to, string $subject, string $html): void
{
    $from = (string)($config['mail_from'] ?? $config['smtp_user'] ?? 'noreply@pacificstar.ru');
    $errors = [];

    if (ps_smtp_ready($config)) {
        try {
            ps_smtp_send([
                'host' => (string)$config['smtp_host'],
                'port' => (int)($config['smtp_port'] ?? 465),
                'user' => (string)$config['smtp_user'],
                'pass' => (string)$config['smtp_pass'],
                'from' => $from,
            ], $to, $subject, $html);
            return;
        } catch (Throwable $e) {
            $errors[] = $e->getMessage();
            error_log('ps_send_mail SMTP: ' . $e->getMessage());
        }
    }

    if (function_exists('mail')) {
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= 'From: Pacific Star <' . $from . ">\r\n";
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        if (@mail($to, $encodedSubject, $html, $headers)) {
            return;
        }
        $errors[] = 'mail() returned false';
    } else {
        $errors[] = 'mail() not available';
    }

    throw new RuntimeException(implode(' | ', $errors));
}

function ps_forward_amocrm(array $config, array $payload): void
{
    $url = trim((string)($config['amocrm_webhook_url'] ?? ''));
    if ($url === '') {
        return;
    }

    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($payload, JSON_UNESCAPED_UNICODE),
            'timeout' => 15,
            'ignore_errors' => true,
        ],
    ]);

    $result = @file_get_contents($url, false, $ctx);
    if ($result === false) {
        throw new RuntimeException('AmoCRM webhook failed');
    }
}

function ps_amocrm_payload(array $data, string $source): array
{
    return [
        'source' => $source,
        'name' => $data['name'] ?? $data['firstName'] ?? 'Посетитель',
        'email' => $data['email'] ?? '',
        'phone' => $data['phone'] ?? '',
        'service' => $data['service'] ?? '',
        'message' => $data['message'] ?? '',
        'time' => $data['time'] ?? '',
        'page' => $data['page'] ?? '',
        'sent_at' => gmdate('c'),
    ];
}
