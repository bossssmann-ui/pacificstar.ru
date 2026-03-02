# CLAUDE.md — Инструкции для Claude Code

## Проект

Pacific Star (pacificstar.ru) — статический сайт транспортно-экспедиторской компании.
8 HTML-страниц, CSS, JavaScript. Деплой на Timeweb через FTP (GitHub Actions).

## Структура

```
index.html              — Главная страница
about.html              — О компании
services.html           — Услуги и тарифы
contacts.html           — Контакты
remote-regions.html     — Северный завоз
account.html            — Личный кабинет
integrations.html       — Интеграции
privacy.html            — Политика конфиденциальности
css/style.css           — Все стили
js/main.js              — Анимации, виджет связи
js/map.js               — SVG карта России и АТР
js/currency.js          — Курсы валют ЦБ РФ
js/calculator.js        — Калькулятор стоимости
js/i18n.js              — Переключатель языков (RU/EN/ZH/JA/KO)
```

## Команды

```bash
# Установить зависимости
npm install

# Линтинг HTML
npx html-validate "*.html"

# Проверить конкретный файл
npx html-validate index.html
```

## Правила разработки

- Язык интерфейса и комментариев: русский
- Все стили — в `css/style.css`, inline-стили допускаются
- HTML-валидация: конфигурация в `.htmlvalidate.json` (extends `html-validate:recommended`)
- Void-элементы без `/` (например `<br>`, `<img>`, не `<br/>`)
- Мультиязычность: RU/EN/ZH/JA/KO через `js/i18n.js`
- Не коммитить: `node_modules/`, `package-lock.json`, `.env`

## Деплой

Деплой запускается автоматически при push в `main` или вручную через GitHub Actions.
Workflow: `.github/workflows/tilda-deploy.yml`
Секреты: `TIMEWEB_HOST`, `TIMEWEB_USER`, `TIMEWEB_PASSWORD`
