# Pacific Star — план развития сайта

Документ фиксирует результаты QA-тестирования (июль 2026), SEO-стратегию для ИИ-поиска (GEO) и пошаговый план доработки [pacificstar.ru](https://pacificstar.ru).

Связанные файлы: [README.md](README.md), [HANDOFF.md](HANDOFF.md), [i18n-status.md](i18n-status.md), [TIMEWEB_DEPLOY.md](TIMEWEB_DEPLOY.md), [llms.txt](llms.txt).

---

## Текущий статус (baseline)

| Направление | Готовность | Комментарий |
|-------------|------------|-------------|
| Витрина / контент | ~85% | 19 страниц HTTP 200; **живые фото с работы — не внедрены** (см. Фаза 6) |
| Классический SEO (RU) | ~85% | title, canonical, JSON-LD, sitemap |
| ИИ-поиск (GEO) | ~70% | llms.txt, FAQ, OG-image PNG; карта в JS |
| Лидогенерация (формы) | ~90% | PHP `api/contact.php` на shared hosting, SMTP + SPF |
| Инструменты | ~75% | Калькулятор ОК; валюты на ved.html |
| i18n | ~95% | 5 языков complete; machine-translate, нужен human review |
| CRM / ЛК | ~15% | Демо-данные, AmoCRM не подключён |

**Актуально (июль 2026):** формы и почта работают через **PHP на хостинге** (`/api/*.php`), App Platform не используется. Следующий приоритет по продукту — **живой контент** (фото реальных перевозок) и аналитика/CRM (Фаза 2).

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
| 0.1 | Backend для форм на production | `GET /api/health.php` → `{"ok":true,"backend":"php"}` | ✅ PHP на shared hosting |
| 0.2 | Настроить SMTP / DNS (SPF) | `/api/health.php` → `"smtp":true`; одна SPF TXT | ✅ Exim + SPF Timeweb+Yandex |
| 0.3 | Проверить формы на сайте | «Заявка отправлена» + письмо на `sales@` | ✅ форма уходит; письмо — проверка в ящике |
| 0.4 | `favicon.ico` без 404 | Redirect или файл в `img/` | ✅ `img/favicon.ico` + rewrite |

Инструкция: [TIMEWEB_DEPLOY.md](TIMEWEB_DEPLOY.md). App Platform **не нужна** (можно остановить #220769).

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
| 2.3 | Яндекс.Метрика: `PS_YM_ID` + цели | ✅ счётчик `110523171`, цели в `analytics.js` |
| 2.4 | Телефон/email на мобильном без скролла | ✅ `header-mobile-bar` в `components.js` |
| 2.5 | SEO-текст тарифов над калькулятором | ✅ блок `#tariffs-overview` на `services.html` |
| 2.6 | Обратный звонок — реальная отправка | `POST /api/callback.php` → письмо / AmoCRM | ✅ PHP API (как contact) |

---

### Фаза 6 — Живой контент (фото с работы)

**Цель:** заменить «витринный» контент реальными кадрами с перевозок — повысить доверие, конверсию и GEO (ИИ цитируют конкретику + визуальные кейсы).

**Исходные материалы (от заказчика):** рабочие фото по проектам Pacific Star (паром, порт, негабарит, склады, техника, команда и т.д.).

| ID | Задача | Критерий готовности | Статус |
|----|--------|---------------------|--------|
| 6.1 | Инвентаризация фото | Таблица/папка: файл → направление (север / каботаж / негабарит / ВЭД) → город/маршрут → год | ⬜ ждём передачу файлов |
| 6.2 | Подготовка для веба | WebP/JPEG, max ~1920px, вес &lt;200 KB; `img/work/` в репо | ⬜ |
| 6.3 | Кейсы `cases.html` | ≥6 карточек с **реальным фото**, подпись, маршрут, тоннаж | ⬜ сейчас текст без живых снимков |
| 6.4 | Блок «Мы в работе» на главной | Галерея 6–12 фото + lazy-load | ⬜ |
| 6.5 | Фото на страницах услуг | 1–3 кадра на `severnyy-zavoz`, `kabotazh`, `negabarit`, `rail`, `ved` | ⬜ |
| 6.6 | `about.html` — команда и инфраструктура | Реальные фото офиса/склада/порта (с согласия на публикацию) | ⬜ |
| 6.7 | SEO: `alt`, подписи, ImageObject в JSON-LD где уместно | Все новые `<img>` с осмысленным `alt` на русском | ⬜ |
| 6.8 | OG для кейсов (опционально) | Отдельные og-image для топ-кейсов | ⬜ |

**Как передать фото агенту:**

1. Архив (ZIP) в облако **или** папка в репо `content-inbox/photos/` (не в git, если тяжёлые — ссылка).
2. К каждому кадру (или пакету): *что на фото, маршрут, можно ли в открытый доступ, есть ли лица клиентов*.
3. Отметить **лучшие 10** для главной и кейсов.

**Порядок работ после получения файлов:** 6.1 → 6.2 → 6.3 + 6.4 (максимальный эффект) → 6.5–6.7.

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

## Деплой форм и API (актуально)

| Компонент | Где |
|-----------|-----|
| Статика + PHP API | Timeweb **shared hosting** `public_html` (GitHub Actions → FTP/SSH) |
| Формы | `api/contact.php`, `callback.php`, `register.php` |
| Секреты | GitHub: `TIMEWEB_*`, `SMTP_PASS` (опционально для SMTP fallback) |
| DNS | SPF одна запись: `v=spf1 include:_spf.timeweb.ru include:_spf.yandex.net ~all` |

Подробно: [TIMEWEB_DEPLOY.md](TIMEWEB_DEPLOY.md).

### Архив: App Platform / server.js (не используется)

<details>
<summary>Историческая схема Node на App Platform — можно не открывать</summary>

### Вариант B — Timeweb Cloud App Platform

Заменён на PHP (июль 2026). Приложение #220769 — остановить.

### Вариант A / C / D

См. git history ROADMAP при необходимости VPS / Formspree.

</details>

**Проверка:**

```bash
curl -s https://pacificstar.ru/api/health.php
curl -s -X POST https://pacificstar.ru/api/contact.php \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","phone":"+79990000000","message":"test"}'
```

---

## Чеклист — что дальше (приоритет)

### Сейчас (параллельно)

- [x] Фаза 0: формы + почта + SPF
- [ ] **Фаза 6:** живые фото — **ждём архив от заказчика** (см. 6.1)
- [x] Фаза 2.3: Яндекс.Метрика — `PS_YM_ID=110523171`
- [ ] Фаза 2.2: AmoCRM — `AMOCRM_WEBHOOK_URL` в `api/mail-config` / GitHub Secret

### Неделя 1 (архив)

- [x] Фаза 0: backend + SMTP + формы
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
| 2026-07-08 | Фаза 0 закрыта: PHP API, Exim, SPF; App Platform снята с критического пути |
| 2026-07-08 | Фаза 6: живой контент (фото с работы) — план и критерии в ROADMAP |

---

## Как обновлять этот документ

1. После завершения задачи — менять статус на ✅ в таблице фазы.
2. При добавлении новой фазы — вставить секцию с ID задач.
3. В «Журнал изменений» — дата и краткое описание PR.
4. Синхронизировать с `integrations.html`, если меняется roadmap интеграций.
