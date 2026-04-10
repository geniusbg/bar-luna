# Audit: Luna / bar-luna references (Фаза 0, стъпка 3)



Generated as part of **malls-v1** plan. Updated as **Фаза 7** cleanup progresses.



## Cleaned in app (2026-04-09)



- `app/globals.css` — Luna-prefixed CSS variables and `.luna-*` classes replaced with `--app-*` and `.malls-*` utilities (`malls-hero-glow`, etc.).

- `app/[locale]/page.tsx` — hero CTA uses `malls-hero-glow`.

- `public/sw.js` — cache name `malts-web-*`, push defaults **Malts** + `malts.svg`; version bumped (invalidates old caches).

- `app/[locale]/admin/orders/page.tsx` — CSV export filename `malls-orders-*.csv`.

- `components/EventForm.tsx` — default internal venue location **Malls, Русе**.

- `messages/*` — key `at_luna` renamed to `at_malls` (unused in code; reserved for future).



## Still present (after cleanup)



- `middleware.ts` — `luna-icon|luna-logo` bypass removed after deleting `public/luna-*` assets.

- `app/[locale]/contact/page.tsx` — placeholders for social links until marketing supplies Malls-specific links.

- `public/luna-*` — deleted.

- `docs/archive/` — deleted.



## Docs / archive



- `docs/archive/` content was deleted as requested.



## Optional follow-ups



- Fill real Instagram/Facebook links on contact page + `.knowledge-base/client.md`.

- Refresh `DEPLOYMENT.md` / archive deploy scripts for `malts-ruse.com` and DB `malls` if you rely on them.


