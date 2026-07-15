# Poker Logic Lab

A poker **decision-training** app. The math is the engine; the skill is reading real opponents under uncertainty. See [CLAUDE.md](./CLAUDE.md) for the full product spec.

## Status

**Engine, web client, and backend API are all built, type-checked, and verified.** The web app runs fully on `localStorage` out of the box and optionally syncs to the API. The third-party integrations that need paid accounts/keys — **Clerk** auth, **Stripe** payments, **Neon** Postgres — are wired with clearly-marked integration points and safe fallbacks: no `DATABASE_URL` → in-memory store; no `CLERK_SECRET_KEY` → dev-auth via `x-user-id`; no `STRIPE_SECRET_KEY` → payment routes return `501`. Drop in the keys to go live without code changes elsewhere.

## Structure

```
packages/poker-engine/   Pure-TS math engine (deck, 7-card evaluator, Monte Carlo
                         equity, pot odds, EV, outs, ranges, adversary modeling).
                         23 unit tests. No dependencies.
apps/web/                React 19 + Vite + Tailwind v4 + Zustand + Framer Motion.
  src/lib/               Web-worker equity wrapper + opt-in API client.
  src/features/          visualizer · replay · blitz · adversary-lab · dashboard
  src/store/             Zustand store (localStorage-persisted, best-effort API sync).
apps/api/                Express 5 + TypeScript + Drizzle (Neon) + Zod.
  src/db/                Drizzle schema matching the spec (users, sessions,
                         hand_decisions, adversary_profiles, user_leaks, daily_usage).
  src/storage/           Storage interface + in-memory and Drizzle implementations.
  src/routes/            sessions · decisions · leaks · adversaries · blitz · usage
                         · stripe (stub) · clerk webhook.
  src/middleware/        auth (Clerk/dev) · error (Zod-aware).
```

## Run

```bash
npm install
npm run dev        # web app at http://localhost:5173
npm run dev:api    # API at http://localhost:3001 (in-memory unless DATABASE_URL set)
npm test           # engine unit tests
npm run build      # type-check + production bundle (web)
npm run typecheck  # type-check the API
```

To enable backend sync from the web app, copy `apps/web/.env.example` → `.env`
(`VITE_API_URL=http://localhost:3001`). To use a real database, set `DATABASE_URL`
in `apps/api/.env` and run `npm run db:push --workspace=apps/api`.

## Features implemented

- **Preflop Equity Visualizer** — 13×13 grid colored by equity vs random (Monte Carlo, cached). Drag the adversary VPIP slider for live equity recalculation in a web worker.
- **Hand Replay** — pause-and-predict loop with the **range-guess mechanic** (the headline differentiator): drag to paint the hands you think the adversary holds, see your live equity *vs your own read*, then act. Scoring rewards both the +EV decision and read accuracy (how close your read was to the true range equity). The result reveals the adversary's actual hand, whether it fell inside your painted range, and a plain-English "why". Toggle the mechanic off for the basic mode.
- **Mental Math Blitz** — 30-second binary sprint over pot odds / EV / rule-of-2-&-4 / bet-sizing, with streak multipliers and a 3-miss cap.
- **Adversary Lab** (Pro) — answer six behavioral slider questions about a player; the engine models their range live (13×13 grid + % of hands) and surfaces exploitative adjustments with EV impact. Save adversaries and send one straight into Hand Replay to train against their exact range.
- **EV Dashboard** — skill points, decision accuracy, avg read error, EV-by-street, and automatic leak detection (calling too wide, folding to aggression, missing value).

## Backend API

`apps/api` implements every endpoint from the spec — `/api/sessions`, `/api/decisions(/summary)`, `/api/leaks(/recalculate)`, `/api/adversaries`, `/api/blitz/results`, `/api/usage`, the Clerk webhook, and Stripe stubs — all with Zod request validation. Persistence is behind a `Storage` interface with two interchangeable implementations (in-memory for zero-setup dev, Drizzle/Neon for production). Server-side leak detection mirrors the engine's dashboard logic so analytics work across devices once sync is enabled.

## The engine

`packages/poker-engine` is the heart of the app and runs entirely client-side:
- 7-card evaluator packs each hand into one comparable integer (category + kickers) — ~2M+ evaluations/sec, so 10k Monte Carlo simulations finish in a few milliseconds.
- `calculateEquity` (Monte Carlo, any weighted range) and `calculateExactEquity` (full enumeration).
- `parseRangeString` supports standard notation (`AA`, `JJ+`, `A2s+`, `AQs-ATs`).
- `vpipToRange` uses the Chen formula to approximate an opponent's range from a VPIP%.
- 23 unit tests cover the evaluator, known equity matchups, pot odds/EV, and range parsing.
