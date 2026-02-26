<?php
/**
 * Pacific Star — Авто-установщик сайта v4
 * =========================================
 * Загрузите ЭТОТ ОДИН ФАЙЛ в public_html (так же, как грузили hello.html).
 * Откройте pacificstar.ru/deploy.php и нажмите кнопку.
 * Скрипт сам скачает все файлы сайта и установит их.
 */
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);
set_time_limit(180);
header('Content-Type: text/html; charset=utf-8');

// ── Конфигурация ─────────────────────────────────────────────────────────────
define('BRANCH', 'copilot/refactor-site-description');
define('RAW_BASE', 'https://raw.githubusercontent.com/bossssmann-ui/pacificstar.ru/' . BRANCH . '/');
define('ROOT', rtrim(__DIR__, '/\\') . '/');

// Список файлов для скачивания [путь на сервере => путь в GitHub]
$FILES = [
    // .htaccess — первым делом (убивает редиректы Tilda)
    '.htaccess'              => '.htaccess',
    // HTML страницы
    'index.html'             => 'index.html',
    'about.html'             => 'about.html',
    'services.html'          => 'services.html',
    'contacts.html'          => 'contacts.html',
    'remote-regions.html'    => 'remote-regions.html',
    'account.html'           => 'account.html',
    'integrations.html'      => 'integrations.html',
    'privacy.html'           => 'privacy.html',
    // CSS
    'css/style.css'          => 'css/style.css',
    // JS
    'js/main.js'             => 'js/main.js',
    'js/map.js'              => 'js/map.js',
    'js/currency.js'         => 'js/currency.js',
    'js/calculator.js'       => 'js/calculator.js',
    'js/i18n.js'             => 'js/i18n.js',
];

// ── Папки которые нужно создать ──────────────────────────────────────────────
$DIRS = ['css', 'js', 'img', 'img/partners'];

// ── Логика ───────────────────────────────────────────────────────────────────
$run = (isset($_GET['run']) && $_GET['run'] === '1');
$results = [];
$success = 0;
$failed  = 0;

if ($run) {
    // 0. Проверить allow_url_fopen
    if (!ini_get('allow_url_fopen')) {
        $results[] = ['❌', 'allow_url_fopen', 'Выключен на сервере. Обратитесь в поддержку Timeweb.', false];
        goto done;
    }

    // 1. Создать папки
    foreach ($DIRS as $dir) {
        $path = ROOT . $dir;
        if (!is_dir($path)) {
            $results[] = mkdir($path, 0755, true)
                ? ['📁', $dir . '/', 'Папка создана', true]
                : ['❌', $dir . '/', 'Не удалось создать папку', false];
        }
    }

    // 2. Скачать и записать каждый файл
    $ctx = stream_context_create([
        'http' => [
            'timeout'         => 30,
            'follow_location' => 1,
            'max_redirects'   => 5,
            'header'          => "User-Agent: Mozilla/5.0 PacificStarDeploy/4.0\r\n",
        ],
        'ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ],
    ]);

    foreach ($FILES as $dest => $src) {
        $url     = RAW_BASE . $src;
        $destPath = ROOT . $dest;
        $content = @file_get_contents($url, false, $ctx);

        if ($content === false) {
            $results[] = ['❌', $dest, 'Не удалось скачать с GitHub', false];
            $failed++;
            continue;
        }
        if (strlen($content) < 10) {
            $results[] = ['⚠️', $dest, 'Файл пустой или слишком маленький', false];
            $failed++;
            continue;
        }
        if (file_put_contents($destPath, $content) === false) {
            $results[] = ['❌', $dest, 'Скачан, но не записан на диск', false];
            $failed++;
            continue;
        }
        $kb = round(strlen($content) / 1024, 1);
        $results[] = ['✅', $dest, "Записан ({$kb} KB)", true];
        $success++;
    }

    // 3. Удалить мусорные файлы от предыдущих попыток
    $trash = ['fix.php','installer.php','htaccess-only.php','phptest.php',
              'info.php','test.html','hello.html','setup.php','site-pacificstar.zip'];
    foreach ($trash as $f) {
        if (file_exists(ROOT . $f)) @unlink(ROOT . $f);
    }
    // Удалить ZIP-подпапку если ещё есть
    foreach (glob(ROOT . 'site-pacificstar*', GLOB_ONLYDIR) as $d) {
        array_map('unlink', glob($d . '/*'));
        @rmdir($d);
    }

    // 4. Самоудаление при успехе
    if ($failed === 0) {
        @unlink(__FILE__);
    }
}
done:
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Установка Pacific Star</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
  background:#071525;min-height:100vh;display:flex;align-items:center;
  justify-content:center;padding:20px;color:#d0e8f8}
.wrap{max-width:660px;width:100%}
.card{background:#0e2236;border-radius:16px;padding:40px;
  box-shadow:0 8px 48px rgba(0,0,0,.7);margin-bottom:16px}
h1{font-size:22px;color:#fff;margin-bottom:8px}
.lead{color:#5fa3c8;font-size:14px;line-height:1.7;margin-bottom:28px}
.btn{display:block;width:100%;background:#f59e0b;color:#000;font-weight:800;
  font-size:20px;padding:18px;border-radius:10px;text-align:center;
  text-decoration:none;cursor:pointer;border:none;transition:background .2s}
.btn:hover{background:#fbbf24}
.btn.green{background:#16a34a;color:#fff;font-size:17px}
.check{background:#091929;border-radius:8px;padding:16px 18px;
  margin-bottom:20px;font-size:13px;line-height:1.8}
.check b{color:#5fa3c8}
.log{background:#060f1a;border-radius:8px;padding:16px 18px;
  margin-top:20px;max-height:420px;overflow-y:auto}
.row{display:flex;gap:10px;font-size:13px;font-family:monospace;
  padding:4px 0;border-bottom:1px solid #0d2a40;line-height:1.6}
.row .name{color:#93c5fd;flex:0 0 180px}
.row .msg{color:#94a3b8}
.ok-box{background:#0a2e1a;border:2px solid #16a34a;border-radius:14px;
  padding:36px;text-align:center;margin-bottom:20px}
.err-box{background:#2e0a0a;border:2px solid #dc2626;border-radius:12px;
  padding:24px;margin-top:16px}
.stat{display:flex;gap:12px;margin:16px 0}
.stat-item{flex:1;background:#091929;border-radius:8px;padding:14px;
  text-align:center;font-size:13px}
.stat-num{font-size:32px;font-weight:800;display:block}
.green-num{color:#4ade80}
.red-num{color:#f87171}
</style>
</head>
<body>
<div class="wrap">

<?php if (!$run): ?>

<div class="card">
  <h1>🚀 Установщик сайта Pacific Star</h1>
  <p class="lead">
    Нажмите кнопку — скрипт автоматически:<br>
    1. Удалит старые настройки Tilda (которые вызывают белый экран)<br>
    2. Скачает все 14 файлов нашего сайта с GitHub<br>
    3. Разложит их в нужные папки<br>
    4. Удалит себя — на сайте останется только ваш сайт
  </p>
  <div class="check">
    <b>Что будет установлено:</b><br>
    📄 8 страниц сайта (Главная, О нас, Услуги, Контакты и др.)<br>
    🎨 Стили и оформление (css/style.css)<br>
    ⚙️ Интерактивные функции (карта, калькулятор, валюты, языки)<br>
    ⚙️ .htaccess — удалим правила Tilda
  </div>
  <a href="?run=1" class="btn">▶ Установить сайт</a>
</div>

<?php else: ?>

<?php if ($failed === 0 && $success > 0): ?>
  <div class="ok-box">
    <div style="font-size:64px;margin-bottom:8px">🎉</div>
    <h1 style="color:#4ade80;font-size:26px;margin-bottom:12px">Сайт установлен!</h1>
    <p style="color:#86efac;font-size:15px;margin-bottom:24px">
      <?= $success ?> файлов скачано и установлено.<br>
      Редиректы Tilda удалены. Сайт готов к работе.
    </p>
    <a href="/" class="btn green">🌐 Открыть pacificstar.ru →</a>
  </div>
<?php elseif ($failed > 0): ?>
  <div class="err-box" style="margin-bottom:16px">
    <h1 style="color:#f87171;margin-bottom:8px">⚠️ Некоторые файлы не установились</h1>
    <p style="color:#fca5a5;font-size:14px;margin-bottom:8px">
      Установлено: <?= $success ?>, ошибок: <?= $failed ?>.<br>
      Сделайте скриншот лога ниже и отправьте разработчику.
    </p>
  </div>
<?php else: ?>
  <div class="err-box" style="margin-bottom:16px">
    <h1 style="color:#f87171;margin-bottom:8px">❌ Установка не выполнена</h1>
    <p style="color:#fca5a5;font-size:14px">
      allow_url_fopen выключен на сервере.<br>
      Обратитесь в поддержку Timeweb: <b>support.timeweb.com</b><br>
      Спросите: «Включите allow_url_fopen для моего аккаунта ct38770»
    </p>
  </div>
<?php endif; ?>

<?php if (!empty($results)): ?>
<div class="card">
  <div class="stat">
    <div class="stat-item">
      <span class="stat-num green-num"><?= $success ?></span>
      файлов установлено
    </div>
    <div class="stat-item">
      <span class="stat-num <?= $failed > 0 ? 'red-num' : 'green-num' ?>"><?= $failed ?></span>
      ошибок
    </div>
  </div>
  <div class="log">
    <?php foreach ($results as [$icon, $name, $msg, $ok]): ?>
    <div class="row">
      <span><?= $icon ?></span>
      <span class="name"><?= htmlspecialchars($name) ?></span>
      <span class="msg"><?= htmlspecialchars($msg) ?></span>
    </div>
    <?php endforeach; ?>
  </div>
</div>
<?php endif; ?>

<?php endif; ?>

</div>
</body>
</html>
