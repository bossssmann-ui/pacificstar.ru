<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $body = ps_json_body();
    $phone = trim((string)($body['phone'] ?? ''));

    if (!ps_is_valid_phone($phone)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Укажите телефон'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $payload = [
        'name' => trim((string)($body['name'] ?? '')),
        'phone' => $phone,
        'time' => trim((string)($body['time'] ?? '')),
        'page' => trim((string)($body['page'] ?? '')),
        'service' => 'callback',
        'message' => 'Обратный звонок. Удобное время: ' . trim((string)($body['time'] ?? 'не указано')),
    ];

    ps_forward_amocrm($PS_MAIL_CONFIG, ps_amocrm_payload($payload, 'callback'));

    if (!empty($PS_MAIL_CONFIG['amocrm_webhook_url'])) {
        echo json_encode(['ok' => true, 'message' => 'Мы перезвоним в указанное время'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $to = (string)($PS_MAIL_CONFIG['contact_email'] ?? 'sales@pacificstar.ru');
    ps_send_mail(
        $PS_MAIL_CONFIG,
        $to,
        'Заказ обратного звонка — ' . ($payload['name'] ?: 'Посетитель'),
        ps_contact_html($payload)
    );

    echo json_encode(['ok' => true, 'message' => 'Мы перезвоним в указанное время'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('callback.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Не удалось отправить заявку'], JSON_UNESCAPED_UNICODE);
}
