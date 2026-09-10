# PS-11: delayed dictionary replies — 2026-09-10

Base: PR #262, 9786dd2cdc9874514b392d0e9623560955ff078e.
Status: DRAFT / cache-version update blocked; no merge/publication.

Reproduced a real race: select EN then RU before the EN dictionary arrives.
The old callback changes the DOM back to EN although the URL and saved selection
remain RU. An incrementing request identifier now ignores outdated callbacks.
A stale response can still populate the dictionary cache for future use.
No translation content, URL architecture or default-language policy changed.

Added a controlled asynchronous unit regression running the actual engine:
- delayed EN after selecting RU;
- ZH/JA replies in reverse order;
- delayed KO after selecting cached EN.
The first scenario failed before the fix and all scenarios pass after it.
Existing checks over all 22 HTML pages and metadata restoration still pass.
Both regression scripts run inside the existing HTML validation job.
JavaScript syntax and diff checks pass. HTML cache-version updates exist only locally. Automated approval rejected transmitting the HTML even after explicit owner confirmation. This PR contains only code, tests and this report; existing HTML remains unchanged. Complete the i18n.js cache-version updates before release.
These are Node VM checks, not a new visual/browser or production certification.
