# 🚢 Pacific Star — Транспортно-экспедиторская компания

> Полный сайт для логистической компании: 8 страниц, интерактивная карта, мультиязычность,
> калькулятор стоимости, курсы валют ЦБ РФ, личный кабинет.

---

## 🔴 Сейчас: запустить go.php — сайт заработает

**Проблема:** при распаковке ZIP на Timeweb, старый `index.html` от Tilda не перезаписывается.
Поэтому браузер открывает страницу Tilda, а не наш сайт.

**Решение (go.php):** загружается как один файл → автоматически перезаписывает Tilda-файлы нашими.

### Два действия:

**1.** Скачать `go.php`:
👉 https://github.com/bossssmann-ui/pacificstar.ru/raw/copilot/refactor-site-description/go.php

**2.** Timeweb → Файловый менеджер → `public_html` → загрузить файл (как `hello.html`)

**3.** Открыть: **http://pacificstar.ru/go.php**

→ Через 20–30 секунд автоматически откроется `pacificstar.ru` с синей шапкой ✅

> **Примечание:** `go.php` теперь включён в `site-pacificstar.zip`. Если вы загрузили ZIP и
> распаковали его — `go.php` уже в `public_html`. Просто откройте `pacificstar.ru/go.php`.

---

## 🔄 Как работает Copilot между сессиями

| Вопрос | Ответ |
|--------|-------|
| Надо ли что-то сохранять перед выходом? | Нет — всё в GitHub |
| Как начать новую сессию? | Открыть PR → написать задачу |
| Copilot запомнит контекст? | Да — читает `SESSION_STATE.md` |
| Что нужно настроить один раз? | Секрет `TIMEWEB_PASSWORD` → авто-деплой |

### Чтобы Copilot автоматически обновлял сайт на Timeweb:

1. Открыть: https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions
2. Нажать **«New repository secret»**
3. Name: `TIMEWEB_PASSWORD`
4. Secret: пароль от Timeweb (`PuW9#q#ZqdxR`)
5. Сохранить

После этого: каждый раз когда нужно обновить сайт — перейти по ссылке:
👉 https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml
→ «Run workflow» → «Run workflow» → 2 минуты → сайт обновлён

---

## 📁 Структура проекта

```
pacificstar.ru/
├── index.html              — Главная страница
├── about.html              — О компании
├── services.html           — Услуги и тарифы
├── contacts.html           — Контакты
├── remote-regions.html     — Северный завоз
├── account.html            — Личный кабинет
├── integrations.html       — Интеграции
├── privacy.html            — Политика конфиденциальности
├── css/style.css           — Все стили
├── js/
│   ├── main.js             — Анимации, виджет связи, AmoCRM-заглушка
│   ├── map.js              — SVG карта России и АТР (43 города)
│   ├── currency.js         — Курсы валют ЦБ РФ
│   ├── calculator.js       — Калькулятор стоимости
│   └── i18n.js             — Переключатель языков (RU/EN/ZH/JA/KO)
├── go.php                  — Авто-установщик (запустить один раз)
├── site-pacificstar.zip    — Архив для ручной загрузки на Timeweb
├── DEPLOY_GUIDE.html       — Инструкция по деплою
└── SESSION_STATE.md        — Контекст для следующей сессии Copilot
```

---

## 🔗 Важные ссылки

| | |
|--|--|
| Сайт | https://pacificstar.ru |
| Рабочая ветка | https://github.com/bossssmann-ui/pacificstar.ru/tree/copilot/refactor-site-description |
| Pull Request | https://github.com/bossssmann-ui/pacificstar.ru/pulls |
| Деплой (ручной) | https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml |
| Секреты GitHub | https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions |
| Скриншоты страниц | https://github.com/bossssmann-ui/pacificstar.ru/tree/copilot/refactor-site-description/previews |