# Pacific Star — CI-CONTRACT

Фактические, проверенные на текущем состоянии репозитория правила CI, деплоя и локальных проверок. Собрано в PS-00; при расхождении GitHub — источник истины.

## Репозиторий

- **Repo**: `github.com/bossssmann-ui/pacificstar.ru`
- **Основная ветка**: `main`
- **Стек**: статические `.html`/`css`/`js` без сборки + опциональный Express-релей `server.js` (Nodemailer). Node `>=20 <25`. Лок-файл (`package-lock.json`) намеренно не коммитится (`.gitignore`).

## Утверждённый контракт проверок перед merge (владелец согласовал)

Перед merge на актуальной ревизии PR должны **успешно** завершиться **все три** проверки. Report-only, skipped, neutral, отсутствие запуска и успех предыдущего коммита **не** засчитываются.

| # | Проверка | Источник | Что реально проверяет |
|---|---|---|---|
| 1 | `GitGuardian Security Checks` | внешний GitHub App (сохраняется, заглушку не создаём) | секреты в диффе |
| 2 | `PHP lint` | новый workflow `pull_request` | `php -l` по всем отслеживаемым PHP production-бэкенда (вкл. `api/`); синтаксическая ошибка → fail; отсутствие ожидаемых PHP-файлов не даёт ложный success |
| 3 | `HTML validation` | новый workflow `pull_request` | зафиксированная версия `html-validate` по согласованному набору публикуемых HTML-страниц; падает при нарушениях, без `continue-on-error`/фиктивного success |

Проверки 2–3 запускаются на **любой** PR в `main` (включая docs и настройки окружения), чтобы тройка присутствовала на каждом PR. Workflow не получают production-секретов и не публикуют сайт.

**Статус принудительного запрета merge:** право `administration:read` у интеграции отсутствует (`GET /branches/main/protection` → `403`), поэтому включённость required-checks в защите ветки **не подтверждена**. До подтверждения владельцем: проверки запускаются, но принудительный запрет merge на стороне GitHub не гарантирован. Инструкция по включению — в разделе «Защита ветки» ниже.

**Временный порядок (согласовано):** merge выполняет **владелец** вручную (агент merge не исполняет и обходы через PAT не использует); задачи временно учитываются в `PLAN.md` (создание Issues недоступно); после фактического merge агент проверяет публикацию и продолжает следующую готовую задачу.

### Историческая проверка PR #200 (по всем коммитам)

Проверено по запросу: PR #200 «index.html: 152-FZ compliance for hero lead form», ветка `copilot/fix-home-form-compliance`, **один** коммит `4b8d78e481537443da780bf2a08210403be08755`, merge `b989e95494a8578e584fa1fa7993d28f435a5e0c` (2026-04-21).

- `check-runs` на HEAD: `total=1` — только `GitGuardian Security Checks` (`app=gitguardian`, success). Commit statuses: `0`.
- `check-runs` на merge-коммите: `🚀 Загрузить сайт на Timeweb` (`app=github-actions`, success) — публикация после merge, **не** PR-гейт.
- **Третьей проверки нет.** Историческая «тройка» не найдена ни на одном PR (#200/#230/#236/#243/#244/#245/#246).

### Реализация контракта

- Новый workflow `.github/workflows/ci.yml` (в отдельном PR): jobs **PHP lint** и **HTML validation** на `pull_request` в `main`.
- **HTML validation**: набор страниц — как в `npm run validate` (`*.html` + `news/*.html`); версия `html-validate` зафиксирована; реальные нарушения исправляются в коде (mechanical: `defer/required/novalidate/itemscope`, пустой `crossorigin`, `tel-non-breaking`), правила массово не отключаются, страницы не исключаются.
- **PHP lint**: `php -l` по всем отслеживаемым `*.php` (бэкенд `api/`); версия PHP выбрана под хостинг (Timeweb — проверить точную версию; по умолчанию берём актуальную LTS и фиксируем в workflow с пометкой о сверке).
- Дополнительно (не PR-гейт): **проверка публикации после merge** — job `🚀 Загрузить сайт на Timeweb` делает smoke HTTP 200; для релиза дополнительно проверяем содержимое затронутых страниц, а не только код 200.

## Пользовательская авторизация GitHub (PAT через Secrets)

- Среда поддерживает **хранение секретов** (repo/personal/team), инжектируемых как env-переменные. На момент проверки GitHub-токен/PAT в окружении **отсутствует** (нет `GH_TOKEN`/`GITHUB_TOKEN`/`PAT`).
- Но запись в GitHub у агента ограничена **инструментами среды**: `gh`/raw HTTP — только чтение; PR — через инструмент Cursor (`ManagePullRequest`); отдельного инструмента merge и создания Issues нет. PAT, положенный в Secrets, использовался бы только через `gh`/`curl` — это запрещённый обход, а не штатный канал.
- Итог: PAT **не открывает** создание Issues и merge в рамках правил. Это ограничение инструментов (нельзя обходить), отдельно от нехватки прав встроенного коннектора (например, чтение защиты ветки — `administration:read`). Поэтому Issues по-прежнему ведём в `PLAN.md`; merge выполняет владелец.

## Workflows в репозитории

| Workflow | Файл | Триггер | Роль |
|---|---|---|---|
| Deploy — pacificstar.ru на Timeweb | `.github/workflows/tilda-deploy.yml` | `push: [main]`, `workflow_dispatch` | Публикация сайта (не PR-гейт) |
| Figma file export | `.github/workflows/figma-file-export.yml` | `workflow_dispatch` | Ручной экспорт Figma JSON |
| Copilot cloud agent | (управляется GitHub) | — | Служебный |

## Деплой и релиз

- **Публикация происходит автоматически при push/merge в `main`** через `tilda-deploy.yml`: подстановка `PS_YM_ID`, генерация `api/mail-config.php` из секретов, `rsync` во временную папку и загрузка на Timeweb по FTP (fallback — SSH/rsync), затем smoke-проверка HTTP 200.
- **Следствие**: любой merge в `main` — это релиз. До merge проверять предварительную версию, после — опубликованный результат.
- **Секреты деплоя** (в GitHub Secrets): `TIMEWEB_HOST`, `TIMEWEB_USER`, `TIMEWEB_PASSWORD`, опционально `PS_YM_ID`, `SMTP_PASS`, `AMOCRM_WEBHOOK_URL`. В код/issue секреты не помещать.

### Исключения публикации (что НЕ уходит на сайт)

`rsync` в деплое исключает служебные файлы. В PS-00 к исключениям добавлены `docs/` и `.cursor/`, чтобы внутренняя проектная документация и правила агента не попадали в публикацию. Прочие исключения: `.git/`, `.github/`, `node_modules/`, `.vscode/`, `previews/`, `.env*`, `package*.json`, `Dockerfile`, ряд `*.md` и др. — см. `tilda-deploy.yml`.

## Откат (rollback)

- Штатный путь — обратный PR (revert) через тот же защищённый процесс и повторная публикация из `main`. Не менять DNS, права и секреты ради обхода ошибки.
- Ручной повторный деплой: `workflow_dispatch` для «Deploy — pacificstar.ru на Timeweb».

## Локальные проверки

```bash
npm install            # dev-инструменты + зависимости сервера (npm ci нельзя — лок-файла нет)
npm run validate       # html-validate *.html news/*.html
npm run spellcheck     # cspell (ru + en)
npm start              # Express: статика + /api/* на :3000 (порт из .env)
```

> На момент PS-00 `npm run validate` и `npm run spellcheck` сообщают о предсуществующих замечаниях в контенте `main`. Это фиксируется как исходный уровень; массовая правка контента выполняется в рамках соответствующих PS-задач, а не в обход критериев.

## Права доступа интеграции (диагностика, без раскрытия токена)

| Операция | Канал | Результат |
|---|---|---|
| `git push` веток | git remote (installation token) | Работает (`#244`, `#245`, `#246` запушены) |
| Создание/обновление PR | интеграция Cursor (`ManagePullRequest`) | Работает |
| Issues — чтение | `gh api` | `200` (`issues=read`) |
| Issues — запись/создание | — | **Недоступно**: `gh` в этой среде только на чтение, отдельного инструмента создания issues нет. Тестовый issue не создаётся (риск дублей). |
| Чтение защиты ветки | `gh api` | `403` «Resource not accessible by integration», требует `administration=read` |

Вывод: `push`/PR доступны разными каналами; **создание Issues недоступно** (не подменять контракт merge трекингом в `PLAN.md` — это контрольная точка до восстановления доступа); **защита ветки не читается** (нужно `administration:read` или сведения из UI).

## Формы: dev-бэкенд vs production

`js/config.js` по умолчанию маршрутизирует формы на **PHP на shared-хостинге**: `/api/contact` → `/api/contact.php` (аналогично `callback`, `register`). Node `server.js` (`/api/*`) используется только при `PS_MAIL_BACKEND='node'` + `PS_API_BASE` (App Platform). PHP-обработчики: `api/{contact,callback,register,smtp,health}.php`, конфиг — `api/mail-config.php` (генерируется в деплое из GitHub Secrets).

Следствие для PS-03: проверка Node-фоллбэка «письмо в лог без SMTP» — это **dev-проверка**, не подтверждение доставки в production. Доставку в production обеспечивают PHP-обработчики + почтовый канал Timeweb; их нужно проверять отдельно на согласованном тестовом канале. **PS-03 не считать завершённым.**

## Защита ветки (включение обязательных проверок) — действие владельца

API-доступа к настройке защиты у интеграции нет (`administration:read` → `403`). Включает владелец в UI: **Settings → Branches → Add branch protection rule** для `main` → **Require status checks to pass before merging** → добавить ровно три контекста (точные имена):

- `GitGuardian Security Checks`
- `HTML validation`
- `PHP lint`

Контексты появляются в списке после **первого запуска** соответствующих workflow (т.е. после открытия PR с `ci.yml`). До подтверждения владельцем считаем: проверки запускаются, но принудительный запрет merge на стороне GitHub **не подтверждён**.

## 🚫 Блокировка GitHub Actions (биллинг) — установлено на PR #247

При первом запуске `ci.yml` (PR #247) три контекста появились, но jobs Actions не стартовали. Аннотация run’а (id `34173773296`):

> "The job was not started because your account is locked due to a billing issue."

Следствия:
- `HTML validation` и `PHP lint` → `failure` **из-за блокировки аккаунта, не из-за кода** (0 шагов). Локально обе зелёные: `html-validate` 0 ошибок, `php -l` OK по всем `*.php`.
- Затронуты **все** GitHub Actions, включая деплой `tilda-deploy.yml` → **публикация на merge сейчас тоже не отработает**.
- GitGuardian (внешний App) не затронут — проходит.

**Действие владельца (единственный разблокирующий шаг сейчас):** снять блокировку в GitHub → **Settings → Billing** (оплатить задолженность/поднять spending limit). После — перезапустить проверки на актуальном HEAD PR #247 и убедиться, что `HTML validation`/`PHP lint`/деплой стартуют.
