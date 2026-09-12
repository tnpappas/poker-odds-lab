# Runbook

How to operate Poker Logic Lab. Troy does not use the command line: every step that needs one is a `.bat` file in the project root, double-clicked.

## Accounts and where things live
See ACCOUNTS.md. Hosting: Vercel (frontend), Railway (API), Neon (database), Clerk (auth), PayPal (billing), Sentry (errors), GoHighLevel (CRM), GitHub (code).

## Deploy
Everything deploys from a push to `main`. There is no separate deploy button.
- `3-Deploy.bat` runs lint, typecheck, engine tests, API tests and the web build, and only pushes if all pass. GitHub Actions repeats the same gates on the push.
- Vercel rebuilds the frontend in about 20 seconds; Railway rebuilds the API in about 90 seconds. Both show the commit message in their dashboards.
- Schema changes: apply the SQL in `apps/api/drizzle/` in the Neon SQL editor FIRST (project poker-logic-lab, branch production, database neondb), then push the code.

## Roll back
- Frontend: Vercel > Deployments > pick the previous "Ready" deployment > "..." > Promote to Production. Takes seconds.
- API: Railway > service @pol/api > Deployments > previous successful deployment > "..." > Redeploy.
- Code: `git revert` the commit and push (ask Claude to prepare the .bat). A schema migration is never rolled back; migrations are additive so old code runs against the new schema.
- Rehearsed: not yet. First rollback drill is an open item in KNOWN-ISSUES.md.

## Check the site is up
1. https://polapi-production.up.railway.app/api/health should return `{"ok":true,"storage":"postgres","auth":"clerk","payments":"paypal","errorTracking":"sentry"}`.
2. https://www.pokerlogiclab.com/pricing should load and show the three tiers.
3. Sentry (org tnp-digital-ventures) shows no new issues in the last hour.
If the frontend is up but the API is down, the tools still work locally but sign-in, entitlement and checkout do not.

## Find a user's errors
- Every API response carries an `x-request-id` header and every 500 body includes `requestId`. Ask the customer for the id from the error message.
- Railway > @pol/api > View logs (or Logs tab) > search the request id. Log lines are JSON with `requestId`, `userId`, `path`.
- Sentry > poker-logic-lab-api > Issues, filter by the same id or the user's email.
- Frontend crashes appear in Sentry > poker-logic-lab-web, with the page URL and browser.

## Find a user and fix their access
- Neon SQL editor: `select id, email, plan, paypal_subscription_id, created_at from users where email ilike '%name%';`
- To comp or restore access without SQL: sign in as an owner, go to https://www.pokerlogiclab.com/admin, enter the email, click Grant.
- To see whether PayPal thinks they are subscribed: PayPal business account > Activity > search the email, or Subscriptions > Subscriptions list.

## Replay or inspect a webhook
- PayPal: developer.paypal.com > Apps & Credentials > Live > Poker Logic Lab > Webhooks > the webhook > Event logs. Each delivery can be resent. A resend with the same event id is ignored by the API (webhook_events table) and answers `{"received":true,"duplicate":true}`.
- Clerk: Clerk dashboard > Webhooks > the endpoint > Logs > Resend.
- Verify signatures are working: a forged POST to `/api/paypal/webhooks` answers 403.

## Rotate a key
- PayPal secret: developer.paypal.com > the app > "Add Second Key", set the new secret on Railway as PAYPAL_SECRET, deploy, then delete the old key.
- Clerk secret: Clerk dashboard > API keys > roll, update CLERK_SECRET_KEY on Railway.
- Database: Neon > Roles > reset password, update DATABASE_URL on Railway.
- Sentry DSN: Sentry > project settings > Client Keys; update SENTRY_DSN (Railway) or VITE_SENTRY_DSN (Vercel, then redeploy).
After any Railway variable change, Railway prompts "Apply changes / Deploy"; click Deploy.

## Backups
- Neon org safehouse-group is on the Launch plan (usage based) since 2026-09-12. Project poker-logic-lab history window is 7 days (Settings > History window). Daily snapshots at 00:00 UTC, kept 14 days (branch production > Backup & Restore > Edit schedule).
- To recover: Neon > branch production > Backup & Restore. Pick the point in time, click "Preview data" and run a read-only query (for example `select count(*) from users;`) to confirm it is the state you want, then "Proceed to restore". Neon keeps the pre-restore state as a backup branch, so a wrong restore can itself be undone. Or restore from a snapshot in the list below the point-in-time picker.
- Rehearsed 2026-09-12: preview at 20:28 UTC returned 14 users; the production restore itself was not run (nothing to fix). Time to preview: under a minute.

## Top failure scenarios
1. "Missing PayPal plan ID" or checkout 500: a Railway variable is missing. The API now refuses to start without them, so check Railway deploy logs for "Refusing to start in production".
2. Customer says they cancelled but lost access early: check `users.pro_until` for them; if null (pre Sept 12 subscription) grant via /admin until their period ends.
2b. Customer paid but has no access: check `webhook_events` for the ACTIVATED event; check Sentry for a capture error; grant via /admin as a stopgap; investigate the custom_id on the PayPal subscription.
3. Customer keeps being billed after cancelling: confirm the subscription status on PayPal; the CANCELLED webhook revokes access, PayPal itself stops billing.
4. Site down: check Railway (API) and Vercel (frontend) status pages and the health URL above. If Railway shows the last deploy failed, redeploy the previous one.
5. Clerk sign-in broken: Clerk status page; confirm VITE_CLERK_PUBLISHABLE_KEY on Vercel and CLERK_SECRET_KEY on Railway are from the same Clerk instance.

## Monthly review
- Vercel, Railway, Neon, Clerk, Sentry usage against free-tier limits (COSTS.md).
- `npm audit` output from the last CI run.
- Vendor changelogs: PayPal Subscriptions API, Clerk SDK, Drizzle.
- Rehearse one rollback or restore.

## Security incident or suspected breach
1. Rotate the affected key first (section above), then investigate. Keys: Clerk secret, PayPal secret, Neon connection string, Sentry DSN, GHL token.
2. Sign out all sessions where the vendor offers it (Clerk dashboard for users; each vendor's account security page for Troy's own logins).
3. Check Sentry and Railway logs for the request ids involved; check `webhook_events` for unexpected grants.
4. If customer data was exposed, note what, when, and who; email affected users from support@pokerlogiclab.com within 72 hours with what happened and what they should do. Virginia's breach law applies to the LLC.
5. Record the incident and the fix in DECISIONS.md.

## Data retention
- Customer rows live until the customer deletes the account (hard delete, cascades) or emails support@pokerlogiclab.com.
- `webhook_events` rows are kept indefinitely (small, and they are the audit trail for billing disputes).
- Sentry events expire on Sentry's free-plan schedule (90 days). Railway logs follow Railway's retention. UptimeRobot keeps its own history.
- No files are uploaded by customers, so there is nothing else to purge.
