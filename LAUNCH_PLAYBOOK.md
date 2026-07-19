# Poker Logic Lab — Launch Playbook

A practical, sequenced plan to validate, launch, and get your first customers. Built for a solo founder shipping their first monetized SaaS. Work top to bottom.

---

## Where you are right now

**Done:** full app, real brand and logo, casino landing page, beginner guide, per-tool help, hard paywall, real Polar checkout, production Clerk auth on your domain, legal pages, SEO + social tags, code-split for speed.

**Not done yet (finish before you spend a dollar on marketing):** one real test purchase, support email, analytics, uptime monitor, legal review. These are in Part 2.

The single most important mindset: **you are done building. Your job now is customers, not features.**

---

## Part 1 — Validate before you invest (1 to 2 weeks)

Goal: prove real poker players will pay $24.99 *before* you pour time and money into marketing. This is the step most first-timers skip and regret.

- [ ] **Talk to 15 to 20 poker players.** Your local/home games, poker Discords, r/poker DMs, poker Twitter, friends of friends. Show them the landing page and the guide.
- [ ] **Ask the real question:** "Would you pay $25 once for this?" Then watch what they *do*, not just what they say. Polite "that's cool" is a no. "How do I buy it?" is a yes.
- [ ] **Let 5 to 10 actually use it.** Comp them (add their email to your owner allowlist, or make a 100%-off Polar code). Watch them the first two minutes. Where do they get confused? That's your onboarding fix.
- [ ] **Try to make 3 to 5 real sales now**, even at an early-bird price. A handful of genuine strangers paying is the strongest signal you can get.

**Green light:** multiple people finish the guide, ask questions, or try to buy unprompted.
**Yellow/red light:** confusion about what it is, or polite interest with zero action. If so, fix the message or the product before marketing.

---

## Part 2 — Launch-readiness checklist (finish these first)

- [ ] **Real test purchase** end to end. Create a 100%-off code in Polar, buy as a non-owner account, confirm: paywall → checkout → "You're in" screen → tools unlock → webhook created the user → Polar emailed a receipt.
- [ ] **Support email live** (`support@pokerlogiclab.com` in Google Workspace). Send a test to it.
- [ ] **Analytics installed.** Vercel Analytics (one toggle) for basics, or PostHog/Plausible for funnels. You must be able to see: visitors, where they came from, and how many buy.
- [ ] **Uptime monitor** on `https://polapi-production.up.railway.app/api/health` (UptimeRobot is free) so you're alerted if the API goes down.
- [ ] **Legal review.** Have someone check the Terms/Privacy/Refund pages and add your legal entity name + address.
- [ ] **Google Search Console:** add the site, submit `sitemap.xml`. Kicks off indexing.
- [ ] **Real mobile test:** iPhone Safari + Android Chrome, full purchase flow.
- [ ] **Confirm branded auth emails** deliver from your domain (check spam folder too).

---

## Part 3 — First 90 days: getting customers

**Principle:** pick one or two channels and go deep. Do not spread yourself across six platforms. For a poker audience at a low one-time price, your best channels are **content/SEO, Reddit + poker communities, and short-form video (YouTube Shorts / TikTok)**. Paid ads come *after* you've proven people buy.

### Weeks 1 to 3 — Foundation + soft launch
- [ ] Set up Search Console + submit sitemap (from Part 2).
- [ ] Turn on analytics and watch your baseline.
- [ ] **Soft-launch to your network** and the people from validation. Get your first sales and, critically, your first **testimonials** (ask every happy buyer for one line).
- [ ] Join 3 to 5 poker communities (r/poker, r/PokerTheory, poker Discords, a forum). **Just be a helpful regular for now. Do not pitch.**
- [ ] Write 2 to 3 cornerstone articles from the keyword list in your marketing brief ("how to calculate pot odds fast," "what is EV in poker," "how to put someone on a range"). These are your long-term SEO assets and social fuel. Publish on the site's guide, Medium, or a simple blog.

### Weeks 4 to 8 — Content engine + community
- [ ] Post **short-form video 2 to 3x per week:** quick math tips, "you folded a winner, here's why," screen-recordings of the tools solving a spot. This is the highest-leverage channel for poker.
- [ ] In communities, post genuinely useful answers and hand breakdowns; mention the tool only where it naturally fits; put the link in your profile/bio, not every comment.
- [ ] Start an **email list** (even a simple form). Offer a lead magnet like "5 leaks quietly costing you money." Owning an audience is what makes product #2 easy.
- [ ] Add your best testimonials to the landing page.

### Weeks 9 to 12 — Amplify what works
- [ ] Open analytics and answer one question: **which channel actually produced buyers?** Double down on that one. Drop the rest.
- [ ] Only if organic conversion is proven (you can see visitors buying), run a **small paid test** ($5 to $10/day) on Meta or Reddit. Use your Facebook-ads skill. Kill it fast if the cost per sale is above ~$25.
- [ ] Reach out to 5 to 10 poker YouTubers/streamers for a review or affiliate deal (give them a code + a cut).
- [ ] Ship one product improvement from the feedback you've gathered.

---

## Part 4 — The numbers that matter

Track these; ignore vanity metrics like raw page views.

- **Visitor → buyer conversion.** Cold traffic ~1 to 3% is normal; warm/referred is much higher. If it's near zero with real traffic, the problem is your message or price, not your ad spend.
- **Traffic by source.** Which channel sent the buyers?
- **Refund rate.** Under ~5 to 10% is healthy. Higher means a mismatch between promise and product.
- **Cost per customer** (if running ads) vs. your $24.99 price. If it costs more than ~$25 to make a $25 sale, stop and rethink.

**Early north star:** number of paying customers, and the channel each one came from.

---

## Part 5 — Weekly operating rhythm (solo)

- **Daily (15 min):** check support email, glance at uptime + Sentry errors, do one thing for distribution (post a tip, answer in a community).
- **Weekly:** publish 2 to 3 short videos/posts + 1 longer article, review analytics, ship one small improvement.
- **Monthly:** review the numbers, cut what isn't working, pour more into what is.

---

## Part 6 — Setting up for the *next* products

- **Reuse this stack as a template.** Vite + Vercel, Express + Railway, Neon, Clerk, Polar, and the paywall/gating pattern are now solved. Product #2 ships far faster.
- **Build an owned audience** (email list, YouTube, a community) that you can launch every future product into. This is your real compounding asset.
- **Prefer recurring revenue** for products where the market allows it. One-time sales are a leaky bucket; subscriptions compound.
- **Validate demand before building** the next one. Sell first, build second, when you can.
- **Distribution beats features.** Across a portfolio, the winner is whoever reaches the most of the right people, not whoever ships the most code.

---

*The order matters: validate (Part 1), finish launch prep (Part 2), then pick one channel and go deep (Part 3). Do not skip Part 1.*
