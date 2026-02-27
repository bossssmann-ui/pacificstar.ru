<?php
// check.php — Diagnostic + one-click overwrite of Tilda files
ini_set('display_errors', '1');
error_reporting(E_ALL);
header('Content-Type: text/html; charset=utf-8');
$root = __DIR__;

// Helper: fetch URL (curl → fopen fallback)
function fetchUrl($url) {
    $content = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT      => 'Mozilla/5.0',
        ]);
        $content = curl_exec($ch);
        curl_close($ch);
    }
    if (!$content) {
        $content = @file_get_contents($url);
    }
    return $content ?: false;
}

// Handle fix action FIRST (before any output buffering issues)
$fixResult = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'fix') {
    $base = 'https://raw.githubusercontent.com/bossssmann-ui/pacificstar.ru/copilot/refactor-site-description/';

    // 1. Overwrite .htaccess with clean version (no redirect to Tilda)
    $htContent = "# Pacific Star — clean config, no Tilda redirects\n" .
                 "Options -Indexes\n" .
                 "DirectoryIndex index.html index.php\n";
    $fixResult[] = file_put_contents($root . '/.htaccess', $htContent) !== false
        ? '✅ .htaccess перезаписан (правила Tilda удалены)'
        : '❌ .htaccess не удалось записать — проверьте права на папку';

    // 2. Download and overwrite index.html
    $idx = fetchUrl($base . 'index.html');
    if ($idx && stripos($idx, 'Pacific Star') !== false) {
        $fixResult[] = file_put_contents($root . '/index.html', $idx) !== false
            ? '✅ index.html перезаписан нашим файлом Pacific Star'
            : '❌ index.html не удалось записать — проверьте права на папку';
    } else {
        $fixResult[] = '❌ Не удалось скачать index.html с GitHub (нет доступа к интернету с сервера)';
    }
}
?><!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Диагностика — Pacific Star</title>
<style>
body{font:16px/1.6 sans-serif;max-width:860px;margin:20px auto;padding:0 20px;color:#222}
h1{color:#1a3d5c}h2{color:#1a3d5c;margin-top:0}
.card{border:1px solid #ddd;border-radius:8px;padding:18px;margin:16px 0}
.ok{color:#28a745;font-weight:bold}.bad{color:#dc3545;font-weight:bold}.warn{color:#fd7e14;font-weight:bold}
pre{background:#f4f4f4;padding:12px;overflow:auto;border-radius:4px;font-size:13px;white-space:pre-wrap}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px 10px;text-align:left}
th{background:#1a3d5c;color:#fff}
.btn-fix{background:#dc3545;color:#fff;padding:14px 32px;font-size:18px;border:none;border-radius:6px;cursor:pointer;margin-top:10px}
.btn-open{display:inline-block;background:#28a745;color:#fff;padding:14px 32px;font-size:18px;border-radius:6px;text-decoration:none;margin-top:12px}
.result-box{background:#d4edda;border:1px solid #c3e6cb;border-radius:8px;padding:18px;margin:16px 0}
.result-box p{margin:6px 0}
</style>
</head>
<body>
<h1>🔍 Диагностика — Pacific Star</h1>

<?php if (!empty($fixResult)): ?>
<div class="result-box">
  <h2>Результат исправления</h2>
  <?php foreach ($fixResult as $r): ?>
  <p><?= htmlspecialchars($r) ?></p>
  <?php endforeach; ?>
  <br>
  <a class="btn-open" href="https://pacificstar.ru" target="_blank">🌐 Открыть pacificstar.ru</a>
  <p style="margin-top:12px;color:#666;font-size:14px">Если сайт всё ещё не открылся — нажмите Ctrl+Shift+N (режим инкогнито) и откройте там.</p>
</div>
<?php endif; ?>

<?php
// --- Diagnosis section ---
$idx       = $root . '/index.html';
$htaccess  = $root . '/.htaccess';

// 1. index.html
$isOurs   = false;
$isTilda  = false;
$idxSnip  = '';
echo '<div class="card"><h2>1. Что такое index.html на сервере?</h2>';
if (!file_exists($idx)) {
    echo '<p class="bad">❌ index.html не найден вообще</p>';
} else {
    $idxContent = file_get_contents($idx, false, null, 0, 600);
    $idxSnip    = substr($idxContent, 0, 300);
    $isTilda    = stripos($idxContent, 'tilda') !== false;
    $isOurs     = stripos($idxContent, 'Pacific Star') !== false;
    if ($isTilda) {
        echo '<p class="bad">❌ СТАРЫЙ Tilda index.html — именно он и вызывает белый экран с логотипом Tilda!</p>';
    } elseif ($isOurs) {
        echo '<p class="ok">✅ НАШ index.html (Pacific Star) — уже на месте</p>';
    } else {
        echo '<p class="warn">⚠️ Неизвестный index.html (не Tilda, не наш)</p>';
    }
    echo '<pre>' . htmlspecialchars($idxSnip) . '</pre>';
}
echo '</div>';

// 2. .htaccess
$hasTilda = false;
echo '<div class="card"><h2>2. Что в .htaccess?</h2>';
if (!file_exists($htaccess)) {
    echo '<p class="warn">⚠️ .htaccess не найден</p>';
} else {
    $ha       = file_get_contents($htaccess);
    $hasTilda = stripos($ha, 'tilda') !== false || stripos($ha, 'RewriteRule') !== false;
    if ($hasTilda) {
        echo '<p class="bad">❌ В .htaccess есть правила Tilda — они перенаправляют посетителей на Tilda!</p>';
    } else {
        echo '<p class="ok">✅ .htaccess чистый</p>';
    }
    echo '<pre>' . htmlspecialchars($ha) . '</pre>';
}
echo '</div>';

// 3. File listing
echo '<div class="card"><h2>3. Все файлы в public_html</h2>';
$entries = array_diff(scandir($root), ['.', '..']);
echo '<table><tr><th>Файл / Папка</th><th>Размер</th><th>Изменён</th></tr>';
foreach ($entries as $f) {
    $fp    = $root . '/' . $f;
    $isDir = is_dir($fp);
    $sz    = $isDir ? '📁 папка' : number_format(filesize($fp)) . ' б';
    $mt    = date('d.m.Y H:i', filemtime($fp));
    echo "<tr><td>" . ($isDir ? "📁 " : "📄 ") . htmlspecialchars($f) . "</td><td>$sz</td><td>$mt</td></tr>";
}
echo '</table></div>';

// 4. Fix button — ALWAYS shown
?>
<div class="card" style="background:#fff8e1;border-color:#ffc107">
<h2>4. Исправить</h2>
<p>Нажмите кнопку — она перезапишет <code>index.html</code> и <code>.htaccess</code> нашими файлами напрямую с GitHub.</p>
<p>Это исправит белый экран с логотипом Tilda.</p>
<form method="post">
  <button class="btn-fix" type="submit" name="action" value="fix">
    🔧 Перезаписать index.html и .htaccess
  </button>
</form>
</div>

</body>
</html>
