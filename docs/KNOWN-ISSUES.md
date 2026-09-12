# Known issues and technical debt

Severity: High (affects customers or money), Medium (affects operations), Low (hygiene).

| Date | Severity | Item | Workaround / plan |
|---|---|---|---|
| 2026-09-12 | Medium | No staging environment. `main` is production for both Vercel and Railway. | Every push passes lint, typecheck, tests and build first (locally via 3-Deploy.bat and in CI). Plan: Railway staging environment + Neon branch + PayPal sandbox app. |
| 2026-09-12 | Medium | Application rollback (Vercel promote previous, Railway redeploy previous) never rehearsed. Database restore was rehearsed 2026-09-12 (see RUNBOOK.md). | Promote a previous Vercel deployment and redeploy a previous Railway deployment once, record the time taken in RUNBOOK.md. |
| 2026-09-12 | Medium | Frontend lint not enforced. `eslint.config.js` ignores `apps/web`. | Run eslint on apps/web, fix the existing findings, remove the ignore. |
| 2026-09-12 | Medium | No end-to-end browser test (signup to checkout). | Playwright test against the free flow at minimum; the paid flow needs a PayPal sandbox. |
| 2026-09-12 | Low | `users.polar_customer_id` column still exists in the database; unused by the code. | Drop in migration 0002 after a restore rehearsal. |
| 2026-09-12 | Low | `plan` enum keeps 'lifetime' for accounts from the one-time era. | Leave; harmless. |
| 2026-09-12 | Low | CheckoutSuccess.tsx still has a 'polar' provider branch (polls entitlement, harmless). | Remove when the component is next touched. |
| 2026-09-12 | Low | The web bundle main chunk is about 675 kB minified; Vite warns above 500 kB. | Split framer-motion and clerk into separate chunks via manualChunks. |
| 2026-09-12 | Low | `npm audit --omit=dev` reports 19 moderate advisories (OpenTelemetry chain under @sentry/node, body-parser, qs). CI fails only on high or critical, which are now clear. | Bump @sentry/node to 9.x when convenient; re-check monthly. |
| 2026-09-12 | Low | Two-factor authentication not yet confirmed on GoHighLevel, the domain registrar, Meta Business and the Google account behind troynpappas@gmail.com. Confirmed ON 2026-09-12 for GitHub, Vercel, Railway, Neon, Clerk, Sentry and PayPal. | Turn on and record in ACCOUNTS.md. |
| 2026-09-12 | Low | CLAUDE.md is the original product spec and drifts from reality (mentions Stripe, Tailwind v3). | Treat ARCHITECTURE.md as truth; trim CLAUDE.md. |
| 2026-09-12 | Low | Transactional emails (receipt, payment failed) are not sent by the app; PayPal sends its own receipts and Clerk handles verification and reset. | Acceptable at launch. Revisit with a dunning email when PAYMENT.FAILED fires. |
