# Poker Logic Lab — Summary Sheet

_Paste this at the top of a new project prompt to give full context on what Poker Logic Lab is and what parts of it can be reused._

---

## What it is

**Poker Logic Lab** (pokerlogiclab.com) is an educational poker **decision-training** web app. It teaches poker math and reading opponents through interactive practice, not passive content. Tagline: _"Stop losing to better math. Start winning with better reads."_ It is explicitly **not** a gambling product: no real-money wagering, no payouts, all hands simulated for training.

**Positioning:** competitors teach math as the destination; Poker Logic Lab makes the math a tool to read a real opponent and make the correct call/fold/raise. The signature mechanic is scoring on **EV (decision quality), not luck** — you can make the right call, lose the pot, and still score points.

---

## What it does (the tools)

- **Hand Replay** — real hands pause at each decision; you read the opponent's range, choose call/fold/raise, and get the correct play plus the plain-English why.
- **Equity Visualizer** — all 169 starting hands on a grid colored by strength; drag a range and watch win odds update live.
- **Mental Math Blitz** — 30-second pot-odds and EV sprints to build fast, table-ready math.
- **Equity Calculator** — your hand vs any range on any board, with the "is the price right" answer.
- **Tournament Lab** — push/fold and ICM training.
- **Adversary Lab** — model a real opponent from six behavioral sliders, then train against their exact style.
- **EV Dashboard** — tracks decision quality over time and auto-detects your leaks.
- **Lab Notes** — SEO blog of plain-English poker strategy articles.

The math engine runs **client-side** (10,000 Monte Carlo sims per equity read, <100ms on mobile) so it feels instant.

---

## How it's built (the reusable stack)

This is the part most useful for a new project — it's a proven, shippable template.

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind + Zustand + Framer Motion |
| Backend | Express + TypeScript |
| Database | Neon Postgres + Drizzle ORM |
| Auth | Clerk (production instance on a subdomain) |
| Payments | PayPal (merchant of record = you) |
| Hosting | Vercel (web) + Railway (API) |
| Monitoring | Sentry (errors) + UptimeRobot (uptime) + Vercel Analytics |

**Reusable patterns already solved:** a hard purchase paywall gating all tools (server-checked entitlement via `GET /api/me`), an owner-email allowlist for free testing, webhook-verified payment→entitlement flow with instant capture-on-return, per-route SEO + sitemap + robots, a lightweight file-based blog, and legal pages (Terms/Privacy/Refunds).

---

## Business model

- **$24.99 one-time Lifetime** purchase (no subscription), framed as a founding price rising to $29.
- 14-day money-back guarantee.
- Anchored against competitors that charge more than that **per month** (GTO Wizard, etc.).
- Legal entity: **TNP Digital Ventures** (DBA Poker Logic Lab), Virginia Beach, VA.

---

## Current status

Fully **live and operational**: payments verified end to end, auth in production, uptime + error + analytics monitoring on, blog published, Search Console indexing. The build is done; the current focus is **getting customers** (organic-first: short-form video + poker communities + SEO, then paid Meta).

---

## Hard-won lessons for the next project

1. **Check payment-processor acceptability BEFORE building.** Poker got rejected by Polar and would face the same on Stripe/Paddle/Lemon Squeezy (all ban gambling-adjacent). This cost real time. For any new product, confirm your processor will take the category first.
2. **Merchant-of-record services (Polar/Paddle/LemonSqueezy) handle sales tax for you.** Going direct (PayPal/Stripe) means tax becomes your responsibility. Factor that into processor choice.
3. **The stack above is now a template.** Product #2 can reuse the auth + paywall + payments + SEO + deploy pattern and ship far faster.
4. **Distribution beats features.** The build is rarely the bottleneck; reaching the right audience is. Build the audience/email list early.
5. **Validate before marketing spend.** Comp real users, watch them, collect testimonials, then scale.

---

_Owner: Troy Pappas. Source of truth for reusing Poker Logic Lab as a reference or template._
