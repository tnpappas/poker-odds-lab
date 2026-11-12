# Poker Logic Lab (pokerlogiclab.com)

Poker decision training app. The math is the engine; the product is teaching players to beat real opponents.
Detail lives in docs/. Read docs/DECISIONS.md before proposing to redo anything.

## Stack (current)
- Web: React + Vite on Vercel (apps/web). API: Express + TypeScript on Railway (apps/api)
- Shared math engine: packages/poker-engine (client-side Monte Carlo in a web worker)
- Neon Postgres + Drizzle, Clerk auth, Sentry (poker-logic-lab-api / poker-logic-lab-web)
- Billing: PayPal Subscriptions ONLY. Stripe and Polar were removed Sept 2026. Do not add them back
- Keep lib/paypal.ts the only PayPal-aware file

## Pricing (source of truth: docs/DECISIONS.md)
- Pro: $7.99/month or $49/year. No lifetime plan
- Free: 3 Hand Replay hands/day, 2 Blitz rounds/day, Equity Visualizer, Calculator, 1 free Lab Note
- Cancelled subscribers keep Pro until the paid period ends (users.pro_until)

## How Troy works (important)
- Troy does not use a terminal. Never ask him to run a command
- Pull first: 4-Pull-Latest.bat (other sessions push to GitHub directly)
- Publish: write .publish-files.txt (one path per line) and .publish-message.txt, then tell Troy to double-click PUBLISH.bat. It runs `npm run check` and pushes only if it passes
- Done means verified on the live site, not "the .bat ran"

## Checks
- `npm run check` = lint + typecheck + engine tests + API tests + build
- Every poker math function needs a unit test

## Database
- Schema changes are numbered SQL files in apps/api/drizzle/, applied by Troy in the Neon SQL editor BEFORE the code that needs them deploys
- DATABASE_URL is not on Troy's PC; `db:push` will fail locally

## Product rules
- Every number shown on the site must be real and independently checkable. No illustrative or AI-made equities
- Every decision result explains the math in plain English. Never just "Correct" / "Incorrect"
- Cards are dealt in real hand order in any animation or video

## Code standards
- TypeScript strict, no `any`, Zod on every API input
- Components under 200 lines; move logic into hooks
- Error boundaries on feature modules; loading states on async work; mobile first

<!-- The original 805-line build spec (July 2026) was moved to docs/ORIGINAL-BUILD-SPEC.md. It describes Stripe, lifetime pricing and old free limits that are no longer true. -->
