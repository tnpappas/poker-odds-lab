# Decision log

Dated decisions and the reasoning, newest first. Read this before proposing to redo something.

## 2026-09-12: Production refuses to start with missing configuration
A missing `PAYPAL_MONTHLY_PLAN_ID` used to surface only at checkout time as a 500. `src/config.ts` now validates the environment at startup and exits in production if a required variable is absent. Trade-off: a bad deploy fails fast and Railway keeps the previous deployment serving, which is what we want.

## 2026-09-12: Webhook deliveries are recorded and deduplicated
PayPal and Clerk both redeliver events on timeouts. `webhook_events` stores every event id before processing, and revoke events only act when the subscription on the event matches the one on file. Chosen over "make every handler idempotent by hand" because it is one rule applied everywhere.

## 2026-09-12: Account deletion cancels the PayPal subscription first
Deleting the database row while PayPal kept billing would create a dispute we cannot trace. If PayPal cannot be reached the deletion is refused with a clear message rather than proceeding.

## 2026-09-12: Polar and Stripe code removed
PayPal subscriptions have been the only live processor since the freemium switch. Keeping two inactive processors in the codebase failed the "one payment client" rule and had already leaked into the legal pages (the refund policy named Polar). The Polar environment variables on Railway are harmless and can be deleted at any time.

## 2026-09-12: Schema migrations as committed SQL files
`drizzle-kit push` from a developer machine needs `DATABASE_URL` locally and leaves no record. Numbered SQL files in `apps/api/drizzle/`, applied in the Neon SQL editor before the dependent code deploys, give a history and keep the secret off laptops. Chosen over automated migration on deploy because Neon's HTTP driver has no transactions and a failed half-migration during a Railway deploy would be worse than a manual step with a visible result.

## 2026-09-12: Sentry, one project per app, separate from MindPilot Pro
The existing Sentry project "javascript-react" belongs to MindPilot Pro. Poker Logic Lab got `poker-logic-lab-api` and `poker-logic-lab-web` so errors never mix across businesses. Error monitoring only; tracing off to stay in the free tier.

## 2026-09-12: Tax not calculated at checkout (deferred)
Plans were created in PayPal with "Don't calculate tax". Digital services sold by a Virginia LLC to consumers can be subject to sales tax in some US states once economic-nexus thresholds are crossed (typically $100,000 in sales or 200 transactions per state). At launch volume the thresholds are not close. Revisit when monthly revenue passes $5,000 or when a state notice arrives; PayPal supports tax rates per plan.

## 2026-09-12: Refunds and proration
14-day money-back guarantee on the first payment only, handled by email to support@pokerlogiclab.com and issued through PayPal. No proration: cancelling keeps access to the end of the paid period (that is what "cancel anytime" promises on the pricing page). Upgrading monthly to annual is a new subscription; the old one is cancelled by the customer.

## 2026-09-10 (from the freemium switch): $7.99/mo or $49/yr with a free tier
Replaced the $24.99 lifetime purchase (see PRICING_DECISION.md for the original one-time reasoning). Free tier: 3 replays and 2 blitz rounds per day, Visualizer and Calculator free. The Meta lead campaign had produced 128 leads and zero sales at $24.99, so the bet is that a free daily loop plus a low monthly price converts better than a one-time wall.

## 2026-07: PayPal as the payment processor
PayPal was available to the business immediately with the owner as merchant of record. Stripe was scaffolded but never activated. Polar was wired as a merchant-of-record fallback and later removed.

## 2026-07: Clerk for authentication
Hosted sign-in with a webhook to keep our `users` table in sync. Custom auth is a No under the build standard.

## 2026-07: Client-side Monte Carlo engine
All equity math runs in the browser (web worker). Zero server compute per user and the tools work without the API. The server only stores results for the dashboard and leak detection.

## 2026-07: Single-user tenancy, no organizations
Rows carry `user_id`; every query is scoped in the storage layer. Teams and invitations are a Stage 2 item.
