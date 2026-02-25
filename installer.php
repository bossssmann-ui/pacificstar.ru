<?php
/**
 * Pacific Star — Автоустановщик сайта
 * Загружает все файлы сайта с GitHub прямо на сервер Timeweb.
 * Загрузить этот файл в public_html, открыть в браузере — готово.
 */
error_reporting(E_ALL);
ini_set('display_errors', '1');
set_time_limit(120);

$BRANCH = 'copilot/refactor-site-description';
$REPO   = 'bossssmann-ui/pacificstar.ru';
$BASE   = "https://raw.githubusercontent.com/{$REPO}/{$BRANCH}/";
$ROOT   = __DIR__ . '/';

// Все файлы сайта (источник → куда сохранить)
$FILES = [
    'index.html'          => 'index.html',
    'about.html'          => 'about.html',
    'services.html'       => 'services.html',
    'contacts.html'       => 'contacts.html',
    'remote-regions.html' => 'remote-regions.html',
    'account.html'        => 'account.html',
    'integrations.html'   => 'integrations.html',
    'privacy.html'        => 'privacy.html',
    'css/style.css'       => 'css/style.css',
    'js/main.js'          => 'js/main.js',
    'js/map.js'           => 'js/map.js',
    'js/currency.js'      => 'js/currency.js',
    'js/calculator.js'    => 'js/calculator.js',
    'js/i18n.js'          => 'js/i18n.js',
    '.htaccess'           => '.htaccess',
];

$HTACCESS = <<<'EOT'
Options -Indexes
DirectoryIndex index.html index.php
EOT;

// Запуск установки
$run    = isset($_GET['run']);
$errors = [];
$done   = [];

if ($run) {
    // Создать папки
    foreach (['css', 'js', 'img/partners'] as $dir) {
        if (!is_dir($ROOT . $dir)) {
            mkdir($ROOT . $dir, 0755, true);
        }
    }

    // Сначала всегда перезаписать .htaccess
    file_put_contents($ROOT . '.htaccess', $HTACCESS);
    $done[] = '.htaccess — перезаписан (редиректы Tilda удалены)';

    // Проверить allow_url_fopen
    if (!ini_get('allow_url_fopen')) {
        die('<h2 style="color:red">allow_url_fopen выключен. Свяжитесь с поддержкой Timeweb и попросите включить allow_url_fopen.</h2>');
    }

    // Загрузить каждый файл
    foreach ($FILES as $src => $dest) {
        if ($dest === '.htaccess') continue; // уже записан выше
        $url     = $BASE . $src;
        $content = @file_get_contents($url);
        if ($content === false) {
            $errors[] = "❌ Не удалось скачать: {$src}";
        } else {
            file_put_contents($ROOT . $dest, $content);
            $done[] = "✅ {$dest}";
        }
    }

    // Удалить себя после успеха
    if (empty($errors)) {
        @unlink(__FILE__);
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pacific Star — Установка сайта</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:sans-serif;background:#0d1b2a;color:#e0eaf5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#1a2f45;border-radius:12px;padding:40px;max-width:640px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.5)}
h1{font-size:24px;margin-bottom:8px;color:#fff}
.sub{color:#7fa8c9;margin-bottom:28px;font-size:15px}
.btn{display:inline-block;background:#f4a007;color:#000;font-weight:700;font-size:18px;padding:16px 36px;border-radius:8px;text-decoration:none;cursor:pointer;border:none;width:100%;text-align:center;margin-bottom:16px}
.btn:hover{background:#ffc234}
.log{background:#0d1b2a;border-radius:8px;padding:20px;margin-top:20px;max-height:360px;overflow-y:auto;font-size:13px;line-height:1.8}
.log .ok{color:#4cdb8a}
.log .err{color:#f76b6b}
.success{background:#0d3320;border:2px solid #4cdb8a;border-radius:10px;padding:28px;text-align:center;margin-top:24px}
.success h2{color:#4cdb8a;font-size:26px;margin-bottom:12px}
.success a{color:#f4a007;font-size:18px;font-weight:700;text-decoration:none}
.fail{background:#3d0d0d;border:2px solid #f76b6b;border-radius:10px;padding:20px;margin-top:16px}
.steps{margin-top:20px;padding:0 0 0 20px}
.steps li{margin-bottom:8px;font-size:14px;color:#b0c8e0}
.warning{background:#2a1f00;border:1px solid #f4a007;border-radius:8px;padding:16px;margin-bottom:20px;font-size:14px;color:#f4d07a}
</style>
</head>
<body>
<div class="card">

<?php if (!$run): ?>

  <h1>🚀 Установка сайта Pacific Star</h1>
  <p class="sub">Этот скрипт скачает все файлы сайта с GitHub и разместит их на вашем сервере.</p>

  <div class="warning">
    ⚠️ <strong>Перед запуском:</strong> убедитесь что в папке <code>public_html</code> нет важных файлов — они будут перезаписаны.
  </div>

  <a href="?run=1" class="btn">▶ Запустить установку</a>

  <p style="font-size:13px;color:#7fa8c9;text-align:center">Установка займёт 30–60 секунд</p>

<?php else: ?>

  <?php if (empty($errors)): ?>

    <div class="success">
      <h2>🎉 Сайт установлен!</h2>
      <p style="color:#b0e8c8;margin-bottom:20px">Все <?= count($done) ?> файлов загружены успешно.</p>
      <a href="/">➜ Открыть pacificstar.ru</a>
    </div>

    <div class="log">
      <?php foreach ($done as $line): ?>
        <div class="ok"><?= htmlspecialchars($line) ?></div>
      <?php endforeach; ?>
    </div>

  <?php else: ?>

    <h1 style="color:#f76b6b">⚠️ Возникли ошибки</h1>
    <p class="sub">Часть файлов не удалось загрузить. Что удалось — уже на месте.</p>

    <div class="fail">
      <?php foreach ($errors as $e): ?>
        <div class="err"><?= htmlspecialchars($e) ?></div>
      <?php endforeach; ?>
    </div>

    <div class="log">
      <?php foreach ($done as $line): ?>
        <div class="ok"><?= htmlspecialchars($line) ?></div>
      <?php endforeach; ?>
    </div>

    <div style="margin-top:20px;color:#b0c8e0;font-size:14px">
      <strong>Что делать:</strong><br>
      Напишите в поддержку Timeweb: «Включите allow_url_fopen и разрешите исходящие HTTP-запросы».<br>
      Или напишите разработчику — решим через другой метод.
    </div>

  <?php endif; ?>

<?php endif; ?>

</div>
</body>
</html>
