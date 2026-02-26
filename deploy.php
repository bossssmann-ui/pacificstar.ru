<?php
/**
 * Pacific Star — Установщик v5
 * Загрузите этот файл в public_html ТАК ЖЕ как грузили hello.html
 * Откройте pacificstar.ru/deploy.php и нажмите кнопку
 */
ini_set('display_errors', '1');
error_reporting(E_ALL);
set_time_limit(180);
header('Content-Type: text/html; charset=utf-8');

define('BRANCH', 'copilot/refactor-site-description');
define('RAW',    'https://raw.githubusercontent.com/bossssmann-ui/pacificstar.ru/' . BRANCH . '/');
define('ROOT',   rtrim(__DIR__, '/\\') . '/');

$FILES = [
    '.htaccess'           => '.htaccess',
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
];

function fetch_url($url) {
    // Попытка 1: curl
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'PacificStar-Deploy/5.0',
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body !== false && $code === 200 && strlen($body) > 10) return $body;
    }
    // Попытка 2: file_get_contents
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create(['http'=>['timeout'=>30,'user_agent'=>'PacificStar-Deploy/5.0'],
                                      'ssl'=>['verify_peer'=>false]]);
        $body = @file_get_contents($url, false, $ctx);
        if ($body !== false && strlen($body) > 10) return $body;
    }
    return false;
}

$run     = isset($_GET['run']);
$results = [];
$ok = $fail = 0;

if ($run) {
    // Проверить доступность сети
    $test = fetch_url(RAW . 'hello.html');
    if ($test === false) {
        $fail++;
        $results[] = ['❌', 'Нет доступа к интернету с сервера',
            'Timeweb заблокировал исходящие запросы. Напишите в поддержку: включите curl или allow_url_fopen для аккаунта ct38770', false];
    } else {
        // Создать папки
        foreach (['css','js','img','img/partners'] as $d) {
            if (!is_dir(ROOT.$d)) mkdir(ROOT.$d, 0755, true);
        }

        // Скачать и записать файлы
        foreach ($FILES as $dest => $src) {
            $content = fetch_url(RAW . $src);
            if ($content === false) {
                $results[] = ['❌', $dest, 'Ошибка скачивания', false];
                $fail++; continue;
            }
            if (file_put_contents(ROOT.$dest, $content) === false) {
                $results[] = ['❌', $dest, 'Нет прав на запись', false];
                $fail++; continue;
            }
            $kb = round(strlen($content)/1024, 1);
            $results[] = ['✅', $dest, "{$kb} KB", true];
            $ok++;
        }

        // Удалить мусор
        foreach (['fix.php','installer.php','htaccess-only.php','phptest.php',
                  'info.php','test.html','hello.html','setup.php',
                  'site-pacificstar.zip','deploy.php'] as $f) {
            if (file_exists(ROOT.$f)) @unlink(ROOT.$f);
        }
        foreach (glob(ROOT.'site-pacificstar*', GLOB_ONLYDIR) as $d) {
            array_map('unlink', glob($d.'/*'));
            @rmdir($d);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Установка сайта</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
  background:#071525;min-height:100vh;display:flex;align-items:center;
  justify-content:center;padding:20px;color:#d0e8f8}
.card{background:#0e2236;border-radius:16px;padding:36px;max-width:600px;
  width:100%;box-shadow:0 8px 48px rgba(0,0,0,.7)}
h1{font-size:22px;color:#fff;margin-bottom:12px}
p{color:#5fa3c8;font-size:14px;line-height:1.8;margin-bottom:20px}
.btn{display:block;width:100%;background:#f59e0b;color:#000;font-weight:800;
  font-size:22px;padding:20px;border-radius:10px;text-align:center;
  text-decoration:none;border:none;cursor:pointer;transition:.2s}
.btn:hover{background:#fbbf24}
.btn.g{background:#16a34a;color:#fff;font-size:18px;margin-top:20px}
.log{background:#060f1a;border-radius:8px;padding:14px;margin-top:16px;
  max-height:380px;overflow-y:auto}
.row{display:flex;gap:10px;font-size:13px;font-family:monospace;
  padding:3px 0;border-bottom:1px solid #0d2a40}
.n{color:#93c5fd;flex:0 0 170px;white-space:nowrap;overflow:hidden}
.m{color:#94a3b8}
.ok{background:#0a2e1a;border:2px solid #16a34a;border-radius:12px;
  padding:32px;text-align:center;margin-bottom:16px}
.er{background:#2e0a0a;border:2px solid #dc2626;border-radius:12px;
  padding:24px;margin-bottom:16px}
.nums{display:flex;gap:12px;margin:12px 0}
.n2{flex:1;background:#091929;border-radius:8px;padding:12px;text-align:center;font-size:12px}
.n2 b{display:block;font-size:28px;font-weight:800}
</style>
</head>
<body>
<?php if (!$run): ?>
<div class="card">
  <h1>🚀 Установщик Pacific Star</h1>
  <p>
    Нажмите кнопку — скрипт автоматически:<br>
    ✅ Удалит старый сайт Tilda (белый экран)<br>
    ✅ Установит все 15 файлов нашего сайта<br>
    ✅ Исправит настройки сервера (.htaccess)<br>
    ✅ Удалит себя — останется только ваш сайт
  </p>
  <a href="?run=1" class="btn">▶ Установить сайт</a>
</div>
<?php elseif ($fail === 0 && $ok > 0): ?>
<div class="card">
  <div class="ok">
    <div style="font-size:60px;margin-bottom:8px">🎉</div>
    <h1 style="color:#4ade80;font-size:28px;margin-bottom:8px">Сайт установлен!</h1>
    <p style="color:#86efac"><?=$ok?> файлов установлено. Редиректы Tilda удалены.</p>
  </div>
  <a href="/" class="btn g">🌐 Открыть pacificstar.ru →</a>
</div>
<?php else: ?>
<div class="card">
  <div class="er">
    <h1 style="color:#f87171;margin-bottom:8px">
      <?= $fail>0 ? '⚠️ Часть файлов не установилась' : '❌ Нет доступа к интернету' ?>
    </h1>
    <p style="color:#fca5a5;font-size:13px">
      Сделайте скриншот этой страницы и отправьте разработчику.
    </p>
  </div>
  <div class="nums">
    <div class="n2"><b style="color:#4ade80"><?=$ok?></b>установлено</div>
    <div class="n2"><b style="color:#f87171"><?=$fail?></b>ошибок</div>
  </div>
  <?php if(!empty($results)): ?>
  <div class="log">
    <?php foreach($results as [$i,$n,$m]): ?>
    <div class="row"><span><?=$i?></span><span class="n"><?=htmlspecialchars($n)?></span><span class="m"><?=htmlspecialchars($m)?></span></div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</div>
<?php endif; ?>
</body>
</html>
