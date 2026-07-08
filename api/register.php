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
    $firstName = trim((string)($body['firstName'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));

    if ($firstName === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Имя обязательно'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if (!ps_is_valid_email($email)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Некорректный e-mail'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $lastName = trim((string)($body['lastName'] ?? ''));
    $fullName = trim($firstName . ' ' . $lastName);

    ps_send_mail(
        $PS_MAIL_CONFIG,
        $email,
        'Регистрация на Pacific Star — подтверждение',
        ps_confirmation_html($fullName)
    );

    echo json_encode(['ok' => true, 'message' => 'Письмо с подтверждением отправлено'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('register.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Не удалось отправить письмо'], JSON_UNESCAPED_UNICODE);
}
