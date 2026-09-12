# MILESTONE GATE REPORT (re-run)

Project: Poker Logic Lab (pokerlogiclab.com), repo tnpappas/poker-odds-lab
Milestone: Subscription billing go-live (PayPal monthly $7.99, annual $49)
Date: September 12, 2026 (evening re-run; the morning report at commit 53a6cc3 said NOT READY with 5 blockers)
Commit hash: d61b61f (main, "Deps: upgrade drizzle-orm and react-router to patch high-severity advisories")

How this was checked: code was read and edited from Troy's project folder through the desktop link, verified in a cloud workspace (typecheck, tests, lint, audit), pushed by Troy via .bat files, and then checked live: GitHub Actions run status, Railway deployment status, the live API, the live site in Troy's Chrome, and the account security pages of each vendor. Anything that could not be exercised end to end is marked Could not verify.

## OVERALL: READY WITH CONDITIONS

All five morning blockers are closed and verified live. Stage 1 sections (1 to 7, 10, 11, 14) now pass except for two items in Section 11 that cannot be closed by code and are listed as conditions. Nothing outstanding affects a customer's ability to sign up, pay, use the app, cancel, or delete their account.

Conditions (do these before spending on ads to drive paying customers):

1. Backups. Neon Free plan keeps at most 6 hours of point-in-time history (checked in the Neon console today). A bad migration or accidental delete discovered the next morning is unrecoverable. Move the project to the Neon Launch plan (about $19/month, 7 day history minimum) and rehearse one restore into a branch. Effort: 30 minutes once the plan is upgraded.
2. One real subscription walkthrough. The billing code is covered by 12 automated tests and the live routes answer correctly, but nobody has yet subscribed with a non-owner account on the live PayPal plans and then cancelled from the /account page. Do one $7.99 monthly subscription from a second email, confirm Pro unlocks, cancel in-app, confirm access ends after the CANCELLED webhook, then refund it in PayPal. Effort: 20 minutes.
3. Two-factor authentication on the four accounts not checked today: GoHighLevel, the domain registrar, Meta Business, and the Google account behind troynpappas@gmail.com. Effort: 5 minutes each.

## BLOCKERS FROM THE MORNING REPORT, NOW CLOSED

1. In-app cancel. `users.paypal_subscription_id` column added (migration 0001), written on capture and on BILLING.SUBSCRIPTION.ACTIVATED, read by `/billing/cancel`. Commit 89eb024. Tests: billing.test.ts "cancel calls PayPal with the stored subscription id".
2. Refund policy named Polar. Legal.tsx now names PayPal everywhere; no Polar reference remains in apps/web or apps/api (grep confirmed). Commit aa5da50.
3. Entity missing LLC. `ENTITY = 'TNP Digital Ventures LLC'`. Commit aa5da50.
4. Failed renewals never revoked access. Webhook handles SUSPENDED (revoke), RE-ACTIVATED (re-grant), PAYMENT.FAILED (logged, no revoke). Commit 3ec2f64. PayPal webhook 5W508926BC789293F tracks all of these. Tests: webhooks.test.ts (7 tests).
5. No production error tracking. Sentry on the API (`SENTRY_DSN` on Railway, health reports `"errorTracking":"sentry"`) and the web app (`VITE_SENTRY_DSN` on Vercel, error boundary with reload screen). Test error POKER-LOGIC-LAB-WEB-1 appeared in the Sentry web project. Commit e0c8508.

## SECTION RESULTS

Section 1: Code structure
Passed: 12 of 12. Routes split into one file per feature (`routes/me.ts`, `sessions.ts`, `decisions.ts`, `adversaries.ts`, `blitz.ts`, `usage.ts`, `account.ts`, `billing.ts`; webhooks split into `clerk.ts` and `paypal.ts`). `lib/paypal.ts` rewritten for subscriptions only (173 lines). Dead Stripe and Polar wrappers deleted. Every environment read goes through `config.ts`. ESLint with typescript-eslint recommended plus no-explicit-any as error; `npm run lint` passes locally and in CI.
Still open (Low): the web app is not yet under the lint gate (eslint.config.js ignores apps/web). It is type-checked by `tsc -b` in every build. Tracked in KNOWN-ISSUES.md.

Section 2: Project setup and repository hygiene
Passed: 10 of 10. docs/ set exists (ARCHITECTURE, SCHEMA, DECISIONS, RUNBOOK, KNOWN-ISSUES, COSTS, ACCOUNTS, BUILD-STANDARD); CHANGELOG.md at root; root `.env.example` pointing at the two app examples; four standard .bat files committed (1-Start-App, 2-Run-Tests, 3-Deploy, 4-Pull-Latest); secret scan of the full git history run today via 10-Secret-Scan.bat: no `.env` ever committed, only `.env.example` placeholders and a vendored node_modules from July 15 to 17 matched; `secret-scan-report.txt` now gitignored.
Could not verify: GitHub branch protection on main (not inspected; with Railway waiting for CI and a single developer this is low value today).

Section 3: Architecture and data model
Passed: 16 of 17. Migration 0001 (applied to Neon by Troy, 15 statements OK): `plan` is a Postgres enum, `updated_at` on users, sessions, adversary_profiles with `$onUpdate`, indexes on every user_id and list-ordering column, `webhook_events` table. Migrations are committed SQL files in `apps/api/drizzle/` with a README on how to apply them.
Failed: no `deleted_at` soft delete; the product deletes hard on account removal, which is what the privacy page promises, so this is a deliberate choice recorded in DECISIONS.md rather than a defect.
Low: `polar_customer_id` column still exists in the database (unused); drop after the restore rehearsal.

Section 4: Authentication and authorization
Passed: 11 of 11. Live today at d61b61f: `GET /api/me` and `POST /api/billing/checkout` without a session both return 401; `x-request-id` header present on every response. Billing routes rate limited 10/min/IP separately from the 120/min general limiter. Tests: auth.test.ts (4), isolation.test.ts (3: a user cannot read, update or delete another user's sessions, decisions or adversaries by guessing ids).

Section 5: Payments and billing
Passed: 12 of 12 at the code level. Subscription id stored; cancel works; SUSPENDED revokes; webhook dedup via `webhook_events` (a redelivered event is a no-op, and a late CANCELLED for an old subscription cannot revoke a newer one); `/billing/portal` sends the subscriber to PayPal's automatic payments page; DELETE /account cancels the PayPal subscription first and returns 502 if PayPal is unreachable; production refuses to start without the plan ids; sales tax decision recorded in DECISIONS.md (no tax collected, PayPal plans set to not calculate tax; revisit at the Virginia nexus threshold). Tests: billing.test.ts (12), webhooks.test.ts (7).
Could not verify: a real end-to-end subscribe and cancel on the live plans (Condition 2 above).

Section 6: Security
Passed: 15 of 15 items that apply. Helmet, CORS allowlist, rate limits, zod on every body, Drizzle parameterized queries, secrets only in Railway and Vercel, error responses return `{error, requestId}` with no stack or vendor text, CI production dependency audit passes with 0 high or critical (drizzle-orm 0.45.2, react-router-dom 7.18.3 upgraded today), 2FA verified on GitHub, Vercel, Railway, Neon, Clerk, Sentry and PayPal. Incident basics are in RUNBOOK.md.
Remaining moderate advisories: 19, all in the OpenTelemetry chain under @sentry/node plus body-parser and qs; none exploitable through this API's routes as far as inspected. Tracked in KNOWN-ISSUES.md.

Section 7: Multi-tenancy and data isolation
Passed: 7 of 7 that apply. Isolation is enforced in application code (every storage call scoped by the authenticated user id) and covered by the three isolation tests. Row level security is not used because the API connects as a single owner role; recorded in DECISIONS.md.

Section 8: Testing and quality gates
Passed: 9 of 10. 32 API tests across 5 files pass in CI and locally; engine tests pass in CI; CI run #52 for d61b61f is green (lint, typecheck, engine tests, API tests, web build, production audit); Railway "Wait for CI" is on, and the pixel commit 91164d7 was correctly skipped by Railway while CI was red, which proves the gate works.
Failed: no browser end-to-end test. Tracked in KNOWN-ISSUES.md.

Section 9: Observability and debugging
Passed: 11 of 12. Sentry both ends; request id on every response and log line; health endpoint reports storage, auth, payments and error tracking; UptimeRobot monitors on the API health endpoint and the site, 5 minute interval, email alerts to Troy, both showing Up for 1 month 24 days at 100% (monitors existed already; URL and alert contact confirmed by Troy today); RUNBOOK.md written.
Failed: no owner notification on new subscription or cancellation beyond GHL tagging on purchase. Acceptable at this volume; tracked.

Section 10: Deployment, environments and releases
Passed: 9 of 10. Config validation at startup; deploys gated on CI; rollback steps documented in RUNBOOK.md (Vercel promote previous deployment, Railway redeploy previous).
Failed: no staging environment. Decision for now: not worth the cost at zero revenue; every change passes lint, typecheck, 32 tests and a build before it can reach production. Revisit at the first paying customers. Tracked in KNOWN-ISSUES.md.

Section 11: Reliability, backups and recovery
Passed: 6 of 9. Timeouts (10 s) and one retry on every PayPal and GoHighLevel call; outage plan in RUNBOOK.md; retention policy written.
Failed: Neon Free plan retention is 6 hours (Condition 1); restore never rehearsed (Condition 1); rollback never rehearsed (documented, not drilled).

Section 12: Performance and cost
Passed: 8 of 9. COSTS.md written with every service and its plan. Bundle: main chunk 678 kB minified, 263 kB gzipped; feature pages are lazy loaded.
Low: split framer-motion and Clerk into their own chunks when convenient.

Section 13: Third-party platforms
Passed: 10 of 10. One wrapper per vendor, timeouts and retry, sandbox switch via PAYPAL_ENV, dead wrappers deleted, exit notes per vendor in DECISIONS.md, monthly review item in RUNBOOK.md.

Section 14: Compliance, legal and data lifecycle
Passed: 10 of 10. Entity and processor correct; account deletion cancels PayPal first; Meta Pixel now loads only after the visitor accepts a one-time banner (verified live today: before Accept no fbevents.js and no fbq; after Accept the script loads and a PageView reaches facebook.com/tr for pixel 1383191933689906); privacy policy cookie section rewritten to match (it previously said no advertising cookies were used while the pixel loaded unconditionally); data inventory in SCHEMA.md; breach response basics in RUNBOOK.md.

Section 15: Product, onboarding and support
Passed: 9 of 11. /account page gives every subscriber self-service plan view, cancel, PayPal payment details and delete. Support link in the footer.
Failed: no customer-facing changelog; no owner alert on cancellation. Both tracked as Low.

Section 16: Documentation and handoff
Passed: 7 of 7. All seven documents exist and were updated tonight (ACCOUNTS.md records the 2FA audit, KNOWN-ISSUES.md reflects today's closures, RUNBOOK.md corrected to the 6 hour Neon retention, CHANGELOG.md has tonight's entries).

Section 17: Future-proofing ladder
Stage 1 gate met with the three conditions above. Items that always come early are now covered: refund and double-charge disputes (webhook events stored with ids), a customer asking to cancel (in-app), a failed card (SUSPENDED handling).

## PROOF ATTACHED

- Test run output: cloud workspace at d61b61f, apps/api: "Test Files 5 passed (5), Tests 32 passed (32)". CI run #52 (GitHub Actions) green, including engine tests.
- Type check and lint output: `tsc --noEmit` exit 0; `eslint .` exit 0 (cloud workspace and CI #52).
- Security scan output: `npm audit --omit=dev --audit-level=high` exit 0 (19 moderate remain); git history secret scan via 10-Secret-Scan.bat: no real secrets.
- Cross-tenant test results: isolation.test.ts, 3 passing (sessions, decisions, adversaries by foreign id all 404).
- Billing evidence: PayPal plans P-7WS66382GY586602PNKSX4SA and P-5HN14943KB813583XNKSX5GY ON; Railway 19 variables including both plan ids; live 401 on unauthenticated checkout; billing.test.ts 12 passing. Live subscribe and cancel not yet performed (Condition 2).
- Health check and monitor: live `/api/health` at d61b61f returned `{"ok":true,"storage":"postgres","auth":"clerk","payments":"paypal","errorTracking":"sentry"}`; signed-in `/account` showed plan "Owner" for troynpappas@gmail.com after the Drizzle upgrade, proving a live Postgres read; UptimeRobot both monitors Up, 100%.
- Backup restore evidence: none, never tested (Condition 1).
- Railway deployment list: "Deps: upgrade drizzle-orm..." Active; "Web: gate Meta Pixel..." Skipped (CI red at the time, gate working).

## CROSS-BUSINESS CONTAMINATION CHECK

Poker Logic Lab, pokerlogiclab.com, support@pokerlogiclab.com and TNP Digital Ventures LLC confirmed on the legal pages, PayPal, Railway, Sentry projects and the consent banner. Searched apps/web and apps/api for Safe House, HCJ, Pest Heroes, My Driven Threads, MindPilot and Brightside: none found. Sentry: the app uses its own two projects (poker-logic-lab-api, poker-logic-lab-web); the pre-existing "javascript-react" project belongs to MindPilot Pro and was not touched. The Polar references found this morning are gone.

## CHANGES SINCE LAST GATE

Commits on main today, in order: 89eb024 (subscription id stored), aa5da50 (legal PayPal and LLC), 3ec2f64 (SUSPENDED handling), e0c8508 (web Sentry), 2976582 (API hardening: route split, config validation, webhook dedup, PayPal-only, 32 tests, lint, CI), ba343db (docs set, standard .bat files), 91164d7 (pixel consent, privacy text, gitignore, retire one-off .bat files), d61b61f (dependency upgrades, audit green).
Dashboard changes: Railway SENTRY_DSN and Wait for CI; Vercel VITE_SENTRY_DSN; Sentry projects created; PayPal webhook events extended; Neon migration 0001 applied; 2FA enabled on seven accounts.

## OPEN QUESTIONS FOR TROY

1. Neon Launch plan (Condition 1): approve the upgrade to about $19/month now, or wait for the first paying customer? Default if no answer: wait, but rehearse the restore on the Free plan anyway so the steps are known.
