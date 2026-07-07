# Pacific Star — pacificstar.ru

Production website for **Pacific Star** (ООО «Pacific Star»), a B2B freight-forwarding and logistics company in the Russian Far East. The site drives lead generation through SEO-optimized service pages, an interactive route map, a callback form, and a cost calculator.

**Development roadmap:** [ROADMAP.md](ROADMAP.md) — QA baseline, GEO/AI-search strategy, phased implementation plan.

---

## Business purpose

The site promotes six core service lines:

1. **Northern delivery** (Северный завоз) — seasonal supply logistics under 411-ФЗ
2. **Cabotage shipping** — Sakhalin, Magadan, Kamchatka, Chukotka
3. **Oversized / project cargo** — heavy and non-standard freight
4. **Truck delivery** — road logistics to remote Far East regions
5. **Rail logistics** — multimodal rail solutions
6. **Foreign trade logistics** (ВЭД) — Asia-Pacific, CIS

Every service page ends with a call-to-action (callback form or contact link). Phone number and email are visible from every page without scrolling on mobile.

---

## Tech stack

| Layer | Details |
|-------|---------|
| HTML | Static `.html` pages at the repo root — no build step, no framework |
| CSS | Hand-written files in `css/` (see [Styles](#styles) below) |
| JS | Vanilla ES5-compatible scripts in `js/` (see [Scripts](#scripts) below) |
| Font | Google Fonts `Inter` (preconnected) |
| Server | `server.js` — Express + Nodemailer SMTP relay for the contact form; **not** part of the static site |
| Hosting | Timeweb shared hosting; auto-deployed via GitHub Actions on merge to `main` |
| Linting | `html-validate` (recommended preset) + `cspell` (Russian + English) |

There is **no bundler, no transpiler, no SPA framework**. Files are served as-is.

---

## Repository structure

```
pacificstar.ru/
├── index.html                — Homepage (hero, SVG route map, services overview)
├── about.html                — About the company
├── services.html             — All services overview
├── severnyy-zavoz.html       — Northern delivery (411-ФЗ)
├── kabotazh.html             — Cabotage shipping
├── negabarit.html            — Oversized / project cargo
├── avto-dfo.html             — Truck delivery (Far East)
├── truck-delivery.html       — Truck delivery to remote regions
├── rail.html                 — Rail logistics
├── ved.html                  — Foreign trade logistics (ВЭД)
├── remote-regions.html       — Sea delivery to remote regions
├── cases.html                — Case studies / completed projects
├── contacts.html             — Contact form + office map
├── privacy.html              — Privacy policy
├── account.html              — Personal account (internal, not indexed)
├── integrations.html         — Integrations page (internal, not indexed)
├── css/
│   ├── style.css             — Global layout, typography, components
│   ├── premium-theme.css     — CSS custom property tokens (:root palette)
│   ├── premium-features.css  — Component-level styles (map, animations, widgets)
│   └── services.css          — Service page-specific styles
├── js/
│   ├── main.js               — Navigation, preloader, callback widget, theme toggle
│   ├── map-geodata.js        — GeoJSON world data (window.WORLD_GEOJSON)
│   ├── map-svg.js            — SVG Mercator route map (50+ cities, 6 routes)
│   ├── calculator.js         — Cost calculator widget
│   ├── currency.js           — CBR exchange rates widget
│   ├── i18n.js               — Language switcher (RU/EN/ZH/JA/KO)
│   ├── animations.js         — Scroll-triggered fade-in animations
│   ├── premium-features.js   — Premium UI components
│   ├── analytics.js          — Analytics helpers (Yandex Metrika, GA)
│   ├── components.js         — Reusable UI component helpers
│   └── account.js            — Personal account logic
├── img/                      — Images, logos, favicon
│   └── partners/             — Partner/port logo SVGs
├── data/
│   └── world-countries.geo.json — Natural Earth GeoJSON for the SVG map
├── previews/                 — Page screenshots (not deployed)
├── server.js                 — Express SMTP relay for contact form
├── .env.example              — SMTP config template
├── sitemap.xml               — XML sitemap for search engines
├── robots.txt                — Crawler directives
├── .htaccess                 — Apache rewrite / caching rules
├── package.json              — Dev dependencies (html-validate, cspell)
└── .github/workflows/
    ├── tilda-deploy.yml      — Auto-deploy to Timeweb on push to main
    └── figma-file-export.yml — Manual Figma JSON export
```

---

## Styles

All CSS lives in `css/`. No preprocessor.

| File | Purpose |
|------|---------|
| `premium-theme.css` | Design tokens — colors (`--color-primary`, `--color-accent`), typography (`--font-sans`), radii, shadows. Edit here to change the global palette. |
| `style.css` | Global layout, header, footer, navigation, typography, form components, responsive breakpoints. |
| `premium-features.css` | SVG map styles, animation keyframes, preloader, callback panel, dark-theme overrides, widget-level components. |
| `services.css` | Styles specific to individual service pages (hero, case cards, feature grids). |

**Conventions:**
- Mobile-first: base styles target small screens; `@media (min-width: …)` for larger breakpoints.
- BEM-like class naming: lowercase, hyphenated (`.service-card`, `.hero-title`, `.nav-dropdown-link`).
- Reuse CSS custom properties from `:root` — don't invent new palettes.

---

## Scripts

All JS lives in `js/`. No build step, no modules.

**Important:** Write ES5-compatible code — `var`, `function`, `forEach`. No arrow functions, `let`/`const`, template literals, optional chaining, or `??`. The site must work in older WebViews and Safari ≤ 12.

| File | Purpose |
|------|---------|
| `main.js` | Burger menu, preloader, callback panel, theme toggle (dark/light), scroll-to-top, mobile nav. |
| `map-svg.js` | Full SVG route map: 50+ cities, 6 animated routes (international sea, Trans-Siberian, NSR, cabotage, etc.), pan/zoom/touch, theme picker. |
| `map-geodata.js` | Sets `window.WORLD_GEOJSON` from embedded Natural Earth data. |
| `calculator.js` | Freight cost calculator form and logic. |
| `currency.js` | Fetches CBR exchange rates and renders a currency widget. |
| `i18n.js` | Client-side language switcher (RU, EN, ZH, JA, KO). |
| `animations.js` | IntersectionObserver-based `.fade-in` scroll animations. |
| `premium-features.js` | Premium UI component initialization. |
| `analytics.js` | Yandex Metrika and Google Analytics event helpers. |

---

## How to edit content

1. **Text changes** — edit the relevant `.html` file directly. Each page is self-contained HTML.
2. **Shared header/footer** — every page includes the same `<header>` and `<footer>` markup. If you change navigation links, update **all** HTML files.
3. **Images** — add to `img/`, use `width`/`height` attributes to avoid layout shift, compress before committing.
4. **Partner logos** — add SVG files to `img/partners/`.

### Cache busting

All `<link>` and `<script>` tags use `?v=YYYYMMDD` query strings (e.g. `style.css?v=20260412d`). **Bump the version** whenever you modify a CSS or JS file so visitors don't get stale cached versions.

---

## How to add a new case study

Cases are on `cases.html`. Each case is an `<article class="case-card">` inside `#casesGrid`.

1. Copy an existing `<article class="case-card" data-category="...">` block.
2. Set `data-category` to one of: `northern`, `cabotage`, `oversized`, `truck`, `rail`, `foreign`.
3. Fill in the `<h3>` title and `<dl class="case-card-details">` definition list (route, cargo, task, solution, result).
4. The filter buttons at the top already cover all categories — no JS changes needed.

---

## SEO

Every public page includes:

- `<title>` with target keywords
- `<meta name="description">` (unique per page)
- `<link rel="canonical">` pointing to the production URL
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- `<meta name="robots" content="index, follow">`
- JSON-LD structured data (BreadcrumbList on service pages; Organization + LocalBusiness on the homepage)

**Sitemap and robots:**
- `sitemap.xml` — lists all public pages with priority and change frequency. Update it when adding or removing pages.
- `robots.txt` — allows all crawlers, blocks internal pages (`account.html`, `integrations.html`, `logos.html`, etc.), points to the sitemap.

**When adding a new page:**
1. Add SEO meta tags (copy from an existing service page).
2. Add the URL to `sitemap.xml`.
3. Verify `robots.txt` — allow indexing if the page is public, disallow if internal.
4. Include JSON-LD BreadcrumbList.

---

## Deployment

The site auto-deploys to Timeweb on every push to `main`.

**Workflow:** `.github/workflows/tilda-deploy.yml`
- Checks out the repo, excludes dev files (`.github/`, `node_modules/`, `previews/`, `*.md`, `package.json`).
- Uploads via FTP (lftp) with SSH/rsync as fallback.
- Verifies the site responds with HTTP 200 after deploy.

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `TIMEWEB_HOST` | Server IP address |
| `TIMEWEB_USER` | Hosting login |
| `TIMEWEB_PASSWORD` | Hosting password |

**Manual trigger:** [Actions → Deploy workflow → Run workflow](https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml)

Detailed instructions: [TIMEWEB_DEPLOY.md](TIMEWEB_DEPLOY.md)

---

## Local development

No build step required. Open any `.html` file in a browser, or use a local server:

```bash
# Install dev tools (html-validate, cspell)
npm install

# Validate HTML
npm run validate

# Check spelling (Russian + English)
npm run spellcheck

# Run the SMTP relay (optional — only needed for the contact form)
cp .env.example .env   # fill in SMTP credentials
npm start              # starts Express on port 3000
```

---

## What not to break

- **Auto-deploy pipeline** — every merge to `main` goes live. Don't commit broken HTML.
- **SEO tags** — don't remove `<title>`, `<meta description>`, canonical URLs, or JSON-LD blocks.
- **Shared header/footer** — keep navigation consistent across all pages.
- **ES5 compatibility** — no `const`, `let`, arrow functions, template literals, `?.`, `??` in JS.
- **No heavy frameworks** — no React, Vue, Tailwind, Bootstrap, jQuery. Vanilla HTML/CSS/JS only.
- **No build dependencies** — the repo is served as static files. Don't add bundlers or transpilers.
- **Secrets** — never commit `.env`, credentials, or API keys.
- **`robots.txt` / `sitemap.xml`** — keep in sync with actual pages.
- **Cache-busting versions** — bump `?v=` strings when modifying CSS/JS files.
- **Contact visibility** — phone, email, and callback CTAs must be reachable from every page.

---

## Figma export (optional)

A manual workflow exports Figma file JSON for design reference.

1. Add `FIGMA_ACCESS_TOKEN` to GitHub Secrets.
2. Run the [Figma export workflow](https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/figma-file-export.yml) with the file key.
3. Download the `figma-file-json` artifact.

---

## Links

| | |
|--|--|
| Production site | https://pacificstar.ru |
| Deploy workflow | [tilda-deploy.yml](https://github.com/bossssmann-ui/pacificstar.ru/actions/workflows/tilda-deploy.yml) |
| Pull requests | [github.com/…/pulls](https://github.com/bossssmann-ui/pacificstar.ru/pulls) |
| GitHub Secrets | [settings/secrets/actions](https://github.com/bossssmann-ui/pacificstar.ru/settings/secrets/actions) |
