# Costs

Every paid or metered service, the tier in use, and where the price jumps. Review monthly (RUNBOOK.md). Figures are the vendors' published tiers as of September 2026; check each vendor's pricing page before relying on them.

| Service | Purpose | Tier now | Monthly cost now | Where the tier changes |
|---|---|---|---|---|
| Vercel | Frontend hosting | Hobby | $0 | Hobby is non-commercial per Vercel's fair-use terms; a paid product should move to Pro ($20/seat) once revenue starts. 100 GB bandwidth/month cap on Hobby. |
| Railway | API hosting | Hobby | about $5 (includes $5 usage credit) | Usage billed above the credit; the API is a single small replica and has stayed inside it. |
| Neon | Postgres | Free | $0 | Free: 0.5 GB storage, at most 6 hours of history, compute auto-suspends. Launch plan ($19) adds 7-day history and no auto-suspend. Move when there are paying customers (restore window matters). |
| Clerk | Auth | Free | $0 | Free up to 10,000 monthly active users; Pro is $25/month plus per-MAU above that. |
| PayPal | Payments | Standard | 0 fixed | Per transaction: about 3.49% + $0.49 for US consumer payments (check the current rate card). On $7.99 that is about $0.77, on $49 about $2.20. |
| Sentry | Error tracking | Developer (free) | $0 | 5,000 errors/month; Team plan starts at $26. Tracing is off to stay inside the free quota. |
| GoHighLevel | CRM, email delivery of the book | Existing AI4B agency account | shared across businesses | Not attributable to Poker Logic Lab alone. |
| GitHub | Code and CI | Free | $0 | 2,000 Actions minutes/month on Free for private repos; each CI run is about 2 minutes. |
| Domain pokerlogiclab.com | | | about $15/year | Registrar renewal. |
| Meta ads | Acquisition | Campaign | variable | Not a platform cost; see the marketing budget. |

## Per customer
Platform cost per paying customer is close to zero at current scale (all services are inside free or hobby tiers). The only variable cost is the PayPal fee: about 9.6% of a monthly payment, 4.5% of an annual one. Gross margin on subscription revenue is therefore above 90% until hosting tiers change.

## At 10x users (roughly 1,000 monthly actives, 100 paying)
Vercel Pro $20, Railway about $10, Neon Launch $19, Clerk still free, Sentry likely still free. Total about $50/month against roughly $600 to $800/month revenue.

## Free-tier cliffs to watch
- Neon compute auto-suspend on Free adds a cold-start delay to the first API call after idle (seen as a slow first sign-in).
- Vercel Hobby is not licensed for commercial use; this is a terms issue, not a technical one.
- Sentry quota: a runaway error loop can burn 5,000 events in minutes; rate limits on the project are the fix.
