# Copilot Instructions — pacificstar.ru

## Project overview

Public website for **Pacific Star** (ООО «Pacific Star»), a B2B freight-forwarding and logistics company based in the Russian Far East. The site drives lead generation, builds commercial trust, and supports SEO for the company's core services:

1. Northern delivery / seasonal supply logistics (Северный завоз, 411-ФЗ)
2. Cabotage shipping in the Russian Far East (Сахалин, Магадан, Камчатка, Чукотка)
3. Project and oversized cargo transportation
4. Truck delivery to remote Far East regions
5. Rail logistics as part of multimodal solutions
6. Foreign trade logistics (Asia-Pacific, CIS)

## Stack and architecture

| Layer | Details |
|-------|---------|
| HTML | Static `.html` pages at the repo root (`index.html`, `about.html`, `services.html`, `contacts.html`, etc.) |
| CSS | Hand-written CSS in `css/` — `style.css` (global), `premium-theme.css` (theme tokens), `premium-features.css` (component-level) |
| JS | Vanilla JS in `js/` — `main.js`, `map-svg.js`, `map-geodata.js`, `calculator.js`, `i18n.js`, `currency.js`, `animations.js`, `premium-features.js` |
| Fonts | Google Fonts `Inter` (preconnected) |
| Server | `server.js` — Express + Nodemailer for the contact form SMTP relay; **not** part of the static site |
| Vendor | `vendor/leaflet.js` + `vendor/leaflet.css` (legacy, currently unused on homepage) |
| Data | `data/world-countries.geo.json` — Natural Earth GeoJSON for the SVG map |
| Hosting | Timeweb shared hosting; deployed via GitHub Actions (`tilda-deploy.yml`) over SSH on merge to `main` |
| Linting | `html-validate` (recommended preset), `cspell` (Russian + English dictionaries) |
| Cache busting | `?v=YYYYMMDD[x]` query strings on all CSS/JS `<link>`/`<script>` tags |

There is **no build step, no bundler, no framework**. The repo is served as-is.

## Coding conventions

- **ES5-compatible JS** — use `var`, `function`, `forEach`; avoid arrow functions, `let`/`const`, template literals, optional chaining, `??`. The site must work in older WebViews and Safari ≤ 12.
- **CSS custom properties** are defined in `:root` (`--color-primary`, `--color-accent`, `--font-sans`, `--radius`, etc.). Reuse them; don't invent new palettes.
- **Semantic HTML** — use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<figure>`, `<time>`, etc.
- **BEM-like class naming** — lowercase, hyphenated (`.service-card`, `.hero-title`, `.nav-dropdown-link`).
- **Mobile-first** — base styles target small screens; `@media (min-width: …)` for larger breakpoints.
- **Comments in English** — code comments, variable names, and commit messages must be in English, even though page content is in Russian.
- Each HTML page includes the same `<header>` / `<footer>` / navigation markup. Keep them consistent across pages.
- Bump `?v=` query strings when you modify a CSS or JS file.

## Deployment safety

- The site is **automatically deployed on merge to `main`**. Every commit to `main` goes live.
- Never add server-side dependencies, build steps, or config that would break static file serving.
- Never commit secrets, `.env` files, or credentials.
- Keep `robots.txt`, `sitemap.xml`, and canonical URLs in sync with actual pages.
- Test HTML changes with `npm run validate` before committing.
- Test spelling with `npm run spellcheck`.

## Quality priorities

1. **SEO** — preserve `<title>`, `<meta description>`, canonical URLs, JSON-LD structured data, Open Graph tags on every page. Add them to new pages.
2. **Core Web Vitals** — minimise layout shift (set explicit image dimensions), defer non-critical JS, avoid render-blocking resources.
3. **Contact visibility** — phone numbers, email, and callback CTAs must be reachable from every page without scrolling on mobile.
4. **Conversion-focused CTAs** — every service page should end with a clear call-to-action (callback form or contact link).
5. **Accessibility** — use `alt` on images, `aria-label` on icon-only buttons, `:focus-visible` outlines, sufficient colour contrast.
6. **Responsiveness** — layouts must work from 320 px to 1920 px+.

## Visual style

- **Do**: industrial, maritime, northern, structured, trustworthy — deep navy, steel-blue, muted amber accents, clean whitespace.
- **Don't**: neon gradients, glassmorphism, startup clichés, excessive animations, SaaS-style hero illustrations.
- Keep transitions ≤ 0.3 s. Prefer `opacity` + `transform` for animations. Disable all non-essential motion when `prefers-reduced-motion: reduce` is active.
- Photography and icons should evoke cargo ships, containers, snow-covered ports, northern routes — not generic stock photos.

## Code change guidelines

- Make **surgical, minimal changes**. Don't rewrite files for style preferences.
- When modifying UI, preserve or improve usability, readability, and responsiveness.
- When adding a new page, copy the `<head>`, header, and footer from an existing page to stay consistent.
- Avoid adding heavy libraries (React, Vue, Tailwind, Bootstrap, jQuery). The project uses vanilla HTML/CSS/JS intentionally.
- If a new dependency is truly needed, add it to `vendor/` as a self-contained file — not via CDN or npm runtime dependency.
- Favour modular, production-ready code. No TODO-only stubs or half-implemented features.
- Run `npm run validate` and `npm run spellcheck` after changes.
