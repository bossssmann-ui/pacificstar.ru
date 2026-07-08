<?php
declare(strict_types=1);

/**
 * SMTP for Yandex / Mail.ru — SSL:465, STARTTLS:587, shared-hosting friendly.
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

function ps_smtp_connect_ssl(string $host, int $port)
{
    $lastErr = '';
    foreach ([
        ['verify_peer' => true, 'verify_peer_name' => true],
        ['verify_peer' => false, 'verify_peer_name' => false],
    ] as $ssl) {
        $ctx = stream_context_create(['ssl' => $ssl + ['allow_self_signed' => false]]);
        $fp = @stream_socket_client(
            'ssl://' . $host . ':' . $port,
            $errno,
            $errstr,
            25,
            STREAM_CLIENT_CONNECT,
            $ctx
        );
        if ($fp) {
            return $fp;
        }
        $lastErr = $errstr ?: ('errno ' . $errno);
    }
    throw new RuntimeException('SSL connect failed: ' . $lastErr);
}

function ps_smtp_connect_starttls(string $host, int $port)
{
    $lastErr = '';
    $fp = @stream_socket_client(
        'tcp://' . $host . ':' . $port,
        $errno,
        $errstr,
        25,
        STREAM_CLIENT_CONNECT
    );
    if (!$fp) {
        throw new RuntimeException('TCP connect failed: ' . ($errstr ?: ('errno ' . $errno)));
    }

    stream_set_timeout($fp, 25);
    ps_smtp_expect(ps_smtp_read($fp), [220]);
    ps_smtp_write($fp, 'EHLO pacificstar.ru');
    ps_smtp_expect(ps_smtp_read($fp), [250]);
    ps_smtp_write($fp, 'STARTTLS');
    ps_smtp_expect(ps_smtp_read($fp), [220]);

  $cryptoOk = @stream_socket_enable_crypto(
    $fp,
    true,
    STREAM_CRYPTO_METHOD_TLS_CLIENT
  );
    if (!$cryptoOk) {
        fclose($fp);
        throw new RuntimeException('STARTTLS failed');
    }

    return $fp;
}

function ps_smtp_auth_and_send($fp, array $cfg, string $to, string $subject, string $html): void
{
    $user = $cfg['user'];
    $pass = $cfg['pass'];
    $from = $cfg['from'] ?? $user;

    stream_set_timeout($fp, 25);

    if (!isset($cfg['_starttls_done'])) {
        ps_smtp_expect(ps_smtp_read($fp), [220]);
    }

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

function ps_smtp_send(array $cfg, string $to, string $subject, string $html): void
{
    $host = $cfg['host'];
    $errors = [];

    try {
        $fp = ps_smtp_connect_ssl($host, (int)($cfg['port'] ?? 465));
        ps_smtp_auth_and_send($fp, $cfg, $to, $subject, $html);
        return;
    } catch (Throwable $e) {
        $errors[] = '465/ssl: ' . $e->getMessage();
    }

    try {
        $fp = ps_smtp_connect_starttls($host, 587);
        $cfg['_starttls_done'] = true;
        ps_smtp_auth_and_send($fp, $cfg, $to, $subject, $html);
        return;
    } catch (Throwable $e) {
        $errors[] = '587/starttls: ' . $e->getMessage();
    }

    throw new RuntimeException(implode(' | ', $errors));
}

/** Connect + AUTH only (for health check). */
function ps_smtp_verify(array $cfg): array
{
    $host = (string)$cfg['host'];
    $user = (string)$cfg['user'];
    $pass = (string)$cfg['pass'];

    $tryAuth = function ($fp, bool $skipBanner) use ($user, $pass): void {
        if (!$skipBanner) {
            ps_smtp_expect(ps_smtp_read($fp), [220]);
        }
        ps_smtp_write($fp, 'EHLO pacificstar.ru');
        ps_smtp_expect(ps_smtp_read($fp), [250]);
        ps_smtp_write($fp, 'AUTH LOGIN');
        ps_smtp_expect(ps_smtp_read($fp), [334]);
        ps_smtp_write($fp, base64_encode($user));
        ps_smtp_expect(ps_smtp_read($fp), [334]);
        ps_smtp_write($fp, base64_encode($pass));
        ps_smtp_expect(ps_smtp_read($fp), [235]);
        ps_smtp_write($fp, 'QUIT');
        fclose($fp);
    };

    try {
        $fp = ps_smtp_connect_ssl($host, 465);
        $tryAuth($fp, false);
        return ['ok' => true, 'via' => 'ssl:465'];
    } catch (Throwable $e) {
        $err465 = $e->getMessage();
    }

    try {
        $fp = ps_smtp_connect_starttls($host, 587);
        $tryAuth($fp, true);
        return ['ok' => true, 'via' => 'starttls:587'];
    } catch (Throwable $e) {
        return ['ok' => false, 'error' => $err465 . ' | 587: ' . $e->getMessage()];
    }
}
