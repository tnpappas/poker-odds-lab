# Email Funnel Handoff — Poker Logic Lab

_Paste this whole file at the top of a new chat to start the email/ebook lead-magnet workstream with full context. Also re-upload the ebook PDF (chat file uploads do not carry over between chats)._

---

## 1. The goal of this workstream

Build an **email funnel** for Poker Logic Lab using a **free ebook as the lead magnet**. Someone gives their email, gets the ebook, enters a nurture sequence, and converts to the $24.99 app.

Funnel shape: **social / landing page → "Get the free guide" → email capture → auto-deliver the PDF → nurture emails → buy the app.**

The email list is the compounding asset. It is also how future products launch to a warm audience.

---

## 2. The lead magnet (the asset)

- **Ebook:** "Playing Online Texas Hold'em — Poker Logic Lab Edition." Branded cover, on-brand (spade-and-brain logo, felt/chips motif).
- **Status:** DRAFT, not final. Re-upload the current PDF to the new chat.
- **Intended use:** email opt-in incentive AND a content mine (each chapter/tip becomes a short video or carousel).
- **Rule for the content:** it should genuinely teach, then bridge to the app ("here's the concept, now drill it in Poker Logic Lab"), not be one long ad.

---

## 3. What needs to be built (three pieces)

1. **Email capture on the site.** The site has NO email capture yet. Add an opt-in form (landing page hero and/or a "get the free guide" section, plus the Lab Notes blog). Simplest path: embed the email platform's hosted form so no custom backend is needed. Fuller path: a backend route + a table, if we want emails in our own DB.
2. **An email platform.** Not chosen yet. Candidates for a simple ebook funnel: Kit (ConvertKit), MailerLite, Beehiiv. It must: capture addresses, auto-deliver the PDF, and send a nurture sequence. (Note: Troy also uses Klaviyo for My Driven Threads, so that is an option if he wants one tool.)
3. **A nurture sequence.** The delivery email plus 3 to 5 follow-ups that teach a bit more and convert readers to the $24.99 app. This is where free readers become buyers, so it matters as much as the book.

Plus: **social repurposing** — promote the free guide as a soft CTA in shorts/posts, and turn book sections into short-video scripts (the `poker-shorts` skill can do this).

---

## 4. Open decisions to make

- Which email platform (Kit vs MailerLite vs Beehiiv vs Klaviyo).
- Embed a hosted form (no backend) vs build our own capture route + DB table.
- Single vs double opt-in.
- Where the opt-in lives (homepage hero, dedicated /free-guide page, Lab Notes, exit-intent popup).
- Link-in-bio vs direct site link, and per-platform UTM tracking.

---

## 5. Product context (the essentials)

- **Product:** Poker Logic Lab, pokerlogiclab.com. Educational poker **decision-training** app. NOT gambling, no real-money wagering.
- **Positioning:** teaches you to read opponents and make the +EV call/fold/raise. Scored on EV (decision quality), not luck. Tagline: "Stop losing to better math. Start winning with better reads."
- **Price:** $24.99 one-time Lifetime. 14-day money-back guarantee.
- **Legal entity:** TNP Digital Ventures (DBA Poker Logic Lab), 2128 London Bridge Rd #103, Virginia Beach, VA 23456.
- **Support email:** support@pokerlogiclab.com (Google Workspace).
- **Status:** fully live and operational (payments via PayPal, auth via Clerk, monitoring on). Current focus is customers, not features.

## 6. Brand voice (obey in all copy)

- Confident, plain-spoken, like a sharp friend. Evidence-first, real numbers.
- **No em dashes.** No hype words (unlock your potential, seamless, revolutionary, game-changer).
- Educational, never "gambling" or a way to gamble. Never promise winnings.
- Lead with the competitor anchor: "$24.99 once. Less than one month of GTO Wizard. Yours forever."

---

## 7. Technical context (for whoever builds the capture form)

- **Repo:** github.com/tnpappas/poker-odds-lab. Monorepo: `apps/web` (React 19 + Vite + Tailwind + Zustand), `apps/api` (Express + TS + Drizzle + Neon Postgres).
- **Deploy:** Vercel hosts the web (auto-deploys on push to `main`). Railway hosts the API (`polapi-production.up.railway.app`).
- **Auth:** Clerk. **Payments:** PayPal (merchant of record). **DB:** Neon.
- **Owner allowlist:** `OWNER_EMAILS` env var on Railway grants free app access (currently troynpappas@gmail.com).
- **Patch workflow (important):** the build environment cannot commit/push. Changes are delivered as `.patch` files; Troy copies the patch into the repo folder and runs `git apply --3way`, then commits and pushes himself. **`apps/web/src/App.tsx` has a line-ending quirk** (whole-file diffs), so edits to it are done with content-based PowerShell replaces, not patches.
- **Existing site pieces to reuse:** per-route SEO component, sitemap, the Lab Notes blog (`apps/web/src/content/posts.ts`, `/blog`), footer links.

---

## 8. Supporting files already in the repo (optional deeper context)

- `POKER_LOGIC_LAB_SUMMARY.md` — full product + reusable-stack summary.
- `MARKETING_BRIEF.md` — brand voice, positioning, message bank, audience.
- `ORGANIC_MARKETING_PLAN.md` — the free-channel plan the funnel sits inside.
- `SHORT_VIDEO_SCRIPTS.md` — first batch of short-video scripts.
- `SOCIAL_PROFILE_SETUP.md` — handles + bios for the social accounts.
- `PRICING_DECISION.md`, `LAUNCH_PLAYBOOK.md` — pricing and launch reference.

---

## 9. Suggested opening message for the new chat

> I'm building an email funnel for Poker Logic Lab using a free ebook as the lead magnet. I need three things: email capture on the site, an email platform picked and set up, and a nurture sequence that converts free-book readers into $24.99 buyers. It should also feed my social content. Full context is in the handoff below, and I've re-uploaded the ebook draft. Let's start by [choosing the email platform / building the capture form / writing the nurture sequence].

---

_Handoff prepared at the end of the build thread. Everything above reflects the live state of Poker Logic Lab._
