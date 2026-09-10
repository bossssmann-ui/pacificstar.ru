# PS-11: Codex continuation — 2026-09-10

Base: PR #260, `1cfea14f5700ee5d38e68d2264810b04fa98ffc6`.
Status: READY_FOR_CI. No merge or production changes.

## Changes

- Added `missing-doctype: error` to HTML validation. The previous recommended preset accepts fragments and does not require a doctype. Reproduced: `<p>text</p>` passes without this rule and fails with it.
- Removed unused `hello.html` (test output) and `START.html` (obsolete installer landing page); removed their entries from the translation script's skip list. Repository reference search found only robots/llms exclusions and that skip list. Kept robots/llms exclusions because old deployed copies may remain. This change does not delete remote server files.
- Added `scripts/check-document-regressions.cjs` to the existing HTML validation CI job: explicit document structure, default RU language, real i18n-engine metadata cycles and missing-doctype negative check. No additional required check context introduced.
- No metadata engine change: existing snapshot restoration works in the tested scenarios.

## Local evidence

- `npm run validate`: PASS, all 22 remaining root/news documents.
- `node scripts/check-document-regressions.cjs`: PASS, 22 documents, RU/EN initial entry, RU/EN/ZH/JA/KO transitions, title/description restoration and fallback, negative doctype sample.
- Metadata tests execute the real engine in a Node VM with a metadata-only DOM adapter; these are unit checks, not browser rendering evidence.
- `npm run spellcheck`: FAIL, 3145 issues in 33 existing files; not fixed or suppressed in this scope.
- Browser access to the local preview returned `net::ERR_BLOCKED_BY_CLIENT`; additional desktop/mobile visual checks could not run in this session. Previous Cursor visual results are not independently re-certified.
- GitHub reports no PR-triggered workflow runs for #260 HEAD. Its base is a non-main branch, while CI triggers only PRs targeting main. This absence does not establish the current billing state. Remote CI must run after retargeting/updating the release bases; missing checks are not passes.

## Follow-up

- `js/i18n.js` still loads Google Fonts for ZH/JA/KO via `loadCJKFont`. Local Inter only removes that dependency for other languages. Treat CJK fonts as an open PS-06 criterion; do not report all languages as free of external fonts.
- Additional browser verification: contacts, account and service page at desktop/mobile after standards-mode transition.
- Production delivery, analytics dashboard, editorial approval and final integrated release checks remain pending.
- New GitHub connector exposes repository write operations; this supersedes the old Cursor tool limitation only for this session. Existing CI/review/release conditions remain unchanged.
