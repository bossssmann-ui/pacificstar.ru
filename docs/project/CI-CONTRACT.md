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

Наблюдения: единственная проверка на PR `#230`, `#236`, `#243`, `#244` — `GitGuardian Security Checks` (pass). Других статус-проверок на PR не обнаружено.

### ⚠️ «Три проверки» — не подтверждены

Владелец сообщил о трёх обязательных проверках, но:

- На реальных PR присутствует **одна** проверка (`GitGuardian Security Checks`).
- `GET /repos/.../branches/main/protection` → **HTTP 403** («Resource not accessible by integration») — текущий токен не может прочитать защиту ветки.
- `GET /repos/.../rulesets` → пустой список `[]`.

Названия трёх проверок **не выдумываются** (запрет плана, раздел 3). Требуется от владельца: точные названия трёх ожидаемых проверок и/или доступ к настройкам защиты ветки `main`. До подтверждения обязательным гейтом считается `GitGuardian Security Checks`; отсутствующая/ожидающая/нейтральная/пропущенная проверка не считается успехом.

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
