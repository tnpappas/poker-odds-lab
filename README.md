# Poker Logic Lab

A poker **decision-training** web app at https://www.pokerlogiclab.com. The math engine runs in the browser; the skill being trained is reading real opponents under uncertainty. Operated by TNP Digital Ventures LLC.

Start with `docs/ARCHITECTURE.md`. The original product spec in `CLAUDE.md` is historical and drifts from the code; when they disagree, the code and `docs/` win.

## Status (September 2026)

Live with freemium plus subscription billing through PayPal ($7.99/mo or $49/yr). Frontend on Vercel, API on Railway, Postgres on Neon, auth by Clerk, errors to Sentry. `docs/KNOWN-ISSUES.md` lists what is still open.

## Structure

```
packages/poker-engine/   Pure TypeScript math engine (deck, 7-card evaluator, Monte Carlo and
                         exact equity, pot odds, EV, ranges, adversary modelling, ICM, drills).
                         No dependencies. Unit tested.
apps/web/                React 19 + Vite + Tailwind v4 + Zustand. Works fully on localStorage;
                         the API is an optional entitlement and sync layer.
apps/api/                Express 5 + Zod + Drizzle (Neon). Feature routers under src/routes,
                         signature-verified webhooks under src/webhooks, all env reads in src/config.ts.
docs/                    ARCHITECTURE, SCHEMA, DECISIONS, RUNBOOK, KNOWN-ISSUES, COSTS, ACCOUNTS,
                         BUILD-STANDARD (the review checklist every milestone is graded against).
```

## Run it (double-click, no terminal needed)

- `1-Start-App.bat` starts the web app at http://localhost:5173 and the API at http://localhost:3001 (in-memory store, dev auth).
- `2-Run-Tests.bat` runs every gate: lint, typecheck, engine tests, API tests, web build.
- `3-Deploy.bat` runs the gates and, only if they pass, commits and pushes to `main`. Vercel and Railway deploy automatically in about two minutes.
- `4-Pull-Latest.bat` syncs this folder with GitHub (run first if another session pushed).

Equivalent commands from the repo root: `npm run dev`, `npm run dev:api`, `npm run check`, `npm run test:api`, `npm run lint`, `npm run build`.

## Environment

Nothing is required locally. Production variables live in the hosting dashboards, never in the repo: `apps/api/.env.example` documents the Railway variables (the API refuses to start in production if a required one is missing), `apps/web/.env.example` documents the Vercel variables.

## Database changes

Edit `apps/api/src/db/schema.ts`, write the matching SQL as the next numbered file in `apps/api/drizzle/`, apply it in the Neon SQL editor, then push the code. Details in `docs/RUNBOOK.md`; current shape in `docs/SCHEMA.md`.

## Features

- **Hand Replay**: pause at every street, paint the opponent's range, see equity against your own read, then act. Scored on the decision and on read accuracy.
- **Preflop Equity Visualizer**: all 169 starting hands coloured by equity against any range, recalculated live in a web worker.
- **Mental Math Blitz**: 30-second pot odds and EV sprints.
- **Equity Calculator**, **Tournament Lab (ICM)**, **Adversary Lab** (model an opponent from six reads), **EV Dashboard** with leak detection and drill scheduling.
- Marketing: landing page, Lab Notes (blog), Guide, Pricing, Legal, and `/account` for members.
