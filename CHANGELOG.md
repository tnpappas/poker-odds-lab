# Changelog

All notable changes, newest first. Dates are the day the change went live on pokerlogiclab.com.

## 2026-10-22

### Live Read Challenge prizes are automatic
- When Day 7 closes (Oct 26, 7pm ET), the API writes one prize row per winner from the final leaderboard: 1st place a year of unlimited access, 2nd to 5th a month, and everyone else who answered all seven days the free chapters (table `challenge_prizes`, migration 0004; the API creates the table itself on startup).
- Each winner is tagged in GHL (`lrc-prize-1st`, `lrc-prize-top5`, `lrc-all-7`; a top 5 winner who answered all seven days gets the chapters tag too). The tag fires the winner email. A failed tag is retried every 10 minutes.
- A ranked prize turns on the first time the winner signs in with the email they entered with (Gmail dots and +tags match). Access starts when applied and ends on a real date (`users.pro_until`), so it expires on its own. It is applied once and never stacks.
- Account page shows "Live Read Challenge prize" with the end date instead of "Cancelled". The owner page lists every prize with emailed and applied status. The manual grant form is no longer needed for prizes.

## 2026-10-11

### Footer
- YouTube link added next to Instagram and Facebook, pointing to the channel's new handle https://www.youtube.com/@PokerLogicLabHQ (the old @PokerLogicLab-1 handle is released about Oct 25, 2026).

## 2026-10-10

### Search visibility
- Public pages are now prerendered to static HTML at build time (`apps/web/scripts/prerender.mjs`): home, guide, pricing, Lab Notes and every post, challenge, rules and the legal pages. Before this, a crawler that does not run JavaScript received an empty page with the same title on every URL. Each page now ships its own title, description and canonical link. The tool pages (sign-in gated) get their own titles too. Every other URL falls back to the empty app shell, `app.html`.
- The build fails if any public page renders without real content or if two pages share a title.
- `/pricing` added to the sitemap.

### Email capture
- Free chapters signup (Pot Odds and Outs, Playing the Flop) on the homepage, pricing page and guide. Public route `POST /api/leads/free-chapters` tags the contact `free-chapters` in GoHighLevel; the PDF download is handed over on the page as soon as the address is saved. Fires a Meta `Lead` event for visitors who accepted tracking.

### Pricing page
- Names the payment method: checkout through PayPal, with PayPal balance, bank, or a debit or credit card.

### Security
- proxy-addr 2.0.7 to 2.0.8 to clear a new critical advisory (IP spoofing through a trusted subnet). It failed the CI audit on the first push of the day, which held back the API deploy.

### Operations
- Railway only redeployed the API when a file under `apps/api` changed, so dependency and poker engine updates never reached production. Watch paths now live in `railway.json` and include the lockfile, root `package.json`, `packages/` and `railway.json` itself.
- `/api/health` reports the running commit, so a deploy can be confirmed from outside.

### Fixes
- Text that showed a raw `\u2019` or `\u2026` code instead of an apostrophe or ellipsis (homepage book paragraph, pricing page, paywall, access check).

## 2026-09-12 (evening)

### Billing
- Live walkthrough (non-owner account, real $7.99 subscription, in-app cancel, refund) found and fixed two defects: every webhook was failing with a column name mismatch (`webhook_events.received_at`), and a cancelled subscriber lost access immediately instead of at the end of the paid period. Now `users.pro_until` holds the paid-through date; cancel keeps Pro until then, and the Account page shows "Renews" or "Cancelled. Access ends" with the date. Migration 0002.

### Privacy and security
- Meta Pixel no longer loads on page open. A one-time banner asks visitors to Accept or Decline; only Accept loads the pixel. Privacy policy updated to say so (it previously said no advertising cookies were used while the pixel loaded unconditionally).
- Two-factor authentication turned on and verified for GitHub, Vercel, Railway, Neon, Clerk, Sentry and PayPal.
- Dependency upgrades to clear high-severity advisories: drizzle-orm 0.36 to 0.45.2 (SQL identifier escaping), react-router-dom 7.1 to 7.18.3 (open redirect). CI production audit now passes.
- Railway waits for CI to pass before deploying the API.

### Operations
- Neon moved to the Launch plan; history window set to 7 days; daily snapshots kept 14 days; point-in-time restore rehearsed (preview query returned 14 users).
- Uptime monitoring confirmed in UptimeRobot: API health endpoint and the site, 5 minute checks, email alerts.
- Secret scan of the full git history: no real secrets ever committed.
- One-off helper .bat files retired to `_to_delete/`; the standard set is 1-Start-App, 2-Run-Tests, 3-Deploy, 4-Pull-Latest.

## 2026-09-12

### Billing and accounts
- PayPal subscriptions live: product Poker Logic Lab, plans Monthly $7.99 and Annual $49; Railway plan ids set; webhook tracks activated, cancelled, expired, suspended, re-activated, payment failed and sale completed.
- New `/account` page: see your plan, cancel the subscription, open PayPal payment details, delete your account.
- In-app cancel fixed (the subscription id was never stored before).
- Account deletion now cancels the PayPal subscription first and refuses if PayPal is unreachable.
- Failed renewals: access ends on SUSPENDED and returns on RE-ACTIVATED.
- Checkout return reads `subscription_id` (previously read `ba_token`, which PayPal would reject).
- Legal pages name PayPal as the payment provider and TNP Digital Ventures LLC as the entity.

### Reliability and security
- Every webhook delivery is recorded; redeliveries are no-ops; a late cancel for an old subscription cannot revoke a newer one.
- Production refuses to start if a required environment variable is missing.
- Timeouts and one retry on every PayPal and GoHighLevel call.
- Request id on every response and log line; billing routes rate limited to 10/min/IP.
- Sentry error tracking on the API and the web app (crash screen with reload).
- Polar and Stripe code removed; PayPal is the only processor.

### Database
- Migration 0001: `plan` enum, `updated_at` columns, indexes on every user_id and list ordering, `webhook_events` table.

### Engineering
- API split into feature routers; all environment reads through `config.ts`.
- 32 API tests (auth, tenant isolation, billing, webhooks, config); ESLint; CI runs lint, typecheck, tests, build and a production dependency audit.
- docs/ set added: ARCHITECTURE, SCHEMA, DECISIONS, RUNBOOK, KNOWN-ISSUES, COSTS, ACCOUNTS, BUILD-STANDARD.

## 2026-09-10
- Switched from $24.99 lifetime to freemium plus subscription ($7.99/mo, $49/yr). Free tier: 3 replays and 2 blitz rounds per day, Visualizer and Calculator free.

## 2026-09-09
- Pricing link in the main nav; hero call to action "Play a free hand" with the free-trial hint.
- Free users can try Replay, Blitz and Visualizer before paying.

## 2026-09-05
- Homepage hero: looping table video with the engine-verified equity overlay.
- Lab Notes: Implied Odds Explained.
