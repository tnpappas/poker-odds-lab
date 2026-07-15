# Poker Odds Lab — Go-Live Checklist

Work top to bottom. Everything above the line is code that's already done; this
checklist is the external setup only you can do. Estimated time end to end: a
focused afternoon.

---

## 0. Commit the code that's already written

- [ ] Refresh the lockfile and push everything (exact steps in the section at the
      bottom of this file: "Refresh package-lock.json and push").
- [ ] Confirm the GitHub Actions "CI" check goes green on the push.

---

## 1. Database — Neon (Postgres)

- [ ] Create a Neon project at neon.tech.
- [ ] Copy the connection string (the pooled one) into `apps/api/.env` as
      `DATABASE_URL=...`.
- [ ] From the repo root run: `npm run db:push --workspace=apps/api`
      (creates the tables, including the new `stripe_customer_id` column).
- [ ] Sanity check: start the API (`npm run dev:api`) and open
      `http://localhost:3001/api/health` — `storage` should read `"postgres"`,
      not `"memory"`.

## 2. Auth — Clerk

- [ ] Create a Clerk application at clerk.com.
- [ ] Copy keys into env:
  - [ ] `apps/api/.env`: `CLERK_SECRET_KEY=...`
  - [ ] `apps/web/.env`: `VITE_CLERK_PUBLISHABLE_KEY=...`
- [ ] In Clerk → Webhooks, add an endpoint pointing at
      `https://<your-api-domain>/api/webhooks/clerk` and subscribe to
      `user.created`, `user.updated`, `user.deleted`.
- [ ] Copy that webhook's signing secret into `apps/api/.env` as
      `CLERK_WEBHOOK_SECRET=...`.
- [ ] Smoke test: with the keys set, load the web app — you should see a "Sign in"
      button; sign up, and confirm the user appears in Clerk and in your Neon
      `users` table.

## 3. Payments — Stripe

- [ ] Create three Prices in the Stripe dashboard (Products):
  - [ ] Lifetime — one-time, $29.99
  - [ ] Pro Monthly — recurring monthly, $9.99
  - [ ] Pro Annual — recurring yearly, $59.99
- [ ] Copy the price IDs and secret key into `apps/api/.env`:
      `STRIPE_SECRET_KEY`, `STRIPE_LIFETIME_PRICE_ID`, `STRIPE_MONTHLY_PRICE_ID`,
      `STRIPE_ANNUAL_PRICE_ID`.
- [ ] Copy the publishable key into `apps/web/.env` as
      `VITE_STRIPE_PUBLISHABLE_KEY`.
- [ ] In Stripe → Webhooks, add an endpoint at
      `https://<your-api-domain>/api/stripe/webhooks` subscribed to
      `checkout.session.completed`, `customer.subscription.deleted`,
      `invoice.payment_failed`. Copy its signing secret into
      `STRIPE_WEBHOOK_SECRET`.
- [ ] Smoke test in Stripe **test mode**: sign in, click a plan on the paywall,
      complete checkout with card `4242 4242 4242 4242`, and confirm the user's
      `plan` flips to `pro`/`lifetime` in the database and the PRO badge appears.

## 4. Observability — Sentry (optional but recommended)

- [ ] Create a Sentry project (Node).
- [ ] Put the DSN in `apps/api/.env` as `SENTRY_DSN=...`.
- [ ] Trigger a test error and confirm it lands in Sentry.

## 5. Deploy

- [ ] **API → Railway:** create a project from the GitHub repo. Railway reads
      `railway.json` automatically. Add every `apps/api` env var from above, plus
      `NODE_ENV=production` and `FRONTEND_URL=https://<your-web-domain>`.
- [ ] **Web → Vercel:** import the repo. Vercel reads `vercel.json`. Add the
      `apps/web` build env vars: `VITE_API_URL=https://<your-api-domain>`,
      `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`.
- [ ] Update the Clerk and Stripe webhook URLs to the deployed API domain.
- [ ] Re-run the smoke tests (sign-up + test checkout) against production.

## 6. Legal

- [ ] Fill every `[BRACKETED]` placeholder in `docs/TERMS.md` and
      `docs/PRIVACY.md`.
- [ ] Have a lawyer review them (especially refunds, liability, arbitration).
- [ ] Publish them and link both in the app footer.

## 7. Monitoring

- [ ] Point an uptime monitor (UptimeRobot or Better Stack, both have free tiers)
      at `https://<your-api-domain>/api/health` with alerts to your email/phone.

---

## Go/no-go gate before charging real money

Do not switch Stripe to live mode until ALL of these are true:

- [ ] A real sign-up creates a user in the production database.
- [ ] A test-mode purchase flips the plan and the PRO features unlock.
- [ ] Cancelling a subscription (Stripe portal) downgrades the plan back to free.
- [ ] `DELETE /api/account` removes the user and their data.
- [ ] Terms of Service and Privacy Policy are published and linked.
- [ ] The uptime monitor is live and alerting.

---

## Refresh the lockfile, connect git, and push

Two things to know before running these:

1. This local folder is **not yet a git repository**, so we initialize it and
   connect it to your existing GitHub repo (`tnpappas/poker-odds-lab`).
2. PowerShell blocks `npm`'s script shim, so we call `npm.cmd` instead (same
   thing, just not blocked). `git` is unaffected.

The GitHub repo currently holds only an early "Initial commit" — this local folder
is the complete, up-to-date copy, so we push it up as the new `main` (the
`--force` replaces that early commit; nothing important is lost).

Open PowerShell in the project folder and run these one at a time:

```powershell
cd C:\Users\troyn\projects\poker-odds-lab

npm.cmd install
```

`npm.cmd install` reads the updated `package.json` files, downloads the new
packages into `node_modules` (git-ignored, not committed), and rewrites
`package-lock.json`. Takes a minute or two.

```powershell
git init
git add -A
git commit -m "Wire auth, payments, webhooks, observability, deploy config, docs; refresh lockfile"
git branch -M main
git remote add origin https://github.com/tnpappas/poker-odds-lab.git
git push -u origin main --force
```

What each line does:

- `git init` — turns this folder into a git repository.
- `git add -A` — stages everything (source, deploy configs, docs, lockfile).
- `git commit -m "..."` — saves it as one commit.
- `git branch -M main` — names the branch `main`.
- `git remote add origin ...` — points at your GitHub repo.
- `git push -u origin main --force` — uploads it, replacing the old initial commit.

If `git commit` complains it doesn't know who you are, set your identity once and
re-run the commit:

```powershell
git config --global user.email "troy@safehousepropertyinspections.com"
git config --global user.name "Troy Pappas"
```

Verify it worked:

```powershell
git status
```

You want "nothing to commit, working tree clean". On GitHub, the Actions tab
should show the "CI" run turning green.

> If `git push` asks for credentials, GitHub needs a Personal Access Token (not
> your password) — or use GitHub Desktop, whichever you normally use.

After this one-time setup, future changes are just:
`git add -A` → `git commit -m "..."` → `git push`.
