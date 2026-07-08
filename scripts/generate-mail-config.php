#!/usr/bin/env php
<?php
/**
 * Generates api/mail-config.php for FTP deploy from environment variables.
 * Used in GitHub Actions when SMTP_PASS secret is set.
 */
declare(strict_types=1);

$out = __DIR__ . '/../api/mail-config.php';

$pass = getenv('SMTP_PASS') ?: '';
if ($pass === '') {
    fwrite(STDERR, "SMTP_PASS is empty — mail-config.php not generated\n");
    exit(1);
}

$config = [
    'contact_email' => getenv('CONTACT_EMAIL') ?: 'sales@pacificstar.ru',
    'cors_origin' => getenv('CORS_ORIGIN') ?: 'https://pacificstar.ru',
    'smtp_host' => getenv('SMTP_HOST') ?: 'smtp.yandex.ru',
    'smtp_port' => (int)(getenv('SMTP_PORT') ?: 465),
    'smtp_user' => getenv('SMTP_USER') ?: 'noreply@pacificstar.ru',
    'smtp_pass' => $pass,
    'mail_from' => getenv('MAIL_FROM') ?: 'noreply@pacificstar.ru',
    'amocrm_webhook_url' => getenv('AMOCRM_WEBHOOK_URL') ?: '',
];

$export = var_export($config, true);
$php = "<?php\n/** Generated at deploy — do not commit */\ndeclare(strict_types=1);\n\nreturn {$export};\n";

file_put_contents($out, $php);
echo "Wrote {$out}\n";
