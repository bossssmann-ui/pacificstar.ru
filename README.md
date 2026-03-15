# 🚢 Pacific Star — Транспортно-экспедиторская компания

> Полный сайт для логистической компании: 8 страниц, интерактивная карта, мультиязычность,
> калькулятор стоимости, курсы валют ЦБ РФ, личный кабинет.

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
└── js/
    ├── main.js             — Анимации, виджет связи, AmoCRM-заглушка
    ├── map.js              — SVG карта России и АТР (43 города)
    ├── currency.js         — Курсы валют ЦБ РФ
    ├── calculator.js       — Калькулятор стоимости
    └── i18n.js             — Переключатель языков (RU/EN/ZH/JA/KO)
```

---

## 🚀 Деплой на Timeweb через GitHub Actions

Деплой выполняется вручную через GitHub Actions (FTP + SSH/rsync).

### Настройка (один раз):

Добавьте следующие секреты в настройках репозитория:
👉 https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions

| Секрет | Описание |
|--------|----------|
| `TIMEWEB_HOST` | IP-адрес сервера |
| `TIMEWEB_USER` | Логин на хостинге |
| `TIMEWEB_PASSWORD` | Пароль от хостинга |

### Запуск деплоя:

👉 https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml  
→ «Run workflow» → «Run workflow» → 2 минуты → сайт обновлён

Подробная инструкция: [TIMEWEB_DEPLOY.md](TIMEWEB_DEPLOY.md)

---

## 🎨 Figma GitHub Action

В репозиторий добавлен ручной workflow для получения JSON файла из Figma API.

### Что нужно настроить:

Добавьте секрет `FIGMA_ACCESS_TOKEN` в настройках GitHub Secrets:
👉 https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions

### Как запустить:

👉 https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/figma-file-export.yml  
→ «Run workflow» → укажите `file_key` → скачайте артефакт `figma-file-json`

---

## 🔗 Важные ссылки

| | |
|--|--|
| Сайт | https://pacificstar.ru |
| Pull Request | https://github.com/bossssmann-ui/pacificstar.ru/pulls |
| Деплой (ручной) | https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml |
| Figma JSON export | https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/figma-file-export.yml |
| Секреты GitHub | https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions |
| Скриншоты страниц | https://github.com/bossssmann-ui/pacificstar.ru/tree/copilot/refactor-site-description/previews |
