<?php
/**
 * Pacific Star — Автоматический исправитель структуры файлов
 * Загрузите этот файл в корень public_html и откройте в браузере.
 * Скрипт:
 *  1. Перезапишет .htaccess чистым файлом (убирает редиректы Tilda → исправляет ошибку 429)
 *  2. Переместит файлы сайта из подпапки в корень
 * После успеха — удалите этот файл.
 */

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: text/html; charset=utf-8');

$publicHtml = __DIR__;
$moved      = false;
$log        = [];
$error      = null;

// ── Шаг 1: ВСЕГДА перезаписываем .htaccess чистым файлом ────────────────
// Это убирает старые редиректы Tilda, которые вызывали ошибку 429.
$cleanHtaccess = "Options -Indexes\nDirectoryIndex index.html index.php\n\n" .
    "<IfModule mod_headers.c>\n" .
    "    Header set X-Content-Type-Options \"nosniff\"\n" .
    "    Header set X-Frame-Options \"SAMEORIGIN\"\n" .
    "</IfModule>\n\n" .
    "<IfModule mod_rewrite.c>\n" .
    "    RewriteEngine On\n" .
    "    RewriteBase /\n" .
    "</IfModule>\n";

$htaccessPath = $publicHtml . '/.htaccess';
if (file_put_contents($htaccessPath, $cleanHtaccess) !== false) {
    $log[] = ['ok', '.htaccess', 'заменён (редиректы Tilda удалены ✅)'];
} else {
    $log[] = ['fail', '.htaccess', 'не удалось записать — нет прав'];
}

// ── Шаг 2: найти подпапку с файлами сайта ──────────────────────────────
$candidates = [];
foreach (glob($publicHtml . '/*', GLOB_ONLYDIR) as $dir) {
    $name = basename($dir);
    if (in_array($name, ['.well-known', 'cgi-bin', 'logs', 'tmp', 'mail'], true)) {
        continue;
    }
    if (file_exists($dir . '/index.html')) {
        $candidates[] = $dir;
    }
}

if (empty($candidates)) {
    // Build a file listing for diagnosis
    $listing = [];
    foreach (glob($publicHtml . '/*') as $item) {
        $name = basename($item);
        $listing[] = (is_dir($item) ? '📁 ' : '📄 ') . $name;
    }
    $error = 'Папка с index.html не найдена. Возможно, файлы уже на месте или ещё не загружены.';
    $listing_html = implode('<br>', array_map('htmlspecialchars', $listing));
} elseif (count($candidates) > 1) {
    $error = 'Найдено несколько папок с index.html: ' . implode(', ', array_map('basename', $candidates)) . '. Напишите разработчику.';
} else {
    $sourceDir = $candidates[0];
    $sourceName = basename($sourceDir);

    // Перемещаем файлы
    $items = array_diff(scandir($sourceDir), ['.', '..']);
    $successCount = 0;
    $failCount = 0;

    foreach ($items as $item) {
        $src  = $sourceDir . '/' . $item;
        $dest = $publicHtml . '/' . $item;

        // .htaccess уже перезаписан на Шаге 1, пропускаем его здесь
        if ($item === '.htaccess') {
            $log[] = ['skip', $item, 'уже обновлён на Шаге 1'];
            continue;
        }

        // Если файл/папка уже есть — удалим сначала
        if (file_exists($dest) || is_dir($dest)) {
            if (is_dir($dest)) {
                // рекурсивно удалить папку
                deleteDir($dest);
            } else {
                unlink($dest);
            }
        }

        if (rename($src, $dest)) {
            $log[] = ['ok', $item, ''];
            $successCount++;
        } else {
            $log[] = ['fail', $item, 'не удалось переместить'];
            $failCount++;
        }
    }

    // Удалить пустую папку-обёртку
    if (is_dir($sourceDir) && count(array_diff(scandir($sourceDir), ['.', '..'])) === 0) {
        rmdir($sourceDir);
        $log[] = ['ok', $sourceName . '/ (удалена пустая папка)', ''];
    }

    $moved = ($failCount === 0 && $successCount > 0);
}

// Вспомогательная функция
function deleteDir(string $dir): void {
    $items = array_diff(scandir($dir), ['.', '..']);
    foreach ($items as $item) {
        $path = $dir . '/' . $item;
        is_dir($path) ? deleteDir($path) : unlink($path);
    }
    rmdir($dir);
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Установка сайта Pacific Star</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    background: #f0f4f8;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
}
.card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,.1);
    padding: 40px;
    max-width: 560px;
    width: 100%;
    text-align: center;
}
.icon { font-size: 64px; margin-bottom: 16px; }
h1 { font-size: 24px; margin-bottom: 10px; }
.sub { color: #6b7280; font-size: 15px; margin-bottom: 24px; }
.btn {
    display: inline-block;
    background: #0a3d6b;
    color: white;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 700;
    margin-top: 8px;
}
.btn.green { background: #16a34a; }
.log { text-align: left; margin: 20px 0; }
.log-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    border-radius: 6px;
    margin-bottom: 4px;
    font-size: 13px;
    font-family: monospace;
}
.log-row.ok   { background: #f0fdf4; color: #166534; }
.log-row.skip { background: #fffbeb; color: #92400e; }
.log-row.fail { background: #fef2f2; color: #991b1b; }
.error-card {
    background: #fef2f2;
    border: 2px solid #ef4444;
    border-radius: 12px;
    padding: 24px;
    color: #991b1b;
}
.note {
    background: #eff6ff;
    border-radius: 8px;
    padding: 12px 16px;
    color: #1e40af;
    font-size: 14px;
    margin-top: 20px;
    text-align: left;
}
</style>
</head>
<body>
<div class="card">

<?php if ($error): ?>
    <div class="error-card">
        <div class="icon">⚠️</div>
        <h1>Не удалось найти файлы</h1>
        <p style="margin-top:10px;"><?= htmlspecialchars($error) ?></p>
    </div>
    <?php if (!empty($listing_html)): ?>
    <div class="note" style="margin-top:16px;">
        <strong>Что сейчас в папке public_html:</strong><br>
        <code style="font-size:13px;line-height:2"><?= $listing_html ?></code>
    </div>
    <?php endif ?>
    <div class="note" style="margin-top:12px;">
        Напишите разработчику что написано выше (сделайте скриншот) — разберёмся вместе.
    </div>

<?php elseif ($moved): ?>
    <div class="icon">🎉</div>
    <h1 style="color:#15803d;">Готово! Сайт установлен</h1>
    <p class="sub">Все файлы перемещены на нужное место. Теперь сайт должен открываться.</p>

    <div class="log">
        <?php foreach ($log as [$status, $name, $note]): ?>
        <div class="log-row <?= $status ?>">
            <?= $status === 'ok' ? '✅' : ($status === 'skip' ? '⏭' : '❌') ?>
            <?= htmlspecialchars($name) ?>
            <?php if ($note): ?><span style="opacity:.7"> — <?= htmlspecialchars($note) ?></span><?php endif ?>
        </div>
        <?php endforeach ?>
    </div>

    <a href="/" class="btn green">🌐 Открыть сайт →</a>

    <div class="note">
        <strong>⚠️ Не забудьте:</strong> удалите файл <code>fix.php</code> из файлового менеджера Timeweb —
        он больше не нужен. Файловый менеджер → public_html → <code>fix.php</code> → Удалить.
    </div>

<?php else: ?>
    <div class="icon">❌</div>
    <h1>Не удалось переместить файлы</h1>
    <p class="sub">Возможно, нет прав на запись. Напишите разработчику.</p>
    <?php if ($log): ?>
    <div class="log">
        <?php foreach ($log as [$status, $name, $note]): ?>
        <div class="log-row <?= $status ?>">
            <?= $status === 'ok' ? '✅' : '❌' ?>
            <?= htmlspecialchars($name) ?>
            <?php if ($note): ?><span style="opacity:.7"> — <?= htmlspecialchars($note) ?></span><?php endif ?>
        </div>
        <?php endforeach ?>
    </div>
    <?php endif ?>
<?php endif ?>

</div>
</body>
</html>
