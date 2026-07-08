<?php
declare(strict_types=1);

/**
 * Minimal SMTP client (AUTH LOGIN, SSL) for Yandex / Mail.ru.
 */
function ps_smtp_read($fp): string
{
    $data = '';
    while (!feof($fp)) {
        $line = fgets($fp, 515);
        if ($line === false) {
            break;
        }
        $data .= $line;
        if (isset($line[3]) && $line[3] === ' ') {
            break;
        }
    }
    return $data;
}

function ps_smtp_write($fp, string $line): void
{
    fwrite($fp, $line . "\r\n");
}

function ps_smtp_expect(string $response, array $codes): void
{
    $code = (int)substr($response, 0, 3);
    if (!in_array($code, $codes, true)) {
        throw new RuntimeException('SMTP error: ' . trim($response));
    }
}

function ps_smtp_send(array $cfg, string $to, string $subject, string $html): void
{
    $host = $cfg['host'];
    $port = $cfg['port'] ?? 465;
    $user = $cfg['user'];
    $pass = $cfg['pass'];
    $from = $cfg['from'] ?? $user;

    $ctx = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'allow_self_signed' => false,
        ],
    ]);

    $fp = @stream_socket_client(
        'ssl://' . $host . ':' . $port,
        $errno,
        $errstr,
        30,
        STREAM_CLIENT_CONNECT,
        $ctx
    );

    if (!$fp) {
        throw new RuntimeException('SMTP connect failed: ' . $errstr);
    }

    stream_set_timeout($fp, 30);

    ps_smtp_expect(ps_smtp_read($fp), [220]);
    ps_smtp_write($fp, 'EHLO pacificstar.ru');
    ps_smtp_expect(ps_smtp_read($fp), [250]);

    ps_smtp_write($fp, 'AUTH LOGIN');
    ps_smtp_expect(ps_smtp_read($fp), [334]);
    ps_smtp_write($fp, base64_encode($user));
    ps_smtp_expect(ps_smtp_read($fp), [334]);
    ps_smtp_write($fp, base64_encode($pass));
    ps_smtp_expect(ps_smtp_read($fp), [235]);

    ps_smtp_write($fp, 'MAIL FROM:<' . $from . '>');
    ps_smtp_expect(ps_smtp_read($fp), [250]);
    ps_smtp_write($fp, 'RCPT TO:<' . $to . '>');
    ps_smtp_expect(ps_smtp_read($fp), [250, 251]);
    ps_smtp_write($fp, 'DATA');
    ps_smtp_expect(ps_smtp_read($fp), [354]);

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $body = "From: {$from}\r\n";
    $body .= "To: {$to}\r\n";
    $body .= "Subject: {$encodedSubject}\r\n";
    $body .= "MIME-Version: 1.0\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n";
    $body .= "\r\n";
    $body .= $html . "\r\n";

    fwrite($fp, $body . ".\r\n");
    ps_smtp_expect(ps_smtp_read($fp), [250]);

    ps_smtp_write($fp, 'QUIT');
    fclose($fp);
}
