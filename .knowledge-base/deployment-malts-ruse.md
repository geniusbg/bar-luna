# Deployment checklist — malts-ruse.com

Use before first production deploy and after major schema changes.

## Environment

- [ ] `DATABASE_URL` — PostgreSQL (e.g. Neon), database name `malts` or as configured.
- [ ] **Production Postgres**: prefer SSL, e.g. append `?sslmode=require` to `DATABASE_URL` when using hosted DBs.
- [ ] `NEXTAUTH_URL` / `NEXTAUTH_SECRET` — set for production domain.
- [ ] `NEXT_PUBLIC_APP_URL` — `https://malts-ruse.com` (or staging URL).
- [ ] `PUSHER_*` — real-time (waiter/kitchen) if used.
- [ ] `DEFAULT_BRAND_SLUG` — matches seeded `Brand.slug` (default **`malts`**).
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` — initial super admin (change password after first login).

## Database

- [ ] `npx prisma migrate deploy` (or `db push` only for throwaway envs).
- [ ] `npm run db:seed` if demo data is desired.

## Build

- [ ] `npm ci` (or `npm install`).
- [ ] `npm run build` succeeds.
- [ ] Smoke: home, menu (3-level categories), order flow, waiter login.

## Post-deploy

- [ ] HTTPS and correct `NEXTAUTH_URL`.
- [ ] Replace default admin password; restrict admin access.

**PM2:** default app name in `ecosystem.config.js` is `malts-web` (override with `APP_NAME` in `.env`).

## Local smoke commands (quick)

- [ ] Start prod server: `npm run build` then `npm run start`
- [ ] Check: `/api/health`, `/{locale}`, `/{locale}/menu`, `/{locale}/order`, `/{locale}/admin/login`
- [ ] Verify protected endpoints return **403/401** when unauthenticated (e.g. `/api/operational-settings/audit`)

See also: `audit/2026-04-09-luna-refs-remaining.md` for optional cleanup (archive paths, PWA icons).
