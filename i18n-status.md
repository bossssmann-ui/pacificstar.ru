# i18n Implementation Status

## Architecture

### Translation Engine (`js/i18n.js`)

- **Mechanism**: `data-i18n` attributes on DOM elements
- **Dictionary format**: Flat JSON files in `/locales/*.json` with dot-notation keys
- **Language storage**: `localStorage` key `ps-lang`
- **Default language**: Russian (text in HTML serves as no-JS fallback)
- **Dictionary loading**: XHR on demand; cached in memory after first load
- **HTML `lang` attribute**: Updated dynamically on language switch
- **URL param**: `?lang=en|zh|ja|ko` — applied on load; synced on switch via `history.replaceState`
- **Events**: `ps-lang-change` — calculator and other JS modules refresh on language change

### Key Structure (examples)

```
nav.home                          → Navigation links
footer.copyright                  → Footer elements
cta.request_quote                 → Call-to-action buttons
index.hero.title_line1            → Page-specific content
form.callback.title               → Form labels and messages
calc.transport.auto               → Calculator.js dynamic strings
form.js.submitting                → Form JS runtime messages
comp.header.logo_subtitle         → Shared component text
meta.index.title                  → Page titles and meta descriptions
```

### Dictionary Files

| File | Keys | Status |
|------|------|--------|
| `locales/ru.json` | 2204 | ✅ Complete (canonical) |
| `locales/en.json` | 2216 | ✅ Rewired + human-reviewed logistics terms |
| `locales/zh.json` | 2216 | ✅ Rewired + human-reviewed logistics terms |
| `locales/ja.json` | 1657 | ✅ Complete (RU→JA, 2026-07-08) |
| `locales/ko.json` | 1657 | ✅ Complete (RU→KO, 2026-07-08) |

## Refactored Files

| File | Changes |
|------|---------|
| `js/i18n.js` | Lean `data-i18n` engine; `?lang=` URL support; `ps-lang-change` event |
| `js/calculator.js` | i18n for options, errors, result block |
| `js/main.js` | i18n for form submit/error runtime messages |
| `js/components.js` | `data-i18n` on header, footer, mobile nav, callback panel |
| `locales/*.json` | Flat JSON dictionaries for ru / en / zh / ja / ko |

## Pages with `data-i18n` Coverage

| Page | Attributes | Status |
|------|------------|--------|
| `index.html` | 86 | ✅ i18n-complete |
| `about.html` | 64 | ✅ i18n-complete |
| `services.html` | 162 | ✅ i18n-complete |
| `contacts.html` | 59 | ✅ i18n-complete |
| `cases.html` | 44 | ✅ i18n-complete |
| `news.html` | skeleton keys | ✅ RU-only articles; `nav.news` + `news.*` in all 5 locales |
| `privacy.html` | 35 | ✅ i18n-complete |
| `account.html` | 121 | ✅ i18n-complete |
| `integrations.html` | 109 | ✅ i18n-complete |
| `remote-regions.html` | 162 | ✅ i18n-complete |
| `severnyy-zavoz.html` | 111 | ✅ i18n-complete |
| `kabotazh.html` | 91 | ✅ i18n-complete |
| `negabarit.html` | 103 | ✅ i18n-complete |
| `avto-dfo.html` | 94 | ✅ i18n-complete |
| `truck-delivery.html` | 83 | ✅ i18n-complete |
| `rail.html` | 95 | ✅ i18n-complete |
| `ved.html` | 72 | ✅ i18n-complete |

**Total**: 1900+ `data-i18n` / `data-i18n-html` attributes across 16 pages + shared components.

## Supported Languages

| Language | Code | Switcher | Translations |
|----------|------|----------|-------------|
| Russian | `ru` | ✅ | ✅ Complete (base language in HTML) |
| English | `en` | ✅ | ✅ Complete |
| Chinese | `zh` | ✅ | ✅ Complete |
| Japanese | `ja` | ✅ | ✅ Complete |
| Korean | `ko` | ✅ | ✅ Complete |

## SEO / hreflang

- [x] `hreflang` tags for `ru`, `en`, `zh`, `ja`, `ko`, `x-default` on public pages
- [x] English alternate: `?lang=en` (same for zh/ja/ko)
- [ ] Per-language sitemaps (optional future)
- [ ] Language-specific URL prefixes `/en/` (optional future)

## Remaining i18n work

- [ ] Human review / edit of machine-translated EN/ZH/JA/KO (especially VED and legal text)
- [ ] Some multi-line HTML blocks with nested `<a>` / `<strong>` may need split `data-i18n` keys

*Last updated: 2026-07-08*
