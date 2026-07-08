# Передача контекста новому агенту — pacificstar.ru

Краткий бриф для продолжения работы по [ROADMAP.md](ROADMAP.md).

---

## Рекомендуемый порядок для нового агента

### Шаг 0 — Подготовка (15 минут)

1. **Прочитать** [ROADMAP.md](ROADMAP.md) — там фазы, статусы задач и критерии готовности.
2. **Проверить ветку и PR:**
   - Рабочая ветка: `cursor/site-roadmap-and-phase1-aa30`
   - Draft PR: https://github.com/bossssmann-ui/pacificstar.ru/pull/213
   - Если PR ещё не в `main` — работать от этой ветки или смержить PR перед стартом.
3. **Уточнить у заказчика доступы** (без них часть фаз заблокирована):

   | Доступ | Нужен для |
   |--------|-----------|
   | Timeweb Node.js / VPS | Фаза 0 — формы на production |
   | SMTP (Яндекс / Mail.ru) | Письма с заявок |
   | AmoCRM API-ключ | Фаза 2 — CRM |
   | ID Яндекс.Метрики | Фаза 2 — аналитика |
   | OG-image 1200×630 PNG | Фаза 1.3 — соцсети и ИИ-превью |

4. **Локальный запуск** (для проверок):
   ```bash
   npm install
   npm run validate    # html-validate
   npm start           # server.js на :3000 (нужен .env для SMTP)
   ```

---

### Шаг 1 — Фаза 0: лидогенерация (приоритет №1)

**Почему первым:** формы на https://pacificstar.ru сейчас не отправляются (`POST /api/contact` → 404). Сайт не выполняет главную бизнес-цель.

| # | Действие | Файлы / зона | Критерий готовности |
|---|----------|--------------|---------------------|
| 1.1 | Развернуть `server.js` на production | Инфраструктура Timeweb / VPS | `GET /api/health` → 200 |
| 1.2 | Настроить SMTP в `.env` | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Письмо с тестовой заявки на `info@pacificstar.ru` |
| 1.3 | Проверить форму контактов | `contacts.html`, `js/main.js` | Успешная отправка, нет ошибки в UI |
| 1.4 | Проверить hero-форму | `index.html` → `#heroLeadForm` | То же |
| 1.5 | Обновить ROADMAP | `ROADMAP.md` | Задачи 0.1–0.3 → ✅ |

Инструкции по деплою backend — раздел **«Деплой server.js»** в [ROADMAP.md](ROADMAP.md).

**Если нет доступа к серверу:** зафиксировать блокер в ROADMAP, перейти к Шагу 2, но явно сообщить заказчику.

---

### Шаг 2 — Фаза 2: инструменты и конверсия

Делать после Фазы 0 или параллельно, если backend настраивает заказчик.

| # | Задача | ROADMAP ID | Файлы |
|---|--------|------------|-------|
| 2.1 | AmoCRM webhook для форм и обратного звонка | 2.2, 2.6 | `js/main.js` (TODO ~строка 674), `server.js` |
| 2.2 | Яндекс.Метрика + цели | 2.3 | `PS_YM_ID` в `<head>` всех HTML, `js/analytics.js` |
| 2.3 | Телефон/email на мобильном без скролла | 2.4 | `css/style.css`, `js/components.js` |
| 2.4 | SEO-текст тарифов над калькулятором | 2.5 | `services.html` |
| 2.5 | Проверить виджет валют на production | 2.1 | `ved.html`, `js/currency.js` |

После каждой задачи — `npm run validate`, bump `?v=` у изменённых CSS/JS.

---

### Шаг 3 — Закрыть остатки Фазы 1

| # | Задача | ROADMAP ID | Примечание |
|---|--------|------------|------------|
| 3.1 | OG-image PNG 1200×630 | 1.3 | Заменить `og:image` (сейчас SVG) на всех публичных страницах |
| 3.2 | Повторный GEO-чек | — | Запросы в Perplexity / Алиса по ключевым фразам из ROADMAP |

---

### Шаг 4 — Фаза 3: мультиязычность

Только когда формы и аналитика работают.

| # | Задача | ROADMAP ID |
|---|--------|------------|
| 4.1 | Перевести ~911 `[TODO]` в `locales/en.json` | 3.1 |
| 4.2 | Переводы ZH (приоритет для ВЭД) | 3.2 |
| 4.3 | i18n для `calculator.js` и валидации форм | 3.3 |
| 4.4 | `hreflang` для ru / en | 3.4 |
| 4.5 | Обновить [i18n-status.md](i18n-status.md) | 3.5 |

---

### Шаг 5 — Фазы 4–5 (по запросу)

- **Фаза 4:** реальный ЛК, авторизация, трекинг через CRM — `account.html`, `js/account.js`, `server.js`
- **Фаза 5:** roadmap из [integrations.html](integrations.html) — Telegram-бот, SeaRates, ЭДО, 1С, PWA, Open API

Не начинать без явного запроса заказчика.

---

### Шаг 6 — После каждой итерации

1. Обновить статусы в [ROADMAP.md](ROADMAP.md) (⬜ → ✅).
2. Добавить строку в **«Журнал изменений»** в ROADMAP.
3. `git commit` + `git push` на ветку `cursor/<name>-aa30`.
4. Обновить PR (или создать новый draft).
5. **Не мержить в `main` без проверки** — merge = автодеплой на production (Timeweb).

---

## Что уже сделано (не переделывать)

Ветка `cursor/site-roadmap-and-phase1-aa30` / PR #213:

- [x] `ROADMAP.md`, `llms.txt`
- [x] FAQ + FAQPage на главной, FAQPage JSON-LD на services
- [x] Текстовые маршруты на главной, noscript-навигация
- [x] `remote-regions` + `truck-delivery` в меню
- [x] `currencyWidget` на ved.html, FAQ-аккордеон в main.js
- [x] `sameAs` в JSON-LD, lastmod в sitemap
- [x] Ссылка «Наши вакансии» → https://career.pacificstar.ru/careers/
- [x] favicon.ico redirect в `.htaccess`

---

## Критические факты (QA, июль 2026)

| Факт | Детали |
|------|--------|
| Формы на production | ❌ `/api/contact` → 404 |
| Калькулятор | ✅ `services.html#calculator` |
| Обратный звонок | ⚠️ UI работает, отправка — заглушка |
| Личный кабинет | ⚠️ Демо, без реальной авторизации |
| i18n EN | ⚠️ ~40% переведено, остальное `[TODO]` |
| Деплой | merge в `main` → GitHub Actions → Timeweb FTP |

---

## Архитектура (не ломать)

- Шапка / подвал / floating contacts — `js/components.js` (`data-component="header"` и т.д.)
- Формы — `js/main.js` → `POST /api/contact`
- Кэш-бастинг: `style.css?v=YYYYMMDD`, `main.js?v=...` — bump при изменениях
- Статика only на Timeweb; `server.js` — отдельный процесс Node
- Ветки агента: `cursor/<описание>-aa30`

---

## Ключевые файлы

| Файл | Назначение |
|------|------------|
| `ROADMAP.md` | План и статусы — **источник правды** |
| `js/components.js` | Навигация, header, footer |
| `js/main.js` | Формы, callback, FAQ |
| `server.js` | API contact / register / health |
| `js/calculator.js` | Калькулятор на services.html |
| `js/currency.js` | Курсы ЦБ на ved.html |
| `js/account.js` | Личный кабинет (демо) |
| `js/analytics.js` | Метрика / GA (ID пока пустые) |

---

## Стартовый промпт для агента

Скопируйте в новый чат:

```
Продолжи развитие pacificstar.ru по HANDOFF.md и ROADMAP.md.
Ветка: cursor/site-roadmap-and-phase1-aa30, PR #213.
Начни с Шага 1 (Фаза 0 — backend и формы), если есть доступ к серверу.
Иначе — Шаг 2 (AmoCRM, Метрика).
Спроси у меня: SMTP, AmoCRM API, PS_YM_ID, доступ к Timeweb Node.
```

---

*Последнее обновление: 2026-07-08*
