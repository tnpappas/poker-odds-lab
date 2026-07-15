# Poker Logic Lab — Design Brief / Hermes Hand-off Prompt

Paste the block below to a design agent (Hermes) to produce the visual identity
and UI direction for Poker Logic Lab. It is self-contained: positioning, the
current visual system (with real color tokens), every screen, and the deliverables.

## LOCKED DECISIONS

These are approved and take precedence over anything in the hand-off prompt below.

### Section 1 — Visual identity (LOCKED)

**Name:** Poker Logic Lab · pokerlogiclab.com. ("Logic," not "Odds" — the product is decision-training, not a calculator.)

**Base palette — near-black with a faint green tint** (live in `apps/web/src/index.css` `@theme`):
- `--color-felt-950: #070b09` — base background
- `--color-felt-900: #0c110e` — card surface
- `--color-felt-800: #141b17` — raised surface
- `--color-felt-700: #223029` — borders / hairlines
- body top glow softened to `#0f241a40`
- Accents unchanged: gold `#e9c46a` / `#d4a843`; ink `#eef2f0` / `#aebbb4` / `#6b7d75`.

**Color meaning — enforce everywhere:**
- Green `#2a9d8f` = You · +EV · correct decision
- Red `#e63946` = the Adversary · −EV · the threat being read
- Gold `#e9c46a` = the app's own voice — scores + the single focus number on a screen. Use sparingly.

**Logo:** hand-grid glyph — a square 5×5 grid (nod to the 13×13) washed green→gold→red to signal equity. Must also read as a one-color flat app icon. No card-suit clichés.

**Typography:** geometric sans for UI/headers; **monospace for every number** (equity %, EV, pot odds, stack sizes, timers). Mono numerals are the signature "precision-instrument" cue.

**Signature motif:** the 13×13 hand grid — reused as the logo and as a faint background texture across screens for cohesion.

**Tone:** high-end poker *lab* / trading terminal, not a casino. Restraint and negative space; let the numbers be the hero.

---

### Section 2 — Feature UX (LOCKED)

New-user intuition is the tiebreaker for every call below.

**Equity Calculator.** Inputs left, one giant gold mono `%` on the right as the hero readout. Card entry = tap-a-slot then tap the rank/suit keypad; selected slot glows gold, used cards dim. Recomputes live as the range is painted (subtle shimmer, never a blank). Below the number: an "is the price right?" verdict bar — green when equity clears the pot odds, red when it doesn't.
- **Default state: prefilled example** (e.g. AKs vs a 15% range) labeled "example — change anything," so the screen teaches itself instead of opening blank.

**Tournament Lab.** Two tabs.
- *Push/Fold trainer* — **reuses the Hand Replay card-table styling** (one visual language to learn) with a small **stack / BB chip** to signal the tournament context. Two big buttons: red **Shove**, neutral **Fold**. On answer: Nash verdict + EV in bb (mono) + streak counter.
- *ICM calculator* — stacks/payouts in; `$`-equity bars out, each labeled with its "± vs chip share" gap so the **ICM tax** is visible. Bubble factor shown as a big gold number that always self-translates: e.g. "1.4× → you need ~58%+ to call, not 50%." The lesson stays on screen, never just a bare number.

**Leak → drill loop (retention centerpiece).**
- The **practice queue sits at the top of the dashboard** whenever drills are due — the obvious "do this next."
- A **nav badge appears only when a drill is due**, so newcomers discover the loop without clutter.
- Each drill card: severity dot (red/yellow/green) · leak name · one-line "why" · streak pip · gold **Drill →** button (routes to a focused Blitz or to Replay).
- The payoff is the **return trip**: after drilling, the dashboard shows that leak's severity dropping, streak rising, and a "comes back in 3 days" countdown. Visible progress is the hook.
- Empty state is positive: "No leaks detected — your decisions are clean."

---

### Section 3 — Landing page (LOCKED)

Single-scroll, instrument-clean, **no signup wall** — visitors can try before creating anything.

1. **Hero** — headline **"Poker is a game of logic. Train yours."** with a subhead reinforcing the reads/EV angle (e.g. "A decision-training app — the math is the engine, the edge is reading real opponents"). Visual: a live equity number ticking over a faint 13×13 hand-grid. Single CTA: **"Play a free hand"** (not "Sign up").
2. **The reframe** — one line: *"You're not losing to bad cards. You're losing to better decisions."*
3. **The differentiator, front and center** — the range-guess mechanic, shown: *"Every trainer scores you against a solver. We score your read."*
4. **Feature grid** — Calculator · Hand Replay · Blitz · Tournament Lab · Adversary Lab · Leak→Drill, each in the instrument aesthetic.
5. **"The why is the product"** — a real result screen with its plain-English explanation, proving the app teaches rather than just grades.
6. **Pricing — lead with $29.99 lifetime as the hero**, anchored against "$40–130/mo solvers." Free tier shown beneath as the on-ramp. The one-time price is the pitch (the poker/Reddit audience resents subscriptions).
7. **Social proof — designed-but-placeholder.** Build the testimonial/results section now; leave it empty at launch and fill with real early-user quotes/beta stats later. No fabricated proof.
8. **Trust + final CTA.**

---

### Section 4 — Launch assets (LOCKED)

**Lead angle (test first everywhere): the EV reframe** — *"You made the right call and still lost. Your score went up."* This is the hero screenshot caption and the first ad/post headline.

**App icon:** the hand-grid glyph in one flat color on near-black. Distinct from the sea of card-suit icons.

**App Store screenshots (6)** — device frame + one benefit caption in brand type on near-black:
1. Range-guess mechanic — *"Score your read, not just your math."*
2. Equity Calculator — the instrument readout
3. Tournament Lab — the self-explaining bubble factor
4. Leak→Drill dashboard — *"Your leaks, found and fixed."*
5. Blitz — the game-feel shot
6. Pricing — *"$29.99 once. No subscription."*
(Order the store gallery with the EV-reframe hero first.)

**Key art / social card (og:image):** wordmark + glyph + tagline on near-black with one glowing equity number. Doubles as the Reddit share image.

**Ad / post angles, ranked to test:**
1. EV reframe — *"You made the right call and still lost — your score went up."*
2. Differentiator — *"Every trainer scores you against a solver. We score your read."*
3. Price wedge — *"Ditch the $130/mo solver."*
4. MTT — *"Learn ICM without the monthly bill."*

**Reddit launch (r/poker, r/Poker_Theory):** honest founder post + a demo **GIF of the range-guess mechanic**, free-tier emphasis, zero hard-sell — the community rewards "I built this, roast it," and punishes ads.

**ASO:** avoid the saturated "odds calculator" keyword lane; target *poker trainer · decision · EV · ICM · range · reads*.

---

---

```text
You are my product & brand designer. I've built a working web app called "Poker Logic Lab" and I need you to design its visual identity and UI direction. Here's everything you need.

═══ THE PRODUCT ═══
Poker Logic Lab — a poker DECISION-TRAINING app (not a math app).
Tagline: "Stop losing to better math. Start winning with better reads."
Positioning: The math is the engine under the hood; the product experience is learning to read and beat real opponents under uncertainty. EV-based scoring rewards good decisions, not lucky results. The headline differentiator no competitor has: a "range-guess" mechanic where the player paints the hands they think an opponent holds and gets scored on how accurate their read was.

Target user: recreational-to-serious live/online poker players, 20s–50s, mostly on MOBILE, who are tired of $40–130/mo GTO solvers. They want something fast, intuitive, habit-forming, and affordable ($29.99 lifetime / $9.99 mo).

Tone: confident, sharp, a little cinematic — a high-end "poker training lab," not a casino. Premium but not stuffy. Think "the tool a pro would actually respect," with enough game-feel to be addictive.

═══ CURRENT STATE ═══
The app is fully built and functional in React + Tailwind + Framer Motion. It already has a working dark "poker felt + gold" theme. I want you to ELEVATE this into a real, cohesive brand and UI system — keep the felt/gold DNA unless you have a strong reason to evolve it.

Existing color tokens (build on these):
  felt:  #070b09 (bg) · #0c110e · #141b17 · #223029   (near-black; see LOCKED section)
  gold:  #e9c46a (primary accent) · #d4a843
  chips: #e63946 (red / negative / fold) · #2a9d8f (green / positive / call)
  ink:   #eef2f0 (text) · #aebbb4 (muted) · #6b7d75 (faint)
Type: system sans currently. Motion: Framer Motion spring physics on cards & numbers.

═══ THE 5 SCREENS ═══
1. Home/landing — hero tagline + 4 feature cards.
2. Equity Visualizer — a 13×13 starting-hand grid colored red→green by equity, a detail panel, and a adversary-range slider that updates a live equity % in real time.
3. Hand Replay — a poker "table" (adversary cards, board, hero cards) + a decision panel with a paintable mini 13×13 grid ("paint the adversary's range"), live equity vs your read, then a result panel revealing the adversary's hand + a plain-English "why."
4. Blitz — a 30-second rapid-fire drill: one prompt, two big tap targets (left=fold/under, right=call/over), streak counter, timer bar.
5. Dashboard — skill points, accuracy, "EV by street" bar chart, and detected "leaks" (e.g. calling too wide).

═══ WHAT I NEED FROM YOU ═══
1. A logo / wordmark concept for "Poker Logic Lab" (and an app-icon version).
2. A refined color + typography system (specific font pairings + hex palette, building on the tokens above), with light guidance on when to use red vs green vs gold.
3. UI design direction for the 5 screens — describe the visual treatment of the hand grid, the poker table, cards, buttons, the equity number animation, and the mobile-first layout. Call out anything in my current theme you'd change and why.
4. A high-converting landing-page concept (sections, hero copy options, social proof framing, pricing presentation that leans on the $29.99 lifetime).
5. A short "launch asset" list: what I'd need for an App Store / Reddit (r/poker) launch — screenshots, key art, ad creative angles.

Deliver it as a clear, organized design brief I can act on. Where useful, give me concrete options (e.g. 2–3 logo directions, 2 font pairings) and a recommendation. Ask me any clarifying questions first if you need them.
```
