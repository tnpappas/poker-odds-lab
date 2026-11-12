# Poker Math Learning App — Claude Code Build Framework
# Project: "Poker Logic Lab" — A Poker Decision Training App

---

## Project Overview

**App Name:** Poker Logic Lab
**Tagline:** Stop losing to better math. Start winning with better reads.
**Core Positioning:** A poker *decision training* app — not a math app. The math is the engine under the hood. The user experience is about learning to beat real opponents.

**What makes this different from every competitor:**
- Competitors teach math as the destination. This app makes math the tool used to win a story.
- No competitor teaches ranging opponents under uncertainty. This is the real skill gap.
- EV-based scoring that rewards good decisions, not lucky results.
- Personal adversary profiling — math built around actual people you play against.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + Vite | Fast, component-based, excellent animation support |
| Styling | Tailwind CSS + Framer Motion | Utility styling + cinematic animations |
| State | Zustand | Lightweight, no boilerplate |
| Backend | Express 5 + TypeScript | Consistent with Troy's existing v3 stack |
| Database | Neon Postgres + Drizzle ORM | Serverless, matches existing infra |
| Auth | Clerk | Fast implementation, handles all auth flows |
| Payments | Stripe | One-time purchase + subscription support |
| Hosting | Vercel (frontend) + Railway (backend) | Simple deploy pipeline |
| Math Engine | Custom JS Monte Carlo (client-side) | Runs 10,000 simulations in <1s on mobile |

---

## Monorepo Structure

```
poker-odds-lab/
├── CLAUDE.md                  ← You are here
├── package.json               ← Workspace root
├── apps/
│   ├── web/                   ← React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/    ← Reusable UI components
│   │   │   ├── features/      ← Feature modules (one folder per feature)
│   │   │   ├── engine/        ← Poker math engine (pure JS, no dependencies)
│   │   │   ├── store/         ← Zustand state slices
│   │   │   ├── hooks/         ← Custom React hooks
│   │   │   └── pages/         ← Route-level page components
│   │   └── index.html
│   └── api/                   ← Express backend
│       └── src/
│           ├── routes/        ← API route handlers
│           ├── services/      ← Business logic
│           ├── db/            ← Drizzle schema + migrations
│           └── middleware/    ← Auth, rate limiting, error handling
├── packages/
│   └── poker-engine/          ← Shared math engine (used by both web + api)
│       ├── src/
│       │   ├── equity.ts      ← Monte Carlo equity calculator
│       │   ├── ranges.ts      ← Hand range utilities
│       │   ├── hands.ts       ← Hand evaluation (7-card)
│       │   ├── deck.ts        ← Deck management
│       │   └── heuristics.ts  ← Rule of 2/4, pot odds shortcuts
│       └── index.ts
└── docs/
    ├── CLAUDE.md              ← This file
    ├── FEATURES.md            ← Detailed feature specs
    ├── DB_SCHEMA.md           ← Database schema documentation
    └── MATH_ENGINE.md        ← Poker math implementation notes
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'lifetime'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session tracking (EV performance over time)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL, -- 'hand_replay' | 'blitz' | 'adversary_lab' | 'equity_viz'
  hands_played INTEGER DEFAULT 0,
  total_ev_won DECIMAL(10,2) DEFAULT 0,
  total_ev_lost DECIMAL(10,2) DEFAULT 0,
  decisions_correct INTEGER DEFAULT 0,
  decisions_total INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Individual hand decisions (granular EV tracking)
CREATE TABLE hand_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  street TEXT NOT NULL, -- 'preflop' | 'flop' | 'turn' | 'river'
  decision_type TEXT NOT NULL, -- 'pot_odds' | 'ev_call' | 'range_read' | 'blitz'
  user_action TEXT NOT NULL, -- 'call' | 'fold' | 'raise'
  correct_action TEXT NOT NULL,
  user_equity_estimate DECIMAL(5,2),
  actual_equity DECIMAL(5,2),
  ev_result DECIMAL(10,2), -- positive = good EV decision, negative = bad EV decision
  pot_size DECIMAL(10,2),
  bet_size DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adversary profiles (user-created opponent models)
CREATE TABLE adversary_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Behavioral inputs (0.0 to 1.0 scale)
  vpip DECIMAL(3,2) DEFAULT 0.25,          -- % hands voluntarily played
  pfr DECIMAL(3,2) DEFAULT 0.18,           -- % hands raised preflop
  cbet_flop DECIMAL(3,2) DEFAULT 0.60,     -- continuation bet frequency flop
  cbet_turn DECIMAL(3,2) DEFAULT 0.45,     -- continuation bet frequency turn
  fold_to_3bet DECIMAL(3,2) DEFAULT 0.55,  -- fold frequency to 3-bets
  af DECIMAL(3,1) DEFAULT 2.5,             -- aggression factor
  wtsd DECIMAL(3,2) DEFAULT 0.28,          -- went to showdown %
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leak detection (aggregated decision patterns)
CREATE TABLE user_leaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  leak_type TEXT NOT NULL, -- 'calling_too_wide' | 'folding_to_aggression' | 'missing_value' | 'bluffing_too_much'
  severity DECIMAL(3,2) DEFAULT 0, -- 0.0 (minor) to 1.0 (critical)
  sample_size INTEGER DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

-- Daily replay limits (free tier enforcement)
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  replays_used INTEGER DEFAULT 0,
  blitz_used INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
```

---

## The Poker Math Engine (`packages/poker-engine`)

This is the most critical piece of the app. It must run client-side with no server round-trip for real-time interactivity.

### Core Functions to Implement

```typescript
// packages/poker-engine/src/equity.ts

/**
 * Monte Carlo equity calculator.
 * Runs N simulations to estimate win probability.
 * Target: 10,000 iterations in <100ms on mobile.
 */
export function calculateEquity(
  heroHand: [Card, Card],
  adversaryRange: HandRange,      // array of hand combos with weights
  board: Card[],                // 0, 3, 4, or 5 cards
  simulations: number = 10000
): EquityResult {
  // Implementation: deal random remaining board cards,
  // evaluate 7-card hand for each player, track wins/ties
}

/**
 * Exact equity (small ranges only — use for preflop heads-up).
 * Enumerates all possible runouts rather than sampling.
 */
export function calculateExactEquity(
  heroHand: [Card, Card],
  adversaryHand: [Card, Card],
  board: Card[]
): EquityResult {}

/**
 * Convert adversary stats (VPIP/PFR) to a hand range.
 * This powers the Adversary Lab feature.
 */
export function statsToRange(
  vpip: number,
  pfr: number,
  position: Position
): HandRange {}

/**
 * Rule of 2 and 4 heuristic approximation.
 * Returns { exact: number, heuristic: number, error: number }
 */
export function ruleOf2And4(outs: number, street: 'flop' | 'turn'): HeuristicResult {}

/**
 * Pot odds calculation.
 * Returns required equity to break even on a call.
 */
export function potOdds(potSize: number, betSize: number): number {}

/**
 * Expected value of a call decision.
 */
export function callEV(
  equity: number,
  potSize: number,
  callAmount: number,
  impliedOdds?: number
): number {}

/**
 * Count outs for common draw types.
 */
export function countOuts(
  heroHand: [Card, Card],
  board: Card[]
): OutsResult {
  // Returns: { flushDraw, straightDraw, overcards, pair, set, total }
}
```

### Hand Evaluator

Use a lookup-table based 7-card evaluator for performance. Reference: Two Plus Two evaluator algorithm (public domain). Do not use a naive recursive evaluator — it will be too slow for Monte Carlo.

```typescript
// packages/poker-engine/src/hands.ts
// Implement 7-card hand evaluator using rank tables
// Must evaluate 1,000,000+ hands per second for Monte Carlo to work

export type HandRank =
  | 'high_card'
  | 'pair'
  | 'two_pair'
  | 'three_of_a_kind'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush'

export interface EvaluatedHand {
  rank: HandRank
  rankValue: number   // numeric for comparison (higher = better)
  description: string // human readable: "Pair of Kings with Ace kicker"
}

export function evaluate7Cards(cards: Card[]): EvaluatedHand {}
export function compareHands(hand1: EvaluatedHand, hand2: EvaluatedHand): -1 | 0 | 1 {}
```

### Hand Range Representation

```typescript
// packages/poker-engine/src/ranges.ts

// The 13x13 grid: pairs on diagonal, suited top-right, offsuit bottom-left
// Each cell has a weight 0.0 (never in range) to 1.0 (always in range)
export type HandMatrix = number[][] // [13][13]

// Human-readable range string format (standard poker notation)
// Example: "AA,KK,QQ,AKs,AQs-ATs,AKo"
export function parseRangeString(range: string): HandRange {}
export function rangeToMatrix(range: HandRange): HandMatrix {}
export function matrixToRange(matrix: HandMatrix): HandRange {}

// Convert VPIP % to approximate range (for Adversary Lab)
// VPIP 25% roughly = top 25% of hands by strength
export function vpipToRange(vpip: number, position: Position): HandMatrix {}

// Starting hand equity vs random hand (precomputed reference table)
// Used for the Preflop Equity Visualizer
export const PREFLOP_EQUITY_VS_RANDOM: Record<string, number> = {
  'AA': 0.852, 'KK': 0.823, 'QQ': 0.800, 'JJ': 0.775,
  // ... all 169 starting hand categories
}
```

---

## Feature Specifications

### Feature 1: The Interactive Preflop Equity Visualizer

**Route:** `/visualizer`
**Access:** Free (basic) / Pro (full with range sliders)

**Component:** `features/visualizer/EquityGrid.tsx`

```
UI Layout:
┌─────────────────────────────────────────────────────────┐
│  PREFLOP EQUITY VISUALIZER                              │
│  [Hand Category Filter: All | Pairs | Suited | Offsuit] │
├────────────────────────────┬────────────────────────────┤
│                            │                            │
│   13x13 HAND GRID          │   SELECTED HAND DETAIL     │
│   (color = equity %)       │                            │
│   Green (80%+) → Red (40%) │   Hand: AKs               │
│                            │   Equity vs Random: 67.2%  │
│   Click any cell to select │   Equity vs selected       │
│                            │   adversary range: [live]    │
│                            │                            │
│                            │   Outs breakdown:          │
│                            │   Flush draw: 9 outs       │
│                            │   Overcards: 6 outs        │
│                            │                            │
├────────────────────────────┴────────────────────────────┤
│  ADVERSARY RANGE SLIDER                                   │
│  Tight 5% ──────[●]────────────────── Loose 50%        │
│  Current: Top 20% — "TAG reg player"                    │
│                                                         │
│  Live equity update: 54.3% ← updates as slider moves   │
└─────────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- Grid cells colored via HSL: `hsl(equity * 1.2, 80%, 45%)` — red at 40%, green at 85%
- Slider triggers Monte Carlo recalculation via web worker (non-blocking)
- Precomputed equity table for instant initial render (before worker responds)
- Animate equity percentage change with spring physics (Framer Motion)

---

### Feature 2: The "Hand Replay" Win-Rate Simulator

**Route:** `/replay`
**Access:** 15 hands/day free | Unlimited pro

**Component:** `features/replay/HandReplayer.tsx`

**Game Loop State Machine:**

```
IDLE → DEALING → PREFLOP_PAUSE → FLOPPING → FLOP_PAUSE
     → TURNING → TURN_PAUSE → RIVERING → SHOWDOWN → RESULT
```

**The "Pause & Predict" Mechanic (Core Engagement Loop):**

At each street transition, the replayer PAUSES and shows:
```
┌─────────────────────────────────────────────────────────┐
│  THE READ                                               │
│                                                         │
│  Pot: $142    |    Hero has flush draw (9 outs)        │
│                                                         │
│  Adversary bets $71 (half pot)                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  WHAT IS ADVERSARY'S RANGE?                       │   │
│  │                                                 │   │
│  │  Drag to select hands you think he has:         │   │
│  │  [mini 13x13 grid — user highlights cells]      │   │
│  │                                                 │   │
│  │  Your read: Top pair+ (34% of range)           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Your equity vs YOUR read: 41.2%                       │
│  Required equity to call: 25.0%                        │
│                                                         │
│  [CALL]  [FOLD]  [RAISE]                              │
│                                                         │
│  Decision timer: ████████░░ 8s                         │
└─────────────────────────────────────────────────────────┘
```

After decision:
```
┌─────────────────────────────────────────────────────────┐
│  RESULT                                                 │
│                                                         │
│  Adversary had: Top pair, weak kicker (AJ on J-7-3 board) │
│  Your actual equity was: 38.4%                          │
│  Your read was: 41.2% — CLOSE! Good read.              │
│                                                         │
│  EV of calling: +$18.40 (correct play)                 │
│  EV of folding: $0.00                                  │
│                                                         │
│  +18.40 Skill Points awarded                           │
│                                                         │
│  WHY THIS WORKS:                                        │
│  With 9 flush outs on the turn (Rule of 2: ~18%        │
│  direct equity), plus implied odds from adversary's       │
│  $89 remaining stack, this call was clearly +EV.       │
└─────────────────────────────────────────────────────────┘
```

**Hand Generation Logic:**

```typescript
// services/handGenerator.ts

interface GeneratedHand {
  heroCards: [Card, Card]
  adversaryCards: [Card, Card]
  board: Card[]                // full 5-card board pre-generated
  adversaryProfile: AdversaryProfile  // how adversary "would have played"
  decisionNodes: DecisionNode[]   // pause points during replay
  solution: HandSolution          // correct plays at each node
}

interface DecisionNode {
  street: Street
  pot: number
  betSize: number
  heroEquity: number          // actual equity (shown AFTER decision)
  heroOuts: OutsResult
  potOdds: number             // required equity
  correctAction: 'call' | 'fold' | 'raise'
  evOfCall: number
  evOfFold: number
  explanation: string         // the "why" shown after decision
}

function generateHand(options: {
  heroHandCategory?: HandCategory   // force a specific hand type for drilling
  adversaryProfileId?: string         // use saved adversary profile
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}): GeneratedHand {}
```

---

### Feature 3: Adversary Lab

**Route:** `/adversary-lab`
**Access:** Pro only

**Component:** `features/adversary-lab/AdversaryBuilder.tsx`

**Flow:**

1. User names a adversary ("Phil from my home game")
2. Answers 6 behavioral questions (sliders, not text input):
   - "How many hands does he play?" (VPIP slider: Nit 10% → Fish 60%)
   - "How often does he raise preflop?" (PFR: Passive 5% → Aggressive 35%)
   - "Does he c-bet the flop every time?" (CBet: Never 20% → Always 90%)
   - "Does he fold to raises?" (Fold to 3bet: Always 30% → Never 80%)
   - "How aggressive is he overall?" (AF: 1 → 5)
   - "Does he go to showdown a lot?" (WTSD: 20% → 45%)

3. App generates a probabilistic hand range model from those stats
4. User runs Hand Replay sessions with that adversary's range applied
5. App shows "Exploitative adjustments":
   - Against this adversary, YOUR best plays change
   - Example: "Phil folds to 3-bets 75% of the time. Your suited connectors gain 12% EV when you 3-bet vs him vs calling"

**Range Generation from Stats:**

```typescript
// engine/adversary.ts

function buildAdversaryRange(profile: AdversaryProfile, position: Position): HandMatrix {
  // VPIP defines which hands enter the pot at all
  // PFR determines which of those are raised vs limped
  // Use positional adjustments (BTN plays wider than UTG)
  // Weight combos by frequency (AA always raised, Axs sometimes limped)
}

function calculateExploitativeAdjustments(
  heroHand: [Card, Card],
  adversary: AdversaryProfile,
  scenario: Scenario
): ExploitAdjustment[] {
  // Returns list of adjustments with EV impact
  // Example: { adjustment: '3-bet instead of call', evGain: 4.20, reason: '...' }
}
```

---

### Feature 4: Mental Math "Blitz" Mode

**Route:** `/blitz`
**Access:** Free (5 rounds/day) | Unlimited pro

**Component:** `features/blitz/BlitzMode.tsx`

**Mechanics:**

- 30-second survival sprint
- Rapid-fire scenarios flash on screen
- User taps LEFT (fold / under-odds) or RIGHT (call / over-odds)
- Streak counter, EV score, accuracy %
- Miss 3 in a row = session ends

**Scenario Types:**

```typescript
type BlitzScenario =
  | { type: 'pot_odds'; pot: number; bet: number; equity: number }
  // "Pot $100, bet $50. You have 35% equity. Call or Fold?"

  | { type: 'rule_of_2_4'; outs: number; street: 'flop' | 'turn' }
  // "9 outs on the flop. Approximately what equity?"

  | { type: 'ev_call'; equity: number; pot: number; callAmount: number }
  // "40% equity. $80 pot. $30 to call. +EV or -EV?"

  | { type: 'bet_threshold'; betSizePct: number }
  // "Adversary bets 75% pot. What equity do you need to call?"

function generateBlitzScenario(
  difficulty: number,  // 0-1, increases as streak grows
  userId: string       // pulls from their leak profile to target weak spots
): BlitzScenario {}
```

**Scoring:**

```typescript
// Correct answer: +100 points base × streak multiplier
// Wrong answer: -50 points, streak resets
// Speed bonus: answer in <5s = +25 bonus points
// Streak milestone: every 10 correct = double points for next 5
```

---

### Feature 5: EV Performance Dashboard

**Route:** `/dashboard`
**Access:** Free (basic) | Pro (full leak analysis)

**Component:** `features/dashboard/EVDashboard.tsx`

**Sections:**

```
┌─────────────────────────────────────────────────────────┐
│  YOUR EV REPORT — Last 7 Days                          │
│                                                         │
│  Total Skill Points: +847                              │
│  Decision Accuracy: 71.4%                              │
│  Avg Equity Estimation Error: 6.2%                     │
│                                                         │
├────────────────────┬────────────────────────────────────┤
│  LEAKS DETECTED    │   EV BY STREET                    │
│                    │                                   │
│  🔴 Calling too   │   Preflop:  +124 EV              │
│  wide vs aggres-  │   Flop:     +312 EV              │
│  sion (High)      │   Turn:     -89 EV  ← LEAK       │
│                    │   River:    +141 EV              │
│  🟡 Folding to    │                                   │
│  river bets       │                                   │
│  (Medium)         │                                   │
│                    │                                   │
│  [THIS WEEK'S     │                                   │
│   DRILL TARGET]   │                                   │
│  10-min custom    │                                   │
│  session built    │                                   │
│  from YOUR leaks  │                                   │
└────────────────────┴────────────────────────────────────┘
```

**Leak Detection Algorithm:**

```typescript
// services/leakDetector.ts

const LEAK_THRESHOLDS = {
  calling_too_wide: {
    // User calls when potOdds > actualEquity + 5%
    // If this happens >40% of call decisions: HIGH severity
    metric: 'pct_calls_below_pot_odds',
    high: 0.40, medium: 0.25
  },
  folding_to_aggression: {
    // User folds when potOdds clearly favor calling
    // (equity > required equity by >10%)
    metric: 'pct_folds_above_pot_odds',
    high: 0.35, medium: 0.20
  },
  missing_value: {
    // User folds strong hands (>65% equity) on river
    metric: 'pct_strong_river_folds',
    high: 0.25, medium: 0.15
  },
  bluffing_too_much: {
    // User raises with <25% equity in non-bluff spots
    metric: 'pct_raises_low_equity',
    high: 0.30, medium: 0.15
  }
}

async function calculateUserLeaks(userId: string): Promise<UserLeak[]> {
  // Pull last 200 hand decisions
  // Calculate each metric
  // Return ranked leak list with severity
}
```

---

## API Routes

```typescript
// Organized by feature

// Auth (Clerk webhooks)
POST   /api/webhooks/clerk          // Sync user creation/deletion to DB

// Sessions
POST   /api/sessions                // Start new session
PATCH  /api/sessions/:id            // Update session (add hands, EV)
GET    /api/sessions                // List user's sessions

// Hand decisions (core data collection)
POST   /api/decisions               // Log individual decision with EV result
GET    /api/decisions/summary       // Aggregated stats for dashboard

// Leaks
GET    /api/leaks                   // Get user's current leak profile
POST   /api/leaks/recalculate       // Trigger fresh leak calculation

// Adversary profiles
GET    /api/adversaries                // List user's adversaries
POST   /api/adversaries                // Create adversary profile
PATCH  /api/adversaries/:id            // Update adversary
DELETE /api/adversaries/:id            // Delete adversary
POST   /api/adversaries/:id/simulate   // Run hand replay against this adversary

// Blitz
GET    /api/blitz/scenarios         // Get batch of blitz scenarios (client-side gen preferred)
POST   /api/blitz/results           // Save blitz session results

// Usage limits (free tier enforcement)
GET    /api/usage/today             // Check today's replay + blitz counts
POST   /api/usage/increment         // Increment usage counter

// Payments (Stripe)
POST   /api/stripe/checkout         // Create checkout session
POST   /api/stripe/webhooks         // Handle payment events
GET    /api/stripe/portal           // Customer portal URL
```

---

## Monetization

### Pricing

| Tier | Price | Key Limits |
|---|---|---|
| Free | $0 | 15 replays/day, 5 blitz rounds/day, basic equity visualizer, no adversary lab |
| Pro Monthly | $9.99/month | Unlimited everything, adversary lab, full leak analysis, advanced modules |
| Pro Annual | $59.99/year | Same as monthly (save 50%) |
| Lifetime | $29.99 one-time | Unlimited everything, no subscription anxiety |

**Why lifetime:** The poker community on Reddit specifically complains about subscription models for training tools. A $29.99 one-time purchase is a psychologically easy yes for recreational players. It converts better than a subscription paywall for this demographic.

### Free Tier as Funnel

The free tier must be good enough to create habit. 15 replays/day is enough to play every day. The paywall triggers at the moment of peak engagement: when a user hits their limit mid-session, or when they try to create their first adversary profile.

---

## Build Phases

### Phase 1 — MVP (Weeks 1-6)
**Goal:** Two features that together form a complete, differentiated product.

- [ ] Monorepo setup (Vite + Express + shared engine package)
- [ ] Poker math engine: deck, hand evaluator, Monte Carlo equity
- [ ] Auth (Clerk) + user creation webhook
- [ ] Preflop Equity Visualizer (basic — no range slider, just grid + hand detail)
- [ ] Hand Replayer (heads-up NLH only, automated adversary, no range-guess mechanic)
- [ ] EV scoring system + session logging
- [ ] Basic dashboard (accuracy %, total EV)
- [ ] Free tier usage limits
- [ ] Stripe one-time payment (lifetime access only for MVP)
- [ ] Deploy: Vercel + Railway

**MVP Success Metric:** User plays 5+ sessions without being prompted.

---

### Phase 2 — Differentiation (Weeks 7-12)
**Goal:** Ship the features no competitor has.

- [ ] "Poker Logic Lab" range-guess mechanic in Hand Replayer (the key differentiator)
- [ ] Adversary Lab (behavioral sliders → hand range model)
- [ ] Blitz Mode
- [ ] Leak Detection algorithm + weekly drill targeting
- [ ] Full dashboard with leak breakdown by street
- [ ] Range slider on Equity Visualizer (Monte Carlo via web worker)
- [ ] Stripe subscription (monthly + annual)
- [ ] Reddit beta launch (r/poker, r/Poker_Theory)

---

### Phase 3 — Scale (Weeks 13-20)
**Goal:** Viral mechanics + content depth.

- [ ] Multi-way pots (3-handed, 4-handed equity calculations)
- [ ] "Stack vs Story" mode (narrative-driven hand scenarios from poker history)
- [ ] Ghost PvP Blitz (compete against another user's recorded session)
- [ ] Tournament math module (ICM, bubble factor, push/fold charts)
- [ ] Mobile-optimized PWA (add to home screen)
- [ ] Public EV leaderboard (opt-in)

---

## Environment Variables

```bash
# apps/api/.env

# Database
DATABASE_URL=postgresql://...

# Auth
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LIFETIME_PRICE_ID=price_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

```bash
# apps/web/.env

VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## Key Implementation Decisions

### Why Client-Side Monte Carlo?

Every competitor that shows equity calculations makes a server round-trip. This creates 200-500ms lag every time a user drags a range slider. Running 10,000 Monte Carlo simulations in JavaScript takes approximately 60-80ms on a mid-range mobile device. The experience feels instant. This is a significant UX moat.

Implement the Monte Carlo engine in a Web Worker so it never blocks the UI thread.

### Why No GTO Solver?

GTO solvers (GTO Wizard, PokerSnowie) cost $39-$129/month and require cloud compute to solve game trees. This app does not solve GTO — it teaches the math intuitively. The Monte Carlo engine for equity estimation is all the compute needed. Keep it simple and fast.

### EV Scoring Is the Retention Engine

The single biggest habit-forming mechanic is the EV score. Unlike chip counts (which reward luck), EV score rewards good thinking. Users who make consistently good decisions will see their score climb even through bad luck streaks. This is the core psychological loop that keeps users coming back: "I made the right call, even though I lost. My score went up."

This reframe — from results to decisions — is what transforms how someone thinks about poker. It is the app's highest-value educational output.

### The "Why" Is Non-Negotiable

Every decision result screen MUST include a plain-English explanation of the math. This is the gap competitors miss. Do not show "Correct" or "Incorrect" without a 2-3 sentence explanation. The explanation is the product.

---

## Coding Standards

- TypeScript strict mode throughout
- Zod for all API request/response validation
- All poker math functions must have unit tests (critical for correctness)
- Components should be <200 lines — extract logic into hooks
- No any types
- Error boundaries on all feature modules
- Loading states on all async operations (no blank screens)
- Mobile-first responsive design (most poker players will be on mobile)

---

## Starting Point for Claude Code

When you begin, start here in this order:

1. `packages/poker-engine` — Build and test the math engine first. Nothing else works without correct equity calculations.
2. `apps/api` — Scaffold Express + Drizzle + Clerk auth.
3. `apps/web` — Scaffold Vite + Tailwind + Zustand.
4. Feature: Preflop Equity Visualizer — First visible feature, validates the math engine visually.
5. Feature: Hand Replayer (basic, no range-guess) — Core loop without complexity.
6. EV Scoring + Dashboard — Makes sessions feel meaningful.
7. Add "Poker Logic Lab" range-guess mechanic to replayer — The differentiator.

Do not start on Adversary Lab or Blitz until the core replayer loop is solid and tested.
