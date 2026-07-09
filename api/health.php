<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/smtp.php';

$configPath = __DIR__ . '/mail-config.php';
$hasConfig = is_readable($configPath);
$config = $hasConfig ? require $configPath : [];

$smtpLive = ['ok' => false, 'via' => null, 'error' => 'no config'];
if ($hasConfig && ps_smtp_ready_static($config)) {
    $smtpLive = ps_smtp_verify([
        'host' => (string)$config['smtp_host'],
        'user' => (string)$config['smtp_user'],
        'pass' => (string)$config['smtp_pass'],
    ]);
}

echo json_encode([
    'ok' => true,
    'backend' => 'php',
    'smtp' => $hasConfig && ps_smtp_ready_static($config),
    'exim' => function_exists('mail'),
    'smtpLive' => $smtpLive['ok'] ?? false,
    'smtpVia' => $smtpLive['via'] ?? null,
    'amocrm' => $hasConfig && !empty($config['amocrm_webhook_url']),
    'configPresent' => $hasConfig,
    'time' => gmdate('c'),
], JSON_UNESCAPED_UNICODE);

function ps_smtp_ready_static(array $config): bool
{
    return !empty($config['smtp_host'])
        && !empty($config['smtp_user'])
        && !empty($config['smtp_pass']);
}
