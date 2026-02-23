# Как дать Copilot прямой доступ к Tilda
## Пошаговое руководство

---

## Как это работает в двух словах

```
Вы → Copilot → GitHub репозиторий → GitHub Actions → Tilda (автоматически)
                                   ↓
                             GitHub Pages (CDN)
```

1. Вы говорите мне что изменить  
2. Я пишу код и загружаю его в репозиторий GitHub  
3. GitHub Actions автоматически за 1–3 минуты:
   - публикует файлы на GitHub Pages (CDN)  
   - через Tilda API обновляет страницы сайта  
4. Сайт обновлён — без вашего участия  

---

## ШАГ 1 — Активировать GitHub Pages (5 минут, бесплатно)

> **Это обязательный шаг.** GitHub Pages — наш CDN для CSS и JS файлов.

1. Откройте [github.com/bossssmann-ui/pacificstar.ru](https://github.com/bossssmann-ui/pacificstar.ru)  
2. Перейдите в **Settings** (верхнее меню репозитория)  
3. В левом меню нажмите **Pages**  
4. В разделе **Source** выберите:
   - Branch: `copilot/refactor-site-description` (или `main` после слияния)  
   - Folder: `/ (root)`  
5. Нажмите **Save**  
6. Через 2–3 минуты сайт будет доступен по адресу:  
   ```
   https://bossssmann-ui.github.io/pacificstar.ru/
   ```

После этого все файлы CSS/JS будут доступны через быстрый CDN:
```
https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main/css/style.css
https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main/js/map.js
```

---

## ШАГ 2 — Добавить CDN-ссылки в Tilda (10 минут)

> Это нужно сделать **один раз**. После этого любые мои изменения в CSS/JS
> автоматически попадают на сайт Tilda.

### 2.1. Подключить глобальный CSS и JS

1. В Tilda откройте **Настройки сайта** → **Ещё** → **HTML-код**  
2. В поле **«Перед закрывающим тегом `</head>`»** вставьте:

```html
<!-- Pacific Star: глобальные стили (GitHub CDN) -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main/css/style.css">
```

3. В поле **«Перед закрывающим тегом `</body>`»** вставьте:

```html
<!-- Pacific Star: скрипты (GitHub CDN) -->
<script src="https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main/js/main.js" defer></script>
<script src="https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main/js/i18n.js" defer></script>
<script src="https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main/js/currency.js" defer></script>
<script src="https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main/js/calculator.js" defer></script>
```

4. Нажмите **Сохранить** и **Опубликовать сайт**.

### 2.2. Добавить карту (T123 HTML-блок)

На странице, где нужна карта:

1. Нажмите **+** → найдите **T123** → **Embed HTML code**  
2. Вставьте:

```html
<div id="routeMapContainer"
  style="width:100%;height:560px;border-radius:16px;overflow:hidden;background:#071522;">
</div>
<script src="https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main/js/map.js"></script>
```

3. Нажмите **Сохранить** → **Опубликовать страницу**.

---

## ШАГ 3 — Подключить Tilda API (продвинутая интеграция)

> **Требует тариф Tilda Business.**  
> Позволяет мне обновлять HTML-содержимое страниц Tilda напрямую через API.

### 3.1. Получить API-ключи в Tilda

1. **Настройки сайта** → **Экспорт** → **API-интеграция**  
2. Нажмите **«Сгенерировать ключи»**  
3. Запомните (или скопируйте):
   - `publickey` — можно показывать  
   - `secretkey` — **строго секретный**, никому не показывать в открытую  
4. Узнайте **ID проекта**: он виден в URL Tilda после входа в ваш сайт  
   (например, `tilda.cc/project12345678` → ID = `12345678`)

### 3.2. Добавить секреты в GitHub репозиторий

1. Откройте [github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions](https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions)  
2. Нажмите **New repository secret** — добавьте три секрета:

| Название | Значение |
|----------|---------|
| `TILDA_PUBLIC_KEY` | publickey из Tilda |
| `TILDA_SECRET_KEY` | secretkey из Tilda |
| `TILDA_PROJECT_ID` | числовой ID вашего проекта |

3. Дополнительно добавьте **Repository variable** (не secret):
   - **Settings → Secrets and variables → Actions → Variables → New variable**  
   - Название: `TILDA_ENABLED`  
   - Значение: `true`  

### 3.3. Узнать ID страниц Tilda

После добавления секретов скажите мне — я запущу скрипт и выведу список всех страниц:

```
Copilot, запусти node .github/scripts/tilda-push.js --list
```

Или запустите сами в терминале (с заданными переменными окружения):

```bash
TILDA_PUBLIC_KEY=... TILDA_SECRET_KEY=... TILDA_PROJECT_ID=... \
  node .github/scripts/tilda-push.js --list
```

### 3.4. Заполнить карту страниц

Я открою файл `.github/scripts/tilda-push.js` и заполню раздел `PAGE_MAP`:

```javascript
const PAGE_MAP = {
  'index.html':          '12345678',  // ← ID главной страницы Tilda
  'about.html':          '12345679',  // ← ID страницы «О компании»
  'services.html':       '12345680',  // ← ID страницы «Услуги»
  'contacts.html':       '12345681',  // ← ID страницы «Контакты»
  'remote-regions.html': '12345682',  // ← ID страницы «Северный завоз»
  'account.html':        '12345683',  // ← ID страницы «Личный кабинет»
};
```

После этого каждый раз, когда я обновляю код и загружаю его в GitHub —
**Tilda автоматически обновляется без вашего участия**.

---

## Итоговая схема после настройки

```
Вы:  «Copilot, добавь блок с отзывами»
  ↓
Я:   Пишу код → загружаю в GitHub
  ↓
GitHub Actions (автоматически, ~2 мин):
  • GitHub Pages обновляет CDN
  • Tilda API обновляет HTML страниц
  ↓
Результат: сайт обновлён ✅
```

---

## Что мне нужно от вас прямо сейчас

Выполните **только Шаги 1 и 2** — этого достаточно для полноценной работы.  
Шаг 3 (Tilda API) — по желанию, для полной автоматизации.

| Действие | Время | Нужен платный план? |
|---------|-------|---------------------|
| ✅ Шаг 1: GitHub Pages | 5 мин | Нет (бесплатно) |
| ✅ Шаг 2: CDN в Tilda | 10 мин | Нет (любой план) |
| ⚡ Шаг 3: Tilda API | 10 мин | **Да (Business)** |

---

*Как только Шаг 1 и 2 выполнены — скажите мне, и я проверю что всё работает.*
