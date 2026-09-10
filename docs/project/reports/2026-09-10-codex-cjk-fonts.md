# PS-06: CJK font requests — 2026-09-10

Base: PR #261, c4838996acfdad4f00dc27841e2ebc336c594c9f.
Status: READY_FOR_CI; no merge or publication.

Removed the dynamic Google Fonts loader for Chinese, Japanese and Korean.
Language-specific CSS uses self-hosted Inter plus locally installed CJK fonts
and a generic sans-serif fallback. No Noto binary files were added or claimed
as self-hosted; appearance depends on the operating system's available fonts.
The existing --font-sans token applies consistently to headings, body and controls.
Returning to RU/EN restores the existing CSS defaults. Cache versions updated.

Validation: all 22 HTML documents and metadata language cycles pass; the regression
check now rejects injected resources during language switching. The previous
engine fails this check, the modified engine passes. No Google Fonts endpoints
remain in active HTML/JS/CSS. JavaScript syntax and git diff checks pass.
Browser rendering across CJK operating systems remains unverified; the local
preview was inaccessible to this session's browser in the previous task.
No redesign or new branding introduced. Existing CSpell backlog unchanged.
