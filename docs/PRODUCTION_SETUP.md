# Production Setup — Poker Odds Lab

This covers what changed in the CRITICAL-fix pass and the steps only you can do
(creating accounts, setting secrets, provisioning the database). Do these before
onboarding any paying customer.

## What was fixed in code

- **Real Clerk auth** (`apps/api/src/middleware/auth.ts`) — verifies the session
  JWT with `@clerk/backend`, resolves the user's email, and **refuses to boot in
  production without `CLERK_SECRET_KEY`** (no more `x-user-id` impersonation).
- **Stripe billing** (`apps/api/src/routes/index.ts`, `apps/api/src/lib/stripe.ts`)
  — real Checkout for lifetime/monthly/annual with idempotency keys, plus a
  Billing Portal endpoint. A `stripe_customer_id` column was added to `users`.
- **Verified webhooks** (`apps/api/src/routes/webhooks.ts`) — Clerk (Svix) and
  Stripe signatures are now verified; unsigned/forged payloads are rejected.
  Webhooks are mounted before the JSON body parser so raw bytes are preserved.
- **HTTP hardening** (`apps/api/src/app.ts`) — `helmet` headers, CORS locked to a
  `FRONTEND_URL` allowlist that **fails closed in production**, and rate limiting
  (120 req/min/IP on the API).
- **Account deletion** (`DELETE /api/account`) — cascades to all user data, for
  GDPR/CCPA.
- **Frontend paywall** (`apps/web/src/components/Paywall.tsx`) — now calls real
  Stripe Checkout when the API is connected (the old client-side "simulate
  unlock" only remains in local-only mode).
- **Frontend Clerk auth** (`apps/web/src/lib/auth.tsx`, `main.tsx`, `App.tsx`) —
  `ClerkProvider` (mounted only when `VITE_CLERK_PUBLISHABLE_KEY` is set), a
  Sign-in button + `UserButton` in the header, and the web API client now sends
  `Authorization: Bearer <clerk token>` (falling back to the dev header only in
  local-only mode). `@clerk/clerk-react` added to web deps.
- **API observability** (`apps/api/src/lib/logger.ts`, `lib/sentry.ts`) — Sentry
  error tracking (no-op until `SENTRY_DSN` is set), a structured JSON logger
  replacing `console.*`, error-handler capture, and `unhandledRejection` /
  `uncaughtException` handlers. `@sentry/node` added to API deps.
- **Legal drafts** — `docs/TERMS.md` and `docs/PRIVACY.md`.

## Steps you need to do

1. **Install new dependencies** (from repo root): `npm install`.
   New API deps: `@clerk/backend`, `stripe`, `svix`, `helmet`, `express-rate-limit`,
   `@sentry/node`. New web dep: `@clerk/clerk-react`.

2. **Provision the database (Neon).** Create a Neon Postgres project, put its
   connection string in `apps/api/.env` as `DATABASE_URL`, then run
   `npm run db:push --workspace=apps/api`. Without this the API still falls back
   to the in-memory store (data is lost on restart) — so this is required for prod.

   > Because the `users` table gained `stripe_customer_id`, run `db:push` even if
   > you created the database earlier.

3. **Clerk.** Create a Clerk application. Set `CLERK_SECRET_KEY` and
   `CLERK_WEBHOOK_SECRET` (api) and `VITE_CLERK_PUBLISHABLE_KEY` (web). Point a
   Clerk webhook at `POST /api/webhooks/clerk` for `user.created`, `user.updated`,
   `user.deleted`.

   > Frontend Clerk is now wired: setting `VITE_CLERK_PUBLISHABLE_KEY` turns on the
   > sign-in UI and bearer-token auth automatically. Leave it unset for local-only
   > mode. If you use a custom session-token JWT template, you can add `email` to
   > the claims to save the API a Clerk lookup on first request (optional).

4. **Stripe.** Create three Prices (lifetime one-time $29.99, monthly $9.99,
   annual $59.99). Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_LIFETIME_PRICE_ID`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID`.
   Point a Stripe webhook at `POST /api/stripe/webhooks` for
   `checkout.session.completed`, `customer.subscription.deleted`,
   `invoice.payment_failed`.

5. **CORS / URLs.** Set `FRONTEND_URL` (api) to your real frontend origin(s),
   comma-separated. Set `NODE_ENV=production`. Set `VITE_API_URL` (web) to the
   deployed API URL.

6. **Observability (optional but recommended).** Create a Sentry project and set
   `SENTRY_DSN` (api). Leave it unset and error tracking is simply disabled.

7. **Publish the legal docs.** Fill every `[BRACKETED]` placeholder in
   `docs/TERMS.md` and `docs/PRIVACY.md`, have a lawyer review, and link them in
   the app footer.

## Deployment (config now in the repo)

- **API → Railway** (`railway.json`): builds with `npm install`, starts with
  `npm run start:api`, health-checks `GET /api/health`, restarts on failure.
  Create a Railway project from this repo and add the API env vars (`DATABASE_URL`,
  `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `STRIPE_*`, `FRONTEND_URL`,
  `NODE_ENV=production`, optional `SENTRY_DSN`). The API runs TypeScript via `tsx`
  (moved to runtime deps so it survives production installs).
- **Web → Vercel** (`vercel.json`): installs at the repo root (so the workspace
  engine resolves), builds `apps/web`, serves `apps/web/dist`, with an SPA rewrite
  so React Router deep links work. Add the web build env vars in Vercel
  (`VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`).
- **CI → GitHub Actions** (`.github/workflows/ci.yml`): on push/PR it runs the
  engine tests, API typecheck, and the web build. All three pass as of this pass.

> **Lockfile:** the dependency additions mean `package-lock.json` is out of date.
> Run `npm install` locally once and commit the refreshed lockfile. All deploy/CI
> steps use `npm install` (not `npm ci`), so they self-heal, but a committed lock
> keeps builds reproducible.

## Still open (not in this pass)

- **Uptime monitoring** — point an external monitor (UptimeRobot/Better Stack) at
  `GET /api/health`. Error tracking + logging are in place; a ping monitor is the
  remaining piece.
- **Staging environment** — CI + deploy configs exist, but no separate staging DB
  is provisioned yet.
- **Server-side plan/usage enforcement** — free-tier caps are still client-side.

## Verification done

- API typechecks clean (`tsc --noEmit`, exit 0) with all changes.
- Web app typechecks clean (`tsc --noEmit -p apps/web/tsconfig.json`, exit 0),
  including the Clerk provider, header UI, and bearer-token client.
- Engine test suite: 37/37 passing.
- Full web production build (`tsc -b && vite build`) succeeds.
- API boots under `tsx` and serves: `/api/health` returns ok, dev-auth routes
  return 200, and Stripe routes correctly return 501 when unconfigured.
