<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/mail-config.php';
$hasConfig = is_readable($configPath);
$config = $hasConfig ? require $configPath : [];

echo json_encode([
    'ok' => true,
    'backend' => 'php',
    'smtp' => $hasConfig && ps_smtp_ready_static($config),
    'configPresent' => $hasConfig,
    'time' => gmdate('c'),
], JSON_UNESCAPED_UNICODE);

function ps_smtp_ready_static(array $config): bool
{
    return !empty($config['smtp_host'])
        && !empty($config['smtp_user'])
        && !empty($config['smtp_pass']);
}
