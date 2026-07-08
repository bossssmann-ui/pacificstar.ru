# Pacific Star — план развития сайта

Документ фиксирует результаты QA-тестирования (июль 2026), SEO-стратегию для ИИ-поиска (GEO) и пошаговый план доработки [pacificstar.ru](https://pacificstar.ru).

Связанные файлы: [README.md](README.md), [HANDOFF.md](HANDOFF.md), [i18n-status.md](i18n-status.md), [TIMEWEB_DEPLOY.md](TIMEWEB_DEPLOY.md), [llms.txt](llms.txt).

---

## Текущий статус (baseline)

| Направление | Готовность | Комментарий |
|-------------|------------|-------------|
| Витрина / контент | ~85% | 19 страниц HTTP 200, html-validate пройден |
| Классический SEO (RU) | ~85% | title, canonical, JSON-LD, sitemap |
| ИИ-поиск (GEO) | ~70% | llms.txt, FAQ, OG-image PNG; карта в JS |
| Лидогенерация (формы) | ~20% | `/api/contact` → 404 на production (нет Node.js) |
| Инструменты | ~75% | Калькулятор ОК; валюты на ved.html |
| i18n | ~95% | 5 языков complete; machine-translate, нужен human review |
| CRM / ЛК | ~15% | Демо-данные, AmoCRM не подключён |

**Критический разрыв:** README описывает `server.js` для форм, но Timeweb раздаёт только статику. Пока backend не развёрнут — лиды с сайта не доходят.

---

## SEO-стратегия для ИИ-поиска (GEO)

### Как сайт рендерится для ботов

| В initial HTML (без JS) | Только после JS |
|-------------------------|-----------------|
| H1, тексты, кейсы, FAQ на страницах услуг | Шапка, подвал, навигация (`components.js`) |
| JSON-LD: Organization, Service, FAQPage | SVG-карта (50+ городов) |
| `tel:` в контенте | Калькулятор, курсы валют |
| | Переводы i18n |

### Принципы GEO

1. **Render-first** — ключевой контент в HTML, не в JS.
2. **Entity SEO** — единый `@id` организации, заполненный `sameAs`, `knowsAbout`.
3. **FAQ** — одинаковый текст в `<body>` и в `FAQPage` JSON-LD (канал в AI Overviews / Perplexity).
4. **`llms.txt`** — машиночитаемая визитка для ИИ-краулеров.
5. **Текстовые маршруты** рядом с SVG-картой — города видны без `map-svg.js`.
6. **`<noscript>`-навигация** — fallback для ботов без выполнения JS.
7. **Конкретика** — цифры, сроки, порты, ссылки на 411-ФЗ (ИИ цитирует факты).

### Мониторинг (раз в месяц)

Проверять цитирование в Perplexity, ChatGPT (browsing), Google AI Overview, Яндекс + Алиса по запросам:

- «Pacific Star логистика»
- «северный завоз 411-ФЗ перевозчик»
- «доставка грузов на Сахалин морем»
- «каботаж Владивосток Магадан»

---

## Фазы работ

### Фаза 0 — Стабилизация лидогенерации

**Блокирует бизнес-цель. Без этого остальное не конвертирует.**

| ID | Задача | Критерий готовности | Статус |
|----|--------|---------------------|--------|
| 0.1 | Развернуть `server.js` на production (App Platform / VPS) | `POST /api/contact` → 200 на pacificstar.ru | 🟡 App #220769 создан; нужен публичный `*.twc1.net` + `PS_API_BASE` |
| 0.2 | Настроить SMTP (Яндекс / Mail.ru) | Тестовое письмо на `info@pacificstar.ru` | ⬜ SMTP_* в `.env` локально; production — после 0.1 |
| 0.3 | Проверить формы `contacts.html` и `#heroLeadForm` на главной | Сообщение «Заявка отправлена» | 🟡 код готов: hero без email → phone-only `/api/contact` |
| 0.4 | `favicon.ico` без 404 | Redirect или файл в `img/` | ✅ `img/favicon.ico` + rewrite |

Инструкция по backend: см. раздел «Деплой server.js» ниже.

---

### Фаза 1 — SEO и ИИ-рендеринг

| ID | Задача | Статус |
|----|--------|--------|
| 1.1 | Создать `llms.txt` | ✅ |
| 1.2 | Заполнить `sameAs` в Organization JSON-LD | ✅ |
| 1.3 | OG-image PNG 1200×630 (вместо SVG) | ✅ `img/og-image.png` |
| 1.4 | Текстовый блок маршрутов на главной | ✅ |
| 1.5 | FAQ + FAQPage на `index.html` | ✅ |
| 1.6 | FAQPage JSON-LD на `services.html` | ✅ |
| 1.7 | `<noscript>`-навигация на публичных страницах | ✅ |
| 1.8 | `remote-regions.html`, `truck-delivery.html` в меню | ✅ |
| 1.9 | `<lastmod>` в `sitemap.xml` | ✅ |
| 1.10 | Обработчик FAQ-аккордеона (`.faq-question`) | ✅ |

---

### Фаза 2 — Инструменты и UX

| ID | Задача | Статус |
|----|--------|--------|
| 2.1 | `<div id="currencyWidget">` на `ved.html` | ✅ |
| 2.2 | AmoCRM webhook (формы, callback, ЛК) | 🟡 код в `server.js`, нужен `AMOCRM_WEBHOOK_URL` |
| 2.3 | Яндекс.Метрика: реальный `PS_YM_ID` + цели | 🟡 loader в `analytics.js`, нужен ID счётчика |
| 2.4 | Телефон/email на мобильном без скролла | ✅ `header-mobile-bar` в `components.js` |
| 2.5 | SEO-текст тарифов над калькулятором | ✅ блок `#tariffs-overview` на `services.html` |
| 2.6 | Обратный звонок — реальная отправка (не заглушка) | 🟡 `POST /api/callback`, нужен backend (Фаза 0) |

---

### Фаза 3 — Мультиязычность

| ID | Задача | Статус |
|----|--------|--------|
| 3.1 | Перевести ~911 `[TODO]` в `en.json` | ✅ machine-translate RU→EN |
| 3.2 | Переводы ZH / JA / KO (приоритет: ZH для ВЭД) | ✅ machine-translate RU→ZH/JA/KO |
| 3.3 | i18n для `calculator.js` и валидации форм | ✅ |
| 3.4 | `hreflang` (`ru`, `en` минимум) | ✅ ru/en/zh/ja/ko + `?lang=` |
| 3.5 | Обновлять [i18n-status.md](i18n-status.md) | ✅ |

---

### Фаза 4 — Личный кабинет и CRM

| ID | Задача | Статус |
|----|--------|--------|
| 4.1 | Реальная авторизация (JWT / session) | ⬜ |
| 4.2 | Трекинг груза через AmoCRM / 1С | ⬜ |
| 4.3 | Email-уведомления о статусе заявки | ⬜ |
| 4.4 | API `POST /api/order` | ⬜ |
| 4.5 | Синхронизация ЛК ↔ AmoCRM | ⬜ |

---

### Фаза 5 — Roadmap 2025–2026

См. [integrations.html](integrations.html) — дорожная карта:

| Квартал | Задача |
|---------|--------|
| Q2 2025 | AmoCRM, Яндекс.Метрика |
| Q3 2025 | Telegram-бот, SeaRates трекинг |
| Q4 2025 | ЭДО, интеграция 1С |
| Q1 2026 | PWA |
| Q2 2026 | Open API |

---

## Деплой server.js (Фаза 0)

Timeweb shared hosting по умолчанию отдаёт только статику. Варианты:

### Вариант A — Node.js на Timeweb (если тариф поддерживает)

1. Включить Node.js в панели Timeweb.
2. Загрузить `server.js`, `package.json`, `.env` (не в git).
3. Проксировать `/api/*` через nginx на процесс Node (порт из панели).
4. Статику оставить в `public_html`, API — на Node.

### Вариант B — Timeweb Cloud App Platform (текущий)

1. Backend-приложение Express, репо `bossssmann-ui/pacificstar.ru`, ветка `main`.
2. Сборка: `npm install --production`, запуск: `node server.js`, health: `/api/health`.
3. ENV: `SMTP_*`, `CORS_ORIGIN=https://pacificstar.ru` (см. [TIMEWEB_DEPLOY.md](TIMEWEB_DEPLOY.md)).
4. После деплоя — технический домен `*.twc1.net` на вкладке «Дашборд».
5. Прописать в `js/config.js`: `window.PS_API_BASE = 'https://….twc1.net'`.

### Вариант C — Отдельный VPS / serverless

1. Деплой `server.js` на VPS (PM2) или Railway / Render.
2. CORS + `PS_API_BASE` на `https://api.pacificstar.ru`.

### Вариант D — Внешний сервис форм (быстрый старт)

AmoCRM webhook, Formspree или EmailJS — без своего сервера. Минус: меньше контроля над шаблонами писем.

**Проверка после деплоя:**

```bash
curl -s https://pacificstar.ru/api/health
curl -s -X POST https://pacificstar.ru/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","phone":"+79990000000","message":"test"}'
```

---

## Чеклист первых двух недель

### Неделя 1

- [ ] Фаза 0: backend + SMTP + проверка форм *(заблокировано — нужен SSH/Node)*
- [x] `llms.txt`, `sameAs`, FAQ на главной
- [x] Навигация: 2 пропущенные услуги в меню
- [x] Текстовые маршруты, noscript-nav

### Неделя 2

- [x] AmoCRM + Яндекс.Метрика — код подготовлен (Фаза 2.2–2.3, 2.6)
- [x] Мобильные контакты + SEO-текст тарифов (2.4–2.5)
- [x] Виджет валют на `ved.html`
- [x] OG-image PNG 1200×630
- [x] Повторный QA (авто, 2026-07-08): страницы 200, llms.txt/og-image OK; `/api/health` → 404 (backend не развёрнут)

---

## Журнал изменений

| Дата | Изменение |
|------|-----------|
| 2026-07-07 | Создан ROADMAP.md; старт Фазы 1 (llms.txt, FAQ, nav, noscript, currency, sitemap) |
| 2026-07-08 | Merge PR #213 в main; Фаза 2: mobile-bar, SEO тарифы, Metrika loader, AmoCRM/callback API |
| 2026-07-08 | Фаза 1.3 OG-image PNG; Фаза 3.1 en.json; 3.4 hreflang + ?lang=en |
| 2026-07-08 | Фаза 3.3: i18n для calculator.js, form JS messages, field-error data-i18n |
| 2026-07-08 | Фаза 3.2: zh/ja/ko переводы; hreflang zh/ja/ko; favicon.ico (0.4) |
| 2026-07-08 | Фаза 0 prep: js/config.js (PS_API_BASE), CORS в server.js |
| 2026-07-08 | Fix: hero-форма phone-only; config.js на services/privacy; sitemap lastmod |
| 2026-07-08 | App Platform #220769: инструкция в TIMEWEB_DEPLOY; listen 0.0.0.0 |

---

## Как обновлять этот документ

1. После завершения задачи — менять статус на ✅ в таблице фазы.
2. При добавлении новой фазы — вставить секцию с ID задач.
3. В «Журнал изменений» — дата и краткое описание PR.
4. Синхронизировать с `integrations.html`, если меняется roadmap интеграций.
