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

## 🤖 Claude Code — подробная инструкция по установке

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) — AI-ассистент от Anthropic, который работает прямо в терминале.  
Он может редактировать файлы проекта, запускать команды, искать баги и помогать с кодом.

---

### Шаг 1. Получить API-ключ Anthropic

1. Открой в браузере: **https://console.anthropic.com/**
2. Нажми **«Sign up»** (или войди, если уже есть аккаунт)
3. Перейди в раздел **«API Keys»** → нажми **«Create Key»**
4. Скопируй ключ (он начинается с `sk-ant-...`) — **сохрани его**, он показывается один раз
5. Пополни баланс: раздел **«Billing»** → **«Add funds»** (минимум $5)

> ⚠️ Без API-ключа и баланса Claude Code не будет работать.

---

### Шаг 2. Установить Node.js (если ещё не установлен)

Claude Code работает через Node.js. Проверь, есть ли он:

```bash
node --version
```

Если команда выдаёт ошибку или версия ниже 18 — установи Node.js:

| Система | Что делать |
|---------|-----------|
| **Windows** | Скачай **LTS-версию** с https://nodejs.org/ → запусти `.msi` → нажимай «Next» до конца |
| **macOS** | Скачай **LTS-версию** с https://nodejs.org/ → запусти `.pkg` → нажимай «Continue» до конца |
| **macOS (brew)** | Выполни в терминале: `brew install node` |
| **Ubuntu/Debian** | Выполни в терминале: `sudo apt update && sudo apt install -y nodejs npm` |

После установки проверь ещё раз:

```bash
node --version
# Должно показать v18.x.x или выше
```

---

### Шаг 3. Установить Claude Code

Открой **терминал** (Terminal / Командная строка / PowerShell) и выполни:

```bash
npm install -g @anthropic-ai/claude-code
```

> 💡 Флаг `-g` означает «глобально» — Claude Code будет доступен из любой папки.

Если на macOS или Linux выдаёт ошибку прав доступа:

```bash
sudo npm install -g @anthropic-ai/claude-code
```

Проверь, что установилось:

```bash
claude --version
```

---

### Шаг 4. Настроить API-ключ

Вставь свой API-ключ в переменную окружения:

**macOS / Linux** — сначала проверь свою оболочку, затем добавь ключ:

```bash
# Узнать какая оболочка (zsh или bash)
echo $SHELL

# Если /bin/zsh (по умолчанию на macOS):
echo 'export ANTHROPIC_API_KEY="sk-ant-ВАШ-КЛЮЧ-СЮДА"' >> ~/.zshrc
source ~/.zshrc

# Если /bin/bash (по умолчанию на Linux):
echo 'export ANTHROPIC_API_KEY="sk-ant-ВАШ-КЛЮЧ-СЮДА"' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**

```powershell
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-ВАШ-КЛЮЧ-СЮДА", "User")
```

> После этого **перезапусти терминал**, чтобы ключ применился.

---

### Шаг 5. Запустить Claude Code в проекте

```bash
# 1. Перейди в папку проекта
cd pacificstar.ru

# 2. Запусти Claude Code
claude
```

Claude Code автоматически прочитает файл `CLAUDE.md` из корня проекта и будет знать:
- Структуру всех файлов сайта
- Какие команды запускать (линтер, деплой)
- Правила разработки (русский язык, стили в `css/style.css`, и т.д.)

---

### Шаг 6. Пользоваться!

**Интерактивный режим** — просто пиши запросы в чат:

```bash
claude
# Откроется интерактивный чат. Пиши на русском:
> добавь кнопку обратного звонка на главную
> исправь ошибки в HTML
> покажи структуру проекта
```

**Быстрая команда** — задать вопрос без входа в чат:

```bash
claude "запусти линтер и покажи ошибки"
claude "добавь мета-тег description на страницу about.html"
claude "объясни что делает файл js/map.js"
```

**Полезные команды внутри чата Claude Code:**

| Команда | Что делает |
|---------|-----------|
| `/help` | Показать справку |
| `/clear` | Очистить историю диалога |
| `/cost` | Показать сколько потрачено токенов |
| `Ctrl+C` | Выйти из Claude Code |

---

### Быстрая проверка — всё работает?

```bash
cd pacificstar.ru
claude "скажи привет и покажи список HTML-файлов проекта"
```

Если видишь ответ с перечислением файлов — **всё готово!** 🎉

---

## 🔗 Важные ссылки

| | |
|--|--|
| Сайт | https://pacificstar.ru |
| Pull Request | https://github.com/bossssmann-ui/pacificstar.ru/pulls |
| Деплой (ручной) | https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml |
| Секреты GitHub | https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions |
| Скриншоты страниц | https://github.com/bossssmann-ui/pacificstar.ru/tree/copilot/refactor-site-description/previews |