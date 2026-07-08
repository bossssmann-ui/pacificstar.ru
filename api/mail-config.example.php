<?php
declare(strict_types=1);

/**
 * Скопируйте в mail-config.php на сервере (или задайте SMTP_PASS в GitHub Secrets).
 * Файл mail-config.php не коммитится в git.
 */
return [
    'contact_email' => 'sales@pacificstar.ru',
    'cors_origin' => 'https://pacificstar.ru',
    'smtp_host' => 'smtp.timeweb.ru',
    'smtp_port' => 465,
    'smtp_user' => 'noreply@pacificstar.ru',
    'smtp_pass' => '',
    'mail_from' => 'noreply@pacificstar.ru',
    'amocrm_webhook_url' => '',
];
