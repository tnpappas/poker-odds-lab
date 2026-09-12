# Changelog

All notable changes, newest first. Dates are the day the change went live on pokerlogiclab.com.

## 2026-09-12

### Billing and accounts
- PayPal subscriptions live: product Poker Logic Lab, plans Monthly $7.99 and Annual $49; Railway plan ids set; webhook tracks activated, cancelled, expired, suspended, re-activated, payment failed and sale completed.
- New `/account` page: see your plan, cancel the subscription, open PayPal payment details, delete your account.
- In-app cancel fixed (the subscription id was never stored before).
- Account deletion now cancels the PayPal subscription first and refuses if PayPal is unreachable.
- Failed renewals: access ends on SUSPENDED and returns on RE-ACTIVATED.
- Checkout return reads `subscription_id` (previously read `ba_token`, which PayPal would reject).
- Legal pages name PayPal as the payment provider and TNP Digital Ventures LLC as the entity.

### Reliability and security
- Every webhook delivery is recorded; redeliveries are no-ops; a late cancel for an old subscription cannot revoke a newer one.
- Production refuses to start if a required environment variable is missing.
- Timeouts and one retry on every PayPal and GoHighLevel call.
- Request id on every response and log line; billing routes rate limited to 10/min/IP.
- Sentry error tracking on the API and the web app (crash screen with reload).
- Polar and Stripe code removed; PayPal is the only processor.

### Database
- Migration 0001: `plan` enum, `updated_at` columns, indexes on every user_id and list ordering, `webhook_events` table.

### Engineering
- API split into feature routers; all environment reads through `config.ts`.
- 32 API tests (auth, tenant isolation, billing, webhooks, config); ESLint; CI runs lint, typecheck, tests, build and a production dependency audit.
- docs/ set added: ARCHITECTURE, SCHEMA, DECISIONS, RUNBOOK, KNOWN-ISSUES, COSTS, ACCOUNTS, BUILD-STANDARD.

## 2026-09-10
- Switched from $24.99 lifetime to freemium plus subscription ($7.99/mo, $49/yr). Free tier: 3 replays and 2 blitz rounds per day, Visualizer and Calculator free.

## 2026-09-09
- Pricing link in the main nav; hero call to action "Play a free hand" with the free-trial hint.
- Free users can try Replay, Blitz and Visualizer before paying.

## 2026-09-05
- Homepage hero: looping table video with the engine-verified equity overlay.
- Lab Notes: Implied Odds Explained.
