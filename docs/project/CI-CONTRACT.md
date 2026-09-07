# Pacific Star — CI-CONTRACT

Фактические, проверенные на текущем состоянии репозитория правила CI, деплоя и локальных проверок. Собрано в PS-00; при расхождении GitHub — источник истины.

## Репозиторий

- **Repo**: `github.com/bossssmann-ui/pacificstar.ru`
- **Основная ветка**: `main`
- **Стек**: статические `.html`/`css`/`js` без сборки + опциональный Express-релей `server.js` (Nodemailer). Node `>=20 <25`. Лок-файл (`package-lock.json`) намеренно не коммитится (`.gitignore`).

## Проверки на Pull Request (фактические)

| Проверка | Источник | Триггер | Обязательная? |
|---|---|---|---|
| `GitGuardian Security Checks` | GitHub App (GitGuardian) | `pull_request` | Не подтверждено (защита ветки недоступна токену) |

Наблюдения (обновлено при уточнении PS-00): единственная проверка на PR `#230`, `#236`, `#243`, `#244`, `#245`, `#246` — `GitGuardian Security Checks` (Check Run, `app=gitguardian`, `pull_request`). Подтверждено через `GET /commits/{sha}/check-runs` (ровно один прогон) и `GET /commits/{sha}/status` (legacy-статусов нет: `total 0`). `mergeStateStatus` у `#245` — `CLEAN` при единственной зелёной проверке.

### ⚠️ «Три проверки» — не подтверждены (собраны доказательства)

Почему видно только GitGuardian — по фактам:

- **Нет workflow на событие `pull_request`.** `tilda-deploy.yml` — `push: [main]` + `workflow_dispatch` (деплой после merge, не PR-гейт); `figma-file-export.yml` — только `workflow_dispatch`. Локальные `npm run validate`/`spellcheck` в CI **не подключены** (запускаются только вручную).
- **Защита ветки недоступна токену, а не отсутствует.** `GET /branches/main/protection` и `.../required_status_checks` → **HTTP 403**, заголовок `X-Accepted-Github-Permissions: administration=read` (у интеграции нет `administration:read`). 403 **не** доказывает отсутствие защиты. `GET /rulesets` → `[]` (rulesets нет, но classic branch protection мог бы быть).
- **Косвенный признак**: `mergeStateStatus=CLEAN` при единственной проверке означает отсутствие невыполненных обязательных проверок с точки зрения интеграции; но конфиг защиты подтвердить по API нельзя.

Названия недостающих проверок **не выдумываются** и заглушки не создаются (раздел 3 плана). До выяснения merge не выполнять; обязательным гейтом считается `GitGuardian Security Checks`, missing/skipped/neutral успехом не считаются.

**Один конкретный запрос владельцу:** открыть на GitHub **Settings → Branches → Branch protection rules для `main`** (или Rulesets) и прислать список **Require status checks to pass** (точные названия), либо выдать интеграции право `administration: read`. Если задумано, что «три проверки» = GitGuardian + HTML‑валидация + проверка орфографии, их нужно **добавить отдельным `pull_request`‑workflow** (сейчас их в CI нет). Учесть: `validate`/`spellcheck` сейчас падают на `main` (предсуществующие замечания), поэтому делать их обязательными можно только после чистки контента — это решение владельца.

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
