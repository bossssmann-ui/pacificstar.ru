# PS-04: consent gates — 2026-09-11

Base: 5948920fc486979ee5501e8470951fbe66c69fc0,
codex/ps06-cjk-system-fonts (contains the merged #263 code).
Status: DRAFT; no merge/publication.

The real analytics module sent explicit goals without consent when provider
functions were already present. Reproduced before the fix using a Node VM.
Now every explicit event checks consent; provider initialization verifies consent
and is idempotent. A false notification does not consume the listener, so a later
valid grant works. Interactions before consent are not replayed, and a new form
interaction after consent can still emit form_start once.

Checks: denied consent with preloaded providers, false grant notification,
valid grant, repeated grants, form_start deduplication, lead event, withdrawal,
and inaccessible storage all pass. Existing 22-document/metadata checks and
language race checks pass; JavaScript syntax and diff checks pass.
These are unit tests, not proof of production analytics dashboard configuration.
Previously loaded SDK automatic collection is not disabled by this patch:
revocation of SDK-level auto tracking remains a separate integration task.

HTML files are deliberately not part of the remote payload due to the earlier
automatic approval rejection. Updating analytics.js cache versions before release
remains pending, along with the i18n.js version update documented in #263.
The deployed site is unchanged. No new visual verification performed.

Branch state: #262 and #263 are merged into working branches, not main.
#261 remains open with the CJK changes; the later #263 merge still needs
propagation into its parent line before the final integrated release.
