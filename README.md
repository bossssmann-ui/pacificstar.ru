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

## 🤖 Claude Code

В проекте настроен [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — AI-ассистент для разработки от Anthropic.

### Установка

```bash
# Установить Claude Code (требуется Node.js ≥ 18)
npm install -g @anthropic-ai/claude-code

# Перейти в папку проекта и запустить
cd pacificstar.ru
claude
```

### Как это работает

- Claude Code автоматически читает файл `CLAUDE.md` из корня проекта
- В `CLAUDE.md` описана структура проекта, команды и правила разработки
- Claude Code может редактировать файлы, запускать команды и помогать с кодом

### Примеры использования

```bash
# Запустить Claude Code в интерактивном режиме
claude

# Задать вопрос напрямую
claude "добавь кнопку обратного звонка на главную страницу"

# Проверить HTML-валидацию
claude "запусти линтер и исправь ошибки"
```

---

## 🔗 Важные ссылки

| | |
|--|--|
| Сайт | https://pacificstar.ru |
| Pull Request | https://github.com/bossssmann-ui/pacificstar.ru/pulls |
| Деплой (ручной) | https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml |
| Секреты GitHub | https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions |
| Скриншоты страниц | https://github.com/bossssmann-ui/pacificstar.ru/tree/copilot/refactor-site-description/previews |