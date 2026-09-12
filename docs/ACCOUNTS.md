# Accounts

Every third-party account by name and owner email. Passwords live in Troy's password manager, never here. Two-factor authentication status is recorded so it can be audited.

| Service | Account / org | Owner email | Role | 2FA |
|---|---|---|---|---|
| GitHub | tnpappas/poker-odds-lab (private) | Troy's GitHub account (tnpappas) | Owner | ON (authenticator app, recovery codes saved), confirmed 2026-09-12 |
| Vercel | troy-pappas-projects, project poker-odds-lab-api | Troy's Vercel login (signs in via GitHub) | Owner | ON (TOTP), confirmed 2026-09-12 |
| Railway | tnpappas's Projects, project Poker Logic Lab, service @pol/api | troynpappas@gmail.com (shown in Railway) | Owner | ON (authenticator app), confirmed 2026-09-12 |
| Neon | org safehouse-group, project poker-logic-lab | Troy's Neon login (signs in via GitHub) | Admin | ON (authenticator app), confirmed 2026-09-12 |
| Clerk | Poker Logic Lab application | Troy's Clerk login (signs in via GitHub) | Owner | ON (authenticator app, backup codes), confirmed 2026-09-12 |
| PayPal | Business account, Poker Logic Lab | support@pokerlogiclab.com | Owner | ON (2-step verification, authenticator app), confirmed 2026-09-12 |
| PayPal developer | REST app "Poker Logic Lab" (live), webhook 5W508926BC789293F | same PayPal account | | |
| Sentry | org tnp-digital-ventures, projects poker-logic-lab-api, poker-logic-lab-web | Troy's Sentry login | Owner | ON (authenticator app), confirmed 2026-09-12 |
| GoHighLevel | AI4B agency, sub-account for Poker Logic Lab | Troy's GHL login | Agency admin | verify |
| Domain | pokerlogiclab.com | registrar under Troy's account | | verify |
| Meta | Ad account 2926054937746428 under business 2085625405079697 | Troy's Meta Business login | Admin | verify |
| Google | support@pokerlogiclab.com mailbox | | | verify |

| UptimeRobot | monitors "Poker Logic Lab API" (https://polapi-production.up.railway.app/api/health) and "www.pokerlogiclab.com", 5 minute checks, email alerts to Troy | Troy's UptimeRobot login | Owner | verify |

"verify" means the 2FA status has not been confirmed in this document yet; the remaining ones are an open item in KNOWN-ISSUES.md.

Environment variables and which dashboard holds them: see `apps/api/.env.example` (Railway) and `apps/web/.env.example` (Vercel).
