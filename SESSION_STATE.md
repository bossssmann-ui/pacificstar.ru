# 📌 Состояние проекта — «Pacific Star»
> Последнее обновление: 26 февраля 2026 г.  
> Чтобы продолжить: открыть PR → написать задачу. Copilot прочитает этот файл автоматически.

---

## 🔴 ОДНО ДЕЙСТВИЕ ДО ЗАПУСКА САЙТА

**Проблема:** на сервере Timeweb остался старый `index.html` от Tilda.  
Timeweb при распаковке ZIP **не перезаписывает** существующие файлы — поэтому файл Tilda остался.

**Решение — go.php (уже включён в ZIP):**

Если `site-pacificstar.zip` уже распакован на Timeweb → `go.php` уже в `public_html`:
→ Открыть **http://pacificstar.ru/go.php** → 30 сек → сайт работает

Если нет:
1. Скачать: https://github.com/bossssmann-ui/pacificstar.ru/raw/copilot/refactor-site-description/go.php
2. Timeweb → Файловый менеджер → public_html → загрузить
3. Открыть http://pacificstar.ru/go.php

---

## ✅ Что сделано

| Раздел | Статус |
|--------|--------|
| 8 страниц сайта (index, about, services, contacts, remote-regions, account, integrations, privacy) | ✅ |
| SVG карта России + АТР (43 города, маршруты, моря) | ✅ |
| Калькулятор стоимости доставки | ✅ |
| Курсы валют ЦБ РФ (live + fallback) | ✅ |
| Мультиязычность RU/EN/ZH/JA/KO | ✅ |
| Личный кабинет + AmoCRM-заглушка | ✅ |
| Виджет WhatsApp/Telegram/Перезвоним | ✅ |
| Страница интеграций (сравнительная матрица) | ✅ |
| Северный завоз (ФЗ-411, порты, автодороги) | ✅ |
| Собственный парк техники + аккредитация портов | ✅ |
| Проектные перевозки (негабарит, тяжеловес) | ✅ |
| Раздел «Наши партнёры» с каруселью логотипов | ✅ |
| SEO: JSON-LD schema, meta-descriptions, E-E-A-T | ✅ |
| HTML-validate: 0 ошибок на всех 8 страницах | ✅ |
| ZIP для ручной загрузки (go.php внутри) | ✅ |
| GitHub Actions деплой на Timeweb (ручной запуск) | ✅ |
| Инструкция DEPLOY_GUIDE.html | ✅ |

---

## ⚙️ Что нужно настроить один раз

### 1. Секрет TIMEWEB_PASSWORD → авто-деплой
После этого Copilot сможет запускать деплой сам, без участия пользователя.

1. Открыть: https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions
2. «New repository secret»
3. Name: `TIMEWEB_PASSWORD`
4. Secret: пароль Timeweb
5. «Add secret»

Запуск деплоя вручную (когда нужно):
👉 https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml
→ «Run workflow» → «Run workflow»

### 2. AmoCRM API ключ (когда будете готовы)
В `js/main.js` есть заглушка — один `fetch()` раскомментировать и вставить webhook URL.

### 3. Яндекс.Карты API ключ
В `contacts.html` — заменить заглушку на реальную карту.

### 4. Логотипы партнёров
Загрузить в папку `img/partners/` — инструкция в `img/partners/README.md`.

---

## 📋 Следующие задачи (от клиента — замечания по сайту)

_Ожидаем замечания по внешнему виду. Клиент обещал прислать._

Предложения от Copilot (готовы к реализации по одобрению):
- [ ] Видеофон в hero-секции (замена цветного фона)
- [ ] Блог / новости компании
- [ ] Онлайн-чат (интеграция с Jivosite или LiveChat)
- [ ] Система отслеживания грузов (трекинг по номеру)
- [ ] Раздел «Вакансии»

---

## 🔗 Ссылки

| | |
|--|--|
| Репозиторий | https://github.com/bossssmann-ui/pacificstar.ru |
| Рабочая ветка | https://github.com/bossssmann-ui/pacificstar.ru/tree/copilot/refactor-site-description |
| Pull Request | https://github.com/bossssmann-ui/pacificstar.ru/pulls |
| Деплой | https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml |
| Скриншоты | https://github.com/bossssmann-ui/pacificstar.ru/tree/copilot/refactor-site-description/previews |
| Секреты GitHub | https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions |
| go.php (установщик) | https://github.com/bossssmann-ui/pacificstar.ru/raw/copilot/refactor-site-description/go.php |

---

## 🛠 Технический стек сервера Timeweb

| Параметр | Значение |
|----------|----------|
| IP | 185.114.247.170 |
| Логин | ct38770 |
| Путь | /home/ct38770/public_html/ |
| PHP | Доступен (подтверждено: hello.html работает) |
| curl/allow_url_fopen | Требует проверки — нужно запустить go.php |
