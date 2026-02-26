<?php
// check.php — Shows exactly what's in public_html and what index.html contains
header('Content-Type: text/html; charset=utf-8');
$root = __DIR__;
?><!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>Диагностика</title>
<style>body{font:16px/1.5 sans-serif;max-width:900px;margin:20px auto;padding:0 20px}
h2{color:#1a3d5c}pre{background:#f4f4f4;padding:15px;overflow:auto;border-radius:6px}
.ok{color:green;font-weight:bold}.bad{color:red;font-weight:bold}.warn{color:orange;font-weight:bold}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#1a3d5c;color:#fff}.card{border:1px solid #ddd;border-radius:8px;padding:15px;margin:15px 0}
</style></head><body>
<h1>🔍 Диагностика сервера</h1>

<?php
// 1. Check what index.html actually is
$idx = $root . '/index.html';
echo '<div class="card"><h2>1. Что такое index.html?</h2>';
if (!file_exists($idx)) {
    echo '<p class="bad">❌ index.html НЕ НАЙДЕН!</p>';
} else {
    $content = file_get_contents($idx, false, null, 0, 500);
    $isTilda = stripos($content, 'tilda') !== false || stripos($content, 'Ошибочно') !== false;
    $isOurs  = stripos($content, 'Pacific Star') !== false || stripos($content, 'pacificstar') !== false;
    if ($isTilda) {
        echo '<p class="bad">❌ СТАРЫЙ TILDA index.html — нужно перезаписать!</p>';
    } elseif ($isOurs) {
        echo '<p class="ok">✅ НАШ index.html — Pacific Star. Всё правильно!</p>';
    } else {
        echo '<p class="warn">⚠️ Неизвестный index.html — проверьте содержимое ниже</p>';
    }
    echo '<pre>' . htmlspecialchars(substr($content, 0, 300)) . '</pre>';
}
echo '</div>';

// 2. Check .htaccess
$htaccess = $root . '/.htaccess';
echo '<div class="card"><h2>2. Что в .htaccess?</h2>';
if (!file_exists($htaccess)) {
    echo '<p class="warn">⚠️ .htaccess не найден (это нормально)</p>';
} else {
    $ha = file_get_contents($htaccess);
    $hasTilda = stripos($ha, 'tilda') !== false || stripos($ha, 'RewriteRule') !== false;
    if ($hasTilda) {
        echo '<p class="bad">❌ В .htaccess есть правила Tilda — нужно очистить!</p>';
    } else {
        echo '<p class="ok">✅ .htaccess чистый — нет правил Tilda</p>';
    }
    echo '<pre>' . htmlspecialchars($ha) . '</pre>';
}
echo '</div>';

// 3. List all files
echo '<div class="card"><h2>3. Файлы в public_html</h2>';
$files = array_diff(scandir($root), ['.', '..']);
echo '<table><tr><th>Файл/Папка</th><th>Размер</th><th>Изменён</th></tr>';
foreach ($files as $f) {
    $fp = $root . '/' . $f;
    $isDir = is_dir($fp);
    $size = $isDir ? '📁 папка' : number_format(filesize($fp)) . ' байт';
    $mtime = date('d.m.Y H:i', filemtime($fp));
    echo "<tr><td>" . ($isDir ? "📁 " : "📄 ") . htmlspecialchars($f) . "</td><td>$size</td><td>$mtime</td></tr>";
}
echo '</table></div>';

// 4. Fix button
echo '<div class="card" style="background:#fff3cd">
<h2>4. Действие</h2>';
$idx_content = file_exists($idx) ? file_get_contents($idx, false, null, 0, 200) : '';
$needsFix = stripos($idx_content, 'tilda') !== false || !$isOurs;
if ($needsFix || (isset($hasTilda) && $hasTilda)) {
    echo '<p class="bad">Найдены проблемы — нужно запустить исправление</p>
    <form method="post">
    <button type="submit" name="action" value="fix" style="background:#dc3545;color:#fff;padding:12px 30px;font-size:18px;border:none;border-radius:6px;cursor:pointer">
    🔧 Перезаписать index.html и .htaccess прямо сейчас</button>
    </form>';
} else {
    echo '<p class="ok">✅ Всё выглядит правильно! Попробуйте открыть <a href="https://pacificstar.ru">pacificstar.ru</a> в режиме инкогнито (Ctrl+Shift+N)</p>';
}
echo '</div>';

// 5. Handle fix action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'fix') {
    echo '<div class="card" style="background:#d4edda"><h2>5. Результат исправления</h2>';
    
    // Overwrite .htaccess
    $htaccessContent = "# Pacific Star — без правил Tilda\nOptions -Indexes\nDirectoryIndex index.html index.php\n";
    $r1 = file_put_contents($root . '/.htaccess', $htaccessContent);
    echo ($r1 !== false) ? '<p class="ok">✅ .htaccess перезаписан</p>' : '<p class="bad">❌ .htaccess не удалось перезаписать</p>';
    
    // Download our index.html from GitHub
    $url = 'https://raw.githubusercontent.com/bossssmann-ui/pacificstar.ru/copilot/refactor-site-description/index.html';
    $content = @file_get_contents($url);
    if (!$content && function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_SSL_VERIFYPEER => false]);
        $content = curl_exec($ch);
        curl_close($ch);
    }
    if ($content && stripos($content, 'Pacific Star') !== false) {
        $r2 = file_put_contents($root . '/index.html', $content);
        echo ($r2 !== false) ? '<p class="ok">✅ index.html перезаписан нашим файлом</p>' : '<p class="bad">❌ index.html не удалось записать</p>';
    } else {
        echo '<p class="bad">❌ Не удалось скачать index.html с GitHub. Ошибка сети.</p>';
    }
    
    echo '<br><a href="https://pacificstar.ru" style="background:#28a745;color:#fff;padding:12px 30px;font-size:18px;border-radius:6px;text-decoration:none">🌐 Открыть pacificstar.ru</a>';
    echo '</div>';
}
?>
</body></html>
