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

#### 1.1. Зарегистрироваться

1. Открой в браузере: 👉 **https://console.anthropic.com/login**
2. Нажми кнопку **«Sign up»** (внизу формы)
3. Введи свой **email** и придумай **пароль**
4. Или нажми **«Continue with Google»**, чтобы войти через Google-аккаунт
5. Проверь свою почту — туда придёт **письмо с кодом подтверждения**
6. Введи код из письма на странице → нажми **«Verify»**

> 💡 Если аккаунт уже есть — просто войди по ссылке: **https://console.anthropic.com/login**

#### 1.2. Создать API-ключ

1. После входа ты окажешься в **Dashboard** (панели управления)
2. В левом меню нажми на 👉 **«API Keys»** или перейди по ссылке:
   **https://console.anthropic.com/settings/keys**
3. Нажми кнопку **«Create Key»** (справа вверху)
4. В поле **«Name»** введи любое название, например: `pacificstar`
5. Нажми **«Create Key»**
6. На экране появится ключ — он выглядит примерно так:
   ```
   sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
7. **Обязательно скопируй и сохрани** этот ключ (например, в заметки) — он показывается **только один раз!**
8. Нажми **«Done»**

> ⚠️ Если потеряешь ключ — его нельзя восстановить. Нужно будет создать новый.

#### 1.3. Пополнить баланс

Без денег на балансе Claude Code не сможет отправлять запросы.

1. В левом меню нажми 👉 **«Billing»** или перейди по ссылке:
   **https://console.anthropic.com/settings/billing**
2. Нажми **«Add payment method»** → введи данные банковской карты
3. После добавления карты нажми **«Add funds»** (или «Buy credits»)
4. Выбери сумму — **минимум $5** (этого хватит на несколько часов работы)
5. Нажми **«Purchase»** → деньги зачислятся на баланс

> 💰 **Сколько стоит?** Примерно $0.01–0.05 за один запрос. $5 хватит на ~100–500 запросов.
>
> ⚠️ Без API-ключа и баланса Claude Code не будет работать.

#### ❗ Проблемы с регистрацией или оплатой

Если при вводе номера телефона или данных карты сайт пишет **«There was a problem, please try again later»** — вот что можно сделать:

| Проблема | Решение |
|----------|---------|
| Не принимает российский номер телефона | Anthropic может не поддерживать телефоны из РФ для SMS-верификации. Попробуй использовать номер в международном формате: `+7 9XX XXX XX XX`. Если не помогает — потребуется номер другой страны (например, через сервис виртуальных номеров) |
| Не принимает российскую карту | Карты банков РФ (Visa/MasterCard/Мир) могут быть заблокированы из-за санкций. Используй **виртуальную карту** зарубежного сервиса или карту иностранного банка |
| Ошибка при оплате | Попробуй: 1) другой браузер (Chrome/Firefox), 2) очисти кеш и куки, 3) отключи VPN (или наоборот — включи VPN через другую страну), 4) попробуй позже — возможно, временный сбой |
| Не приходит SMS-код | Проверь что номер введён верно. Нажми «Resend code». Подожди 2–3 минуты. Проверь папку «Спам» если код приходит на email |

> 💡 **Альтернатива:** Если Anthropic полностью недоступен, можно использовать Claude Code через
> [Amazon Bedrock](https://docs.anthropic.com/en/docs/claude-code/bedrock-vertex) или
> [Google Vertex AI](https://docs.anthropic.com/en/docs/claude-code/bedrock-vertex) —
> эти провайдеры могут принимать другие способы оплаты.

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