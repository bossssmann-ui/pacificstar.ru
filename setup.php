<?php
/**
 * Pacific Star — Установщик сайта v3
 * Загрузите ЭТОТ ФАЙЛ в public_html так же, как загружали hello.html.
 * Откройте pacificstar.ru/setup.php и нажмите кнопку.
 */
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);
set_time_limit(120);
header('Content-Type: text/html; charset=utf-8');

$root = rtrim(__DIR__, '/\\') . '/';
$run  = isset($_GET['run']);
$log  = [];
$ok   = false;
$diagnosis = [];

// ── Функции ─────────────────────────────────────────────────────────────
function rrmdir(string $dir): void {
    foreach (array_diff(scandir($dir), ['.','..']) as $f) {
        $p = $dir . '/' . $f;
        is_dir($p) ? rrmdir($p) : unlink($p);
    }
    rmdir($dir);
}

function cleanHtaccess(string $path): void {
    $content = "Options -Indexes\nDirectoryIndex index.html index.php\n\n"
        . "<IfModule mod_headers.c>\n"
        . "    Header set X-Content-Type-Options \"nosniff\"\n"
        . "    Header set X-Frame-Options \"SAMEORIGIN\"\n"
        . "</IfModule>\n";
    file_put_contents($path, $content);
}

function scanPublicHtml(string $root): array {
    $items = [];
    foreach (array_diff(scandir($root), ['.','..']) as $f) {
        $items[] = (is_dir($root . $f) ? '📁 ' : '📄 ') . $f;
    }
    return $items;
}

// ── ДИАГНОСТИКА (всегда) ─────────────────────────────────────────────────
$siteFolder = null;
foreach (glob($root . '*', GLOB_ONLYDIR) as $dir) {
    $name = basename($dir);
    if (in_array($name, ['.well-known','cgi-bin','logs','tmp','mail','img'], true)) continue;
    if (file_exists($dir . '/index.html') && file_exists($dir . '/css/style.css')) {
        $siteFolder = $dir;
        break;
    }
}

$rootHasIndex = file_exists($root . 'index.html');
$rootHasCss   = file_exists($root . 'css/style.css');
$htaccessPath = $root . '.htaccess';

// ── ВЫПОЛНЕНИЕ ───────────────────────────────────────────────────────────
if ($run) {
    // 1. Всегда перезаписываем .htaccess
    cleanHtaccess($htaccessPath);
    $log[] = ['✅', '.htaccess перезаписан — редиректы Tilda удалены'];

    if ($siteFolder) {
        // 2a. Переместить файлы из подпапки
        $sourceName = basename($siteFolder);
        $log[] = ['📂', "Найдена папка с сайтом: {$sourceName}/"];
        $moved = 0; $failed = 0;
        foreach (array_diff(scandir($siteFolder), ['.','..']) as $item) {
            $src  = $siteFolder . '/' . $item;
            $dest = $root . $item;
            if ($item === '.htaccess') { $log[] = ['⏭', ".htaccess — уже обновлён, пропускаем"]; continue; }
            if (file_exists($dest)) {
                is_dir($dest) ? rrmdir($dest) : unlink($dest);
            }
            if (rename($src, $dest)) {
                $log[] = ['✅', $item];
                $moved++;
            } else {
                $log[] = ['❌', "{$item} — не удалось переместить"];
                $failed++;
            }
        }
        // Удалить пустую папку
        if (is_dir($siteFolder) && count(array_diff(scandir($siteFolder), ['.','..'])) === 0) {
            rmdir($siteFolder);
            $log[] = ['🗑', "Папка {$sourceName}/ удалена (она пустая)"];
        }
        $ok = ($failed === 0 && $moved > 0);
        if (!$ok && $moved === 0) $log[] = ['❌', 'Ни один файл не был перемещён'];
    } elseif ($rootHasIndex && $rootHasCss) {
        // 2b. Файлы уже на месте — просто починили .htaccess
        $log[] = ['✅', 'index.html и css/ уже в правильном месте'];
        $log[] = ['✅', '.htaccess обновлён — сайт должен открываться'];
        $ok = true;
    } else {
        // 2c. Не нашли ни подпапку, ни файлы — показать диагностику
        $diagnosis = scanPublicHtml($root);
        $log[] = ['⚠️', 'Файлы сайта не найдены. Смотрите диагностику ниже.'];
    }

    // Если успех — самоудалиться
    if ($ok) @unlink(__FILE__);
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Установка сайта Pacific Star</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
  background:#0a1e30;min-height:100vh;display:flex;align-items:center;
  justify-content:center;padding:24px;color:#e0eaf5}
.card{background:#122236;border-radius:16px;padding:44px;
  max-width:620px;width:100%;box-shadow:0 8px 48px rgba(0,0,0,.6)}
h1{font-size:22px;color:#fff;margin-bottom:6px}
.sub{color:#6fa3c8;font-size:14px;margin-bottom:28px;line-height:1.6}
.btn{display:block;width:100%;background:#f4a007;color:#000;font-weight:800;
  font-size:20px;padding:18px;border-radius:10px;text-decoration:none;
  text-align:center;cursor:pointer;border:none}
.btn:hover{background:#ffc234}
.btn.green{background:#16a34a;color:#fff}
.info{background:#0d2a40;border-radius:8px;padding:16px 20px;
  margin-bottom:20px;font-size:14px;color:#7fbfe0;line-height:1.7}
.log{background:#091929;border-radius:8px;padding:18px 20px;
  margin-top:20px;max-height:380px;overflow-y:auto}
.log-row{font-size:13px;font-family:monospace;line-height:2;
  border-bottom:1px solid #0d2a40;padding:0 2px}
.ok-card{background:#0a2e1a;border:2px solid #16a34a;border-radius:12px;
  padding:32px;text-align:center;margin-top:24px}
.err-card{background:#2e0a0a;border:2px solid #dc2626;border-radius:12px;
  padding:24px;margin-top:16px}
.diag{background:#1a2f20;border:1px solid #4caf50;border-radius:8px;
  padding:16px;margin-top:16px;font-size:13px;font-family:monospace;line-height:2}
.warn{background:#2a1900;border:1px solid #f4a007;border-radius:8px;
  padding:12px 16px;margin-bottom:20px;font-size:13px;color:#f4d07a}
</style>
</head>
<body>
<div class="card">

<?php if (!$run): ?>

  <h1>🚀 Установка сайта Pacific Star</h1>
  <p class="sub">
    Этот скрипт:<br>
    1. Удалит старые правила Tilda из .htaccess (это и вызывало белый экран)<br>
    2. Переместит файлы сайта на нужное место<br>
    После успеха — скрипт сам удалит себя.
  </p>

  <?php if ($siteFolder): ?>
  <div class="info">
    ✅ <strong>Файлы сайта найдены</strong> в папке <code><?= htmlspecialchars(basename($siteFolder)) ?>/</code><br>
    Нажмите кнопку — они будут перемещены в нужное место за 5 секунд.
  </div>
  <?php elseif ($rootHasIndex && $rootHasCss): ?>
  <div class="info">
    ✅ <strong>index.html и css/ уже в правильном месте</strong><br>
    Нажмите кнопку — скрипт только обновит .htaccess и устранит редиректы Tilda.
  </div>
  <?php else: ?>
  <div class="warn">
    ⚠️ Файлы сайта не найдены. Нажмите кнопку — увидим что происходит на сервере.
  </div>
  <?php endif; ?>

  <a href="?run=1" class="btn">▶ Запустить исправление</a>

<?php else: ?>

  <?php if ($ok): ?>
    <div class="ok-card">
      <div style="font-size:56px">🎉</div>
      <h1 style="color:#4cdb8a;margin:12px 0 8px">Готово! Сайт установлен</h1>
      <p style="color:#86efb0;margin-bottom:20px;font-size:15px">
        Все файлы на месте. .htaccess обновлён. Редиректы Tilda удалены.
      </p>
      <a href="/" class="btn green" style="font-size:17px">🌐 Открыть pacificstar.ru →</a>
    </div>
  <?php elseif (!empty($diagnosis)): ?>
    <div class="err-card">
      <h1 style="color:#f87171;margin-bottom:10px">⚠️ Файлы не найдены</h1>
      <p style="font-size:14px;color:#fca5a5;margin-bottom:12px">
        Сделайте скриншот и отправьте разработчику — он скажет что делать дальше.
      </p>
      <strong style="font-size:13px;color:#f4d07a">Что сейчас в public_html:</strong>
      <div class="diag"><?= implode('<br>', array_map('htmlspecialchars', $diagnosis)) ?></div>
    </div>
  <?php else: ?>
    <div class="err-card">
      <h1 style="color:#f87171;margin-bottom:10px">❌ Не удалось переместить файлы</h1>
      <p style="font-size:14px;color:#fca5a5">Сделайте скриншот и отправьте разработчику.</p>
    </div>
  <?php endif; ?>

  <?php if (!empty($log)): ?>
  <div class="log">
    <?php foreach ($log as [$icon, $text]): ?>
      <div class="log-row">
        <?= $icon ?> <?= htmlspecialchars($text) ?>
      </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>

<?php endif; ?>

</div>
</body>
</html>
