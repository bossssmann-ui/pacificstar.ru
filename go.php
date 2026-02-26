<?php
// go.php — Pacific Star auto-installer
// Upload this ONE file to public_html (like hello.html), then open pacificstar.ru/go.php
// It automatically fixes everything and redirects to the real site.

ini_set('display_errors', '1');
error_reporting(E_ALL);

$root = __DIR__;
$base = 'https://raw.githubusercontent.com/bossssmann-ui/pacificstar.ru/copilot/refactor-site-description/';

$log = [];

function fetch($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT      => 'Mozilla/5.0',
        ]);
        $r = curl_exec($ch);
        curl_close($ch);
        if ($r) return $r;
    }
    return @file_get_contents($url) ?: false;
}

function put($path, $content) {
    return file_put_contents($path, $content) !== false;
}

// ── Step 1: Fix .htaccess ────────────────────────────────────────────────────
$ht = "# Pacific Star — no Tilda redirects\nOptions -Indexes\nDirectoryIndex index.html index.php\n";
$log[] = put($root.'/.htaccess', $ht) ? 'OK .htaccess' : 'ERR .htaccess';

// ── Step 2: Download and overwrite all site files ───────────────────────────
$files = [
    'index.html', 'about.html', 'services.html', 'contacts.html',
    'remote-regions.html', 'account.html', 'integrations.html', 'privacy.html',
    'css/style.css',
    'js/main.js', 'js/map.js', 'js/currency.js', 'js/calculator.js', 'js/i18n.js',
];

foreach (['css','js','img/partners'] as $dir) {
    if (!is_dir($root.'/'.$dir)) mkdir($root.'/'.$dir, 0755, true);
}

$ok = 0; $fail = 0;
foreach ($files as $f) {
    $content = fetch($base . $f);
    if ($content && put($root.'/'.$f, $content)) { $ok++; $log[] = "OK $f"; }
    else { $fail++; $log[] = "ERR $f"; }
}

// ── Step 3: Self-delete ──────────────────────────────────────────────────────
register_shutdown_function(function() { @unlink(__FILE__); });

// ── Step 4: Redirect if all OK, else show log ────────────────────────────────
if ($fail === 0) {
    header('Location: https://pacificstar.ru?installed=1');
    exit;
}
?><!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>Pacific Star — установка</title>
<style>
body{font:16px sans-serif;max-width:600px;margin:40px auto;padding:20px;background:#f5f5f5}
h2{color:#c00}.ok{color:green}.err{color:red}
a{display:inline-block;margin-top:20px;padding:12px 24px;background:#1a3d5c;color:#fff;border-radius:6px;text-decoration:none}
</style></head>
<body>
<h2>⚠️ Часть файлов не загрузилась</h2>
<p>Возможно, сервер не может подключиться к GitHub. Скажите службе поддержки Timeweb:<br>
<em>«Включите allow_url_fopen и curl для домена pacificstar.ru»</em></p>
<pre style="background:#fff;padding:12px;border:1px solid #ddd">
<?php foreach ($log as $l) echo (str_starts_with($l,'OK') ? '<span class="ok">' : '<span class="err">') . htmlspecialchars($l) . "</span>\n"; ?>
</pre>
<p>Успешно: <?= $ok ?> / <?= count($files) ?></p>
<a href="https://pacificstar.ru">Попробовать открыть сайт</a>
</body></html>
