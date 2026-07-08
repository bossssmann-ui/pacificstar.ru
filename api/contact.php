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
    $email = trim((string)($body['email'] ?? ''));
    $phone = trim((string)($body['phone'] ?? ''));
    $hasEmail = ps_is_valid_email($email);
    $hasPhone = ps_is_valid_phone($phone);

    if (!$hasEmail && !$hasPhone) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Укажите e-mail или телефон'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $payload = ps_normalize_contact($body);
    $to = (string)($PS_MAIL_CONFIG['contact_email'] ?? 'sales@pacificstar.ru');
    $name = (string)($payload['name'] ?? 'Посетитель');

    ps_send_mail(
        $PS_MAIL_CONFIG,
        $to,
        'Заявка с сайта от ' . $name,
        ps_contact_html($payload)
    );

    try {
        ps_forward_amocrm($PS_MAIL_CONFIG, ps_amocrm_payload($payload, 'contact_form'));
    } catch (Throwable $crmErr) {
        error_log('contact.php AmoCRM: ' . $crmErr->getMessage());
    }

    echo json_encode(['ok' => true, 'message' => 'Заявка отправлена'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('contact.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Не удалось отправить заявку'], JSON_UNESCAPED_UNICODE);
}
