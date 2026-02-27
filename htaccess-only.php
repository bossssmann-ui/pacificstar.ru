<?php
/**
 * Pacific Star — Замена .htaccess
 * Загрузите в public_html, откройте в браузере.
 * Заменит старый Tilda .htaccess → исправит ошибку 429 и белый экран.
 * После успеха — удалите этот файл.
 */
ini_set('display_errors', '1');
error_reporting(E_ALL);
header('Content-Type: text/html; charset=utf-8');

$content = "Options -Indexes\nDirectoryIndex index.html index.php\n\n" .
    "<IfModule mod_headers.c>\n" .
    "    Header set X-Content-Type-Options \"nosniff\"\n" .
    "    Header set X-Frame-Options \"SAMEORIGIN\"\n" .
    "</IfModule>\n\n" .
    "<IfModule mod_rewrite.c>\n" .
    "    RewriteEngine On\n" .
    "    RewriteBase /\n" .
    "</IfModule>\n";

$path = __DIR__ . '/.htaccess';
$ok   = file_put_contents($path, $content);
?><!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Замена .htaccess</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0f4f8">
<?php if ($ok !== false): ?>
  <div style="background:white;border-radius:16px;padding:40px;max-width:480px;margin:auto;box-shadow:0 4px 20px rgba(0,0,0,.1)">
    <div style="font-size:64px">✅</div>
    <h1 style="color:#15803d;margin:16px 0 8px">.htaccess заменён!</h1>
    <p style="color:#6b7280;margin-bottom:24px">Редиректы Tilda удалены. Сайт должен открываться.</p>
    <a href="/" style="display:inline-block;background:#0a3d6b;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">🌐 Открыть сайт →</a>
    <p style="margin-top:20px;color:#ef4444;font-size:14px">⚠️ Удалите <code>htaccess-only.php</code> из файлового менеджера</p>
  </div>
<?php else: ?>
  <div style="background:white;border-radius:16px;padding:40px;max-width:480px;margin:auto;box-shadow:0 4px 20px rgba(0,0,0,.1)">
    <div style="font-size:64px">❌</div>
    <h1 style="color:#dc2626">Не удалось записать файл</h1>
    <p style="color:#6b7280;margin-top:12px">Нет прав на запись. Попробуйте через Файловый менеджер Timeweb: найдите <code>.htaccess</code>, нажмите «Редактировать», удалите всё содержимое.</p>
  </div>
<?php endif ?>
</body>
</html>
