# Architecture

Poker Logic Lab is a poker decision-training web app. Last updated: September 12, 2026.

## Stack

| Layer | Technology | Where it runs |
|---|---|---|
| Frontend | React 19, Vite 6, TypeScript, Tailwind v4, Zustand, Framer Motion, react-router-dom v7 | Vercel, project `poker-odds-lab-api` under troy-pappas-projects, domain www.pokerlogiclab.com |
| Math engine | `packages/poker-engine`, pure TypeScript, no dependencies, unit tested with vitest | In the browser (bundled into the frontend) |
| API | Express 5, TypeScript run with tsx, Zod validation, Drizzle ORM | Railway, project "Poker Logic Lab", service `@pol/api`, host polapi-production.up.railway.app |
| Database | Neon Postgres (serverless HTTP driver) | Neon project poker-logic-lab, branch production, database neondb |
| Auth | Clerk (publishable key in the frontend, secret key in the API) | Clerk |
| Payments | PayPal Subscriptions v1, PayPal is the processor and the account owner is the merchant of record | PayPal business account support@pokerlogiclab.com |
| CRM | GoHighLevel: buyers are tagged "customer", which fires the book-delivery workflow | GHL sub-account for Poker Logic Lab |
| Error tracking | Sentry, org tnp-digital-ventures, projects poker-logic-lab-api and poker-logic-lab-web | Sentry |
| CI | GitHub Actions on every push to main: lint, typecheck, engine tests, API tests, web build, dependency audit | GitHub |

## How a request flows

1. The browser loads the SPA from Vercel. The app works fully on localStorage with no backend; the API is an optional sync and entitlement layer.
2. When Clerk is configured the frontend attaches the Clerk session JWT as a bearer token on every API call (`apps/web/src/lib/api.ts`).
3. The API (`apps/api/src/app.ts`) assigns a request id, applies helmet and CORS (allowlist from `FRONTEND_URL`), mounts the signature-verified webhook receivers before the JSON parser, then rate limits and mounts the application routes.
4. `middleware/auth.ts` verifies the JWT with `@clerk/backend`, upserts the user into our `users` table and attaches it as `req.user`. Every application route requires this.
5. Feature routers under `src/routes/` (me, sessions, decisions, adversaries, blitz, usage, account, billing) validate the body with Zod and call the `Storage` interface. `storage/drizzle.ts` is production; `storage/memory.ts` is used in development and tests.
6. Errors fall through to `middleware/error.ts`: Zod errors become 400s; everything else is reported to Sentry, logged with the request id, and answered with a generic 500 plus the request id.

## Billing flow

1. `POST /api/billing/checkout` creates a PayPal subscription for the chosen plan (`PAYPAL_MONTHLY_PLAN_ID` or `PAYPAL_ANNUAL_PLAN_ID`) with our user id as `custom_id`, and returns PayPal's approval URL. The frontend redirects the buyer there.
2. PayPal returns the buyer to `FRONTEND_URL/?checkout=paypal&plan=...&subscription_id=I-...`. `CheckoutSuccess.tsx` reads `subscription_id` and calls `POST /api/billing/capture`, which asks PayPal for the subscription's status and, if ACTIVE and the `custom_id` matches the signed-in user, grants Pro and stores the subscription id.
3. Independently, PayPal sends `BILLING.SUBSCRIPTION.ACTIVATED` to `POST /api/paypal/webhooks`. The receiver verifies the signature with PayPal, records the event id in `webhook_events` (a redelivery is a no-op), and grants Pro. CANCELLED, EXPIRED and SUSPENDED revoke Pro, but only if the subscription on the event is the one on file, so a late event for an old subscription cannot revoke a newer one. RE-ACTIVATED restores it. PAYMENT.FAILED is logged only.
4. Entitlement is decided server side from `users.plan` on every `GET /api/me`. Owner emails (`OWNER_EMAILS`) are treated as Pro without paying.
5. Customers cancel from `/account` (`POST /api/billing/cancel`), manage payment details on PayPal (`GET /api/billing/portal` returns the PayPal automatic-payments page), and delete their account (`DELETE /api/account`, which cancels the subscription first and refuses if PayPal is unreachable).

## Modules

```
apps/api/src/
  config.ts          every environment read; production refuses to start if a required variable is missing
  app.ts             Express app factory (middleware order matters: webhooks before JSON parser)
  index.ts           process entry: Sentry init, crash handlers, listen
  routes/            one router per feature; index.ts mounts them behind requireUser
  webhooks/          clerk.ts and paypal.ts, signature verified, deduplicated
  lib/               vendor wrappers: paypal.ts, ghl.ts, sentry.ts, http.ts (timeouts + retry), logger.ts, entitlement.ts, owners.ts
  middleware/        auth.ts, error.ts
  storage/           types.ts (Storage interface), memory.ts, drizzle.ts
  db/                schema.ts (Drizzle) and the Neon client
  drizzle/           numbered SQL migrations, applied by hand in Neon before deploy
  test/              vitest suite: auth, tenant isolation, billing, webhooks, config
apps/web/src/
  main.tsx           router; every page except Home is lazy loaded; Sentry ErrorBoundary at the root
  App.tsx            shell: header, nav, footer, PlanSync (re-checks entitlement on auth change)
  pages/             Home, Pricing, Account, Admin, Blog, BlogPost, Guide, Legal, NotFound
  features/          visualizer, replay, blitz, adversary-lab, calculator, icm, dashboard
  components/        Paywall, RequirePurchase (gate), CheckoutSuccess, Seo, UI primitives
  store/             Zustand store; entitlement is never persisted, always re-verified
  lib/               api.ts (API client), auth.tsx (Clerk provider), sentry.ts, fbpixel.ts
packages/poker-engine/src/
  deck, hands (7-card evaluator), equity (Monte Carlo and exact), ranges, preflop, heuristics, adversary, icm, drills
```

## The big choices and why

- **Client-side math engine.** Equity calculations run in a web worker in the browser, so the server does no compute and the tools work offline. Server cost stays near zero per user.
- **API is optional.** The app is fully usable on localStorage. The API exists for entitlement, cross-device sync and leak detection. This keeps local development trivial and means a Railway outage degrades to local-only rather than breaking the tools.
- **PayPal over Stripe or Polar.** PayPal was available to the business immediately and lets the owner be merchant of record. Polar (merchant-of-record service) was wired as a fallback and removed in September 2026 once PayPal subscriptions were live. See DECISIONS.md.
- **Storage interface with two implementations.** Tests and local development run against the in-memory store, so the test suite needs no database and runs in a few seconds.
- **Single-user tenancy.** Every row carries `user_id`; every query is scoped by the signed-in user in the storage layer. There are no organizations or teams (Stage 2 item in the build standard).
