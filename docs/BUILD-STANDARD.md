# SaaS Build Standard and Review Checklist

Owner: Troy Pappas, TNP Digital Ventures LLC Version: 1.0, September 9, 2026 Audience: Hermes (or any AI agent or developer building a SaaS product for Troy)

---

## How to use this document

Paste this file into the project folder of every SaaS build (for example as `docs/BUILD-STANDARD.md`) and reference it in the agent's project instructions. Then:

- At project start, the agent reads Sections 1 through 3 and confirms the project is set up to match before writing feature code.  
- At every milestone (a feature finished, a release candidate, a "done" claim), the agent works through the checklist and returns the Milestone Gate Report in Section 17\. Every item gets one of four answers: **Yes** (with proof), **No** (with the reason), **Not applicable** (with the reason), or **Could not verify** (with what would be needed to verify it).  
- "Proof" means something Troy could look at: a file path and line number, a test that ran and its output, a screenshot, a log entry, a query result. "I built it" is not proof. "I ran it and here is what it returned" is proof.

Troy's standing rules that apply to every item:

- Show proof it works, not proof it was built. Run a real test. State explicitly what could not be verified.  
- Check for cross-business contamination by name: wrong business name, domain, phone number, email, logo, or color carried over from Safe House, HCJ Pool Services, Pest Heroes, My Driven Threads, MindPilot Pro, Poker Logic Lab, or Brightside Report.  
- Troy does not use the command line. Anything he has to run goes into a `.bat` file in the project folder with a plain-English name, and he is told which file to double-click.  
- One change at a time when Troy is in the loop. Do not stack several actions or several questions into one message to him.

---

## Section 1: Code structure (the "one big file" question)

### Explanation first

A SaaS app should never be one giant file or one giant function. The reason is not style, it is debugging and change cost. When a feature breaks, you want to be able to say "the problem is in the billing module" and open one folder, not scroll through 4,000 lines looking for the piece that matters. When you change one feature, you want confidence you did not silently break another. Small, separated pieces give you both.

The principle is **one responsibility per piece**. A file does one job. A function does one job. A folder holds one feature. Shared things (database client, auth helper, email sender) live in one shared place and everything else imports them, so a fix happens once and applies everywhere.

The practical test: if Troy says "the invoice email has the wrong date," the agent should be able to name the single file where that is fixed within a minute.

### Checks

- Is the project organized by feature or domain (for example `features/billing`, `features/inspections`, `features/auth`), with each folder containing its own routes, logic, and database access?  
- Is each file under roughly 300 lines, and is each function under roughly 50 lines? Anything larger has been split or has a written justification.  
- Is there exactly one place for each shared concern: one database client, one auth helper, one email sender, one payment client, one logger, one config loader? Nothing duplicated across features.  
- Is business logic separated from the user interface? A page or component should call a function; it should not contain pricing rules, permission rules, or database queries inline.  
- Is business logic separated from the database layer? Queries live in a data access layer or repository, so a change in the database shape does not ripple through every feature.  
- Are there no copy-pasted blocks? If the same 10 lines appear in two places, they have been made into one function.  
- Are names descriptive and consistent (`createInvoice`, not `doThing2`; `customer_id` used everywhere, never `customerId` in one table and `cust_id` in another)?  
- Is the code typed (TypeScript strict mode, or Python type hints with a checker), and does the type check pass with zero errors?  
- Is there a linter and formatter configured, and does the code pass both with zero warnings?  
- Are there no dead files, commented-out blocks, or "old version" folders left in the repo?  
- Is every "magic value" (a price, a limit, a timeout, a plan name) defined once as a named constant or config value, never scattered as raw numbers?  
- Can a new developer or agent find the entry point, the routes list, and the database schema within five minutes from the README?

---

## Section 2: Project setup and repository hygiene

- Is the project in git with a remote (GitHub), and is every change committed with a message that says what changed and why?  
- Is there a README that covers: what the app is, the stack, how to run it locally, how to deploy, and where the environment variables come from?  
- Is there a `.env.example` listing every environment variable the app needs, with a comment for each? Is `.env` itself in `.gitignore` and confirmed never committed (check git history, not just the current tree)?  
- Are dependencies locked (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`) and committed?  
- Are dependency versions pinned or ranged sensibly, and is there a documented process for updating them (not "always latest")?  
- Is there a `docs/` folder holding: architecture overview, database schema, decision log, known issues, and runbook (see Section 16)?  
- Are the `.bat` files Troy uses present, named plainly (`1-Start-App.bat`, `2-Run-Tests.bat`, `3-Deploy.bat`), and tested to work by double-click?  
- Are there no secrets, customer data, or exported production tables sitting in the repo?  
- Is the main branch protected, with feature work done on branches and merged, so a bad change can be reverted cleanly?  
- Is there a CHANGELOG or release notes file that Troy can read to know what changed between versions?

---

## Section 3: Architecture and data model

### Explanation first

The database schema is the hardest thing to change later. A wrong column type or a missing tenant column costs an hour today and a week in a year when there is real data in it. Spend the time here.

### Checks

- Is there a written schema document (or a generated diagram) showing every table, its columns, and how tables relate?  
- Does every table have: a primary key (UUID preferred over auto-increment integers so IDs cannot be guessed), `created_at`, `updated_at`?  
- Does every table that holds customer data carry a `tenant_id` or `organization_id` (or `user_id` for single-user apps), and is it not nullable?  
- Are database changes done only through migration files that are committed to git and applied in order? Never by hand-editing the live database.  
- Has every migration been tested against a copy of production data, not just an empty database?  
- Are indexes present on every column used in a `WHERE`, `JOIN`, or `ORDER BY` in a hot path, especially `tenant_id` and foreign keys?  
- Is soft delete used where records matter (a `deleted_at` column) so a mistaken delete is recoverable?  
- Are money amounts stored as integers in the smallest unit (cents) or as a decimal type, never as floating point?  
- Are dates stored in UTC and converted to the user's timezone only for display?  
- Are enumerated values (statuses, plan names, roles) constrained in the database, not just in application code?  
- Is anything that takes more than about two seconds (sending email, generating a PDF, calling an AI model, syncing an external system) run as a background job with retries, not inside a web request?  
- Are external side effects (charging a card, sending an email, creating a record in a third-party system) idempotent, so that a retry cannot double-charge or double-send? Is there an idempotency key?  
- Are uploaded files stored in object storage (Supabase Storage, S3, R2), never on the app server's disk, with access controlled per tenant?  
- Is there a clear boundary between the frontend, the API, and the database, so any one can be replaced without rewriting the others?  
- Are long lists paginated on the server? No endpoint returns an unbounded list.  
- Has the agent looked for N+1 query patterns (a loop that runs one query per row) and fixed them with joins or batched queries?  
- If Supabase is used: are Row Level Security policies enabled and written for every table, and has the agent run the Supabase security advisor and resolved every finding?

---

## Section 4: Authentication and authorization

- What handles login (Supabase Auth, Clerk, NextAuth, Auth0)? Custom-built auth is a **No** unless there is a written reason.  
- Are passwords hashed by the auth provider (bcrypt or argon2)? The app never stores or logs a plain password.  
- Do sessions expire, and do refresh tokens rotate?  
- Is every protected route enforced on the server, not only hidden in the frontend? Test: call the API directly without a session and confirm a 401\.  
- Are roles defined (at minimum: owner, admin, member, and a platform super-admin for Troy), and is there a single permission-check function used everywhere?  
- Can a user change their own role or `tenant_id` by editing a request? Test it and record the result.  
- Is there rate limiting and lockout on login, signup, password reset, and any endpoint that sends email or SMS?  
- Do password reset and email verification flows work end to end, tested with a real inbox?  
- Is there a way to invite team members to an organization, and to remove them (revoking access immediately)?  
- Is there an admin impersonation or "view as customer" feature for support, and is every use of it logged?  
- Are API keys for customers (if offered) hashed at rest, scoped, revocable, and shown only once at creation?

---

## Section 5: Payments and billing

- Which processor (Stripe preferred), and is all pricing defined in the processor's dashboard as products and prices, not hard-coded in the app?  
- Is the webhook endpoint verifying the signature with the signing secret? Show the line of code.  
- Does the webhook handler process at minimum: subscription created, updated, deleted; invoice paid; invoice payment failed; checkout completed?  
- Are webhook events stored and marked processed, so a duplicate delivery does not run twice?  
- Is access to paid features decided on the server from the stored subscription status, never from a flag in the browser?  
- What happens when a payment fails? Is there a grace period, a dunning email sequence, and a downgrade or lock at the end?  
- Can a customer upgrade, downgrade, cancel, update their card, and download invoices without emailing Troy? (Stripe Customer Portal counts.)  
- If there is a free trial, is it enforced server-side with a clear end date and a reminder email before it ends?  
- Is sales tax handled (Stripe Tax or equivalent) or is there a written decision that it is deferred and why?  
- Has the entire flow been run in test mode end to end: sign up, start trial, add card, get charged, fail a payment (use Stripe's test cards), cancel, and confirm the app state matches at every step? Attach the evidence.  
- Are refunds and proration behavior decided and documented?  
- Are live keys only in production environment variables, and test keys everywhere else? Confirm no live key exists in any non-production environment.

---

## Section 6: Security

- Are all secrets in environment variables or a secret manager, never in code, config files, or the frontend bundle?  
- Has the repo (full history) been scanned for committed secrets with a tool like gitleaks or trufflehog? Attach the output.  
- Is every user input validated on the server with a schema (zod, pydantic, or equivalent) before it touches the database or an external service?  
- Are all database queries parameterized or through an ORM? No string concatenation into SQL.  
- Is output escaped so user-supplied text cannot inject scripts (XSS)?  
- Is HTTPS enforced with HTTP redirected, and are security headers set (HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options)?  
- Is CORS restricted to the app's own domains? Never `*` in production.  
- Are file uploads restricted by type and size, scanned or at least never executed, and served from a separate origin?  
- Are admin routes protected by a server-side role check, and are they excluded from search engine indexing?  
- Is there rate limiting on every public endpoint, not just login?  
- Are dependencies audited (`npm audit`, `pip-audit`, Dependabot, Snyk) with no high or critical findings open?  
- Are error messages to users generic (no stack traces, no database column names, no "user does not exist" versus "wrong password" distinction)?  
- Are all internal service calls authenticated (cron endpoints, webhook receivers, background workers)? A cron endpoint that anyone can hit is a common miss.  
- Has the OWASP Top 10 been walked through explicitly, with a note against each item?  
- Is there a written incident response note: who gets told, how keys are rotated, how users are notified?

---

## Section 7: Multi-tenancy and data isolation

- Is this multi-tenant? If yes, which isolation method: row-level (tenant column plus RLS), schema per tenant, or database per tenant? Row-level with RLS is the default for Troy's scale.  
- Does every query, without exception, filter by tenant? Is this enforced at the database layer (RLS) and not only in application code?  
- Has a cross-tenant test been run: log in as tenant A, attempt to read, update, and delete tenant B's records by guessing IDs through the API. Attach the results for every resource type.  
- Do background jobs, exports, reports, and emails all respect tenant boundaries?  
- Do search and autocomplete endpoints leak other tenants' data?  
- Is there a super-admin path for Troy to see across tenants, and is it separate from customer roles and logged?  
- Can a tenant export all their data, and can a tenant be fully deleted (with all child records) on request?

---

## Section 8: Testing and quality gates

### Explanation first

Tests are how an agent proves it did not break something. Without them, "I fixed the bug" is an opinion. With them, it is a fact. The agent should write the test that reproduces a bug before fixing it, so the fix is proven and the bug cannot return unnoticed.

### Checks

- Is there a test runner configured, and does `2-Run-Tests.bat` run the full suite and show a pass or fail count?  
- Are the critical paths covered by automated tests: signup, login, the core feature that customers pay for, checkout, webhook handling, permission checks, tenant isolation?  
- Is there at least one end-to-end test (Playwright or similar) that drives the real UI through signup to the core feature?  
- Do tests run automatically on every push (GitHub Actions or similar), and does a failing test block deployment?  
- When a bug is fixed, was a test added that fails before the fix and passes after?  
- Are tests deterministic (no reliance on current date, network, or random data without seeding)?  
- Is there a seed script that fills a local or staging database with realistic sample data across at least two tenants?  
- Does the type check, lint, and test suite all pass with zero errors before any "done" claim? Attach the output.  
- Has the agent tested the empty states (new account with no data), the error states (network down, payment declined), and the edge cases (very long names, special characters, zero and negative numbers, timezone boundaries)?  
- Has someone other than the author, or a fresh agent session with no memory of the build, tried to use the feature from the customer's point of view and reported what was confusing?

---

## Section 9: Observability and debugging (narrowing down feature issues)

### Explanation first

When something breaks in production, the question is always "what happened, to whom, when, and where in the code." The app must be built so those four answers are one search away. That means every request gets an ID, every log line carries that ID plus the tenant and user, and every error goes to a tracker that groups them and alerts. Without this, debugging is guesswork and the agent will "fix" things by changing code until the symptom disappears.

### Checks

- Is there an error tracking service (Sentry or equivalent) wired into both the frontend and the backend, with source maps uploaded so stack traces point to real code?  
- Does every log line include: timestamp, level, request ID, tenant ID, user ID, and the feature or module name? Structured (JSON) logs, not free text.  
- Is there a request ID generated at the edge and passed through every layer, including background jobs and outbound API calls?  
- Are logs shipped somewhere searchable and retained (Vercel logs, Supabase logs, Axiom, Logtail, Better Stack), not only printed to a console that disappears?  
- Is there a `/health` endpoint that checks the database and critical dependencies, and an uptime monitor pinging it with alerts to Troy's phone or email?  
- Are unhandled exceptions and unhandled promise rejections caught globally, logged, and reported, with the user shown a friendly error page that includes the request ID so they can quote it to support?  
- Is there performance monitoring for slow requests and slow queries, with a defined threshold (for example, alert if p95 exceeds 2 seconds)?  
- Are feature flags available so a new feature can be turned off for everyone, or on for one tenant, without a deploy?  
- Is there a written debugging runbook: how to find a user's recent requests, how to find all errors for a tenant, how to replay a webhook, how to check background job status?  
- Are alerts tuned so Troy is told about real problems (site down, payment webhook failing, error rate spike) and not flooded with noise?  
- Are business events logged (signup, trial start, conversion, cancellation, core feature used) so product questions can be answered from data?  
- Is there a status page or at least a plan for how customers are told about an outage?

---

## Section 10: Deployment, environments, and releases

- Are there at least three environments: local, staging (or preview), and production, each with its own database and its own keys?  
- Does every branch or pull request get a preview deployment that Troy can click and test before it merges?  
- Are environment variables managed in the hosting platform, documented in `.env.example`, and validated at startup so a missing one fails loudly rather than silently?  
- Is the deploy process one action (a merge, a button, or `3-Deploy.bat`) and documented?  
- Is rollback one action, tested at least once, and documented?  
- Are database migrations run automatically as part of deploy, in the right order, and are they backwards-compatible so a rollback of the code does not break against the new schema?  
- Is there a post-deploy smoke test (automated or a five-item checklist) run every time?  
- Is a deploy never done on a Friday afternoon or right before Troy is unavailable, unless it is an emergency fix?  
- Are custom domains, DNS, and SSL certificates configured and auto-renewing, and is the domain registered under Troy's account, not a developer's or agent's?  
- Is every third-party account (hosting, database, payments, email, error tracking, domain) owned by Troy's email, with two-factor authentication on, and are the credentials recorded in his password manager?

---

## Section 11: Reliability, backups, and recovery

- Are database backups automated, and how often? Point-in-time recovery enabled if the provider offers it?  
- Has a restore been tested at least once, into a separate environment, with the time it took recorded? An untested backup is not a backup.  
- Are uploaded files backed up separately from the database?  
- What happens if the hosting platform has an outage? Is there at least a written plan, even if the answer is "wait, and here is how we tell customers"?  
- Are background jobs durable (a queue that survives a restart) with retries, backoff, and a dead-letter list Troy can see?  
- Is there a defined data retention policy: how long logs, backups, and deleted-account data are kept?  
- Are timeouts set on every outbound call so one slow vendor cannot hang the whole app?  
- Is there graceful degradation: if the AI provider, email provider, or a non-critical integration is down, does the core product still work with a clear message?  
- Is there a documented recovery-time target (how long an outage is acceptable) and recovery-point target (how much data loss is acceptable), and does the backup setup actually meet them?

---

## Section 12: Performance and cost

- What does the app cost per month to run right now, itemized by service? What will it cost at 10x users? Has the agent read the pricing page of every service and identified the tier where price jumps?  
- What is the cost per paying customer per month, and what is the gross margin at the planned price?  
- Are AI model calls metered per tenant with a cap or alert, so one customer cannot run up a large bill? Is the model and prompt chosen for cost, with caching where the platform supports it?  
- Are expensive operations cached (computed reports, dashboard summaries, external API results) with a defined expiry?  
- Are images optimized, static assets served from a CDN, and the frontend bundle size checked?  
- Have the slowest 10 database queries been identified and reviewed for indexes?  
- Is there a load test or at least a reasoned estimate of concurrent users the current setup handles?  
- Is there a monthly cost review item in the runbook, with alerts set on every provider's billing?  
- Are free-tier limits documented, with a note on what breaks when each is exceeded (a common surprise: the database pauses, emails stop sending, or the function count is capped)?

---

## Section 13: Third-party platforms and the "when the platform breaks" playbook

### Explanation first

Every SaaS depends on other companies' platforms: hosting, database, auth, payments, email, AI models. Each will at some point go down, change its pricing, deprecate a feature, change an API, or suspend an account. The build must assume this. The defense is isolation (talk to each vendor through one small wrapper of your own so swapping it is one file, not fifty), monitoring (know before customers tell you), and a written exit plan.

### Checks

- Is there a single wrapper module for each vendor (`lib/payments.ts`, `lib/email.ts`, `lib/ai.ts`, `lib/storage.ts`) so no feature code calls a vendor SDK directly?  
- Is every vendor's API version pinned explicitly, and is there a note on how to find their changelog and deprecation notices?  
- Are vendor status pages bookmarked in the runbook, and are their status alerts subscribed to Troy's email?  
- Does every outbound call have: a timeout, retry with backoff for transient errors, no retry for permanent errors, and a log line on failure with the request ID?  
- Are vendor rate limits documented, and does the app back off before hitting them rather than failing on the limit?  
- Is there a written exit plan per vendor: what data is stored there, how to export it, what the nearest alternative is, and how long a migration would take?  
- Is the app free of undocumented "magic" features of a platform that would not exist elsewhere, unless the dependency is a deliberate written decision?  
- When a platform error occurs, does the agent follow this order and record each step: (1) confirm it is the platform and not our code by checking the status page and the exact error; (2) check whether our version or configuration changed; (3) check the vendor's changelog for a breaking change; (4) reproduce in staging; (5) apply the smallest fix; (6) add a test or monitor so it is caught next time?  
- Is the agent forbidden from "fixing" a platform issue by disabling security features (turning off RLS, opening CORS, removing signature verification, catching and ignoring errors)? Any such change requires a written justification and Troy's approval.  
- Is there a monthly dependency and platform review: update packages, read vendor changelogs, check for deprecation notices, confirm billing?

---

## Section 14: Compliance, legal, and data lifecycle

- Are Terms of Service and a Privacy Policy published, linked in the footer and signup, with the operating entity named correctly (TNP Digital Ventures LLC) and the contact address correct?  
- Is there a record of what personal data is collected, where it is stored, which vendors see it, and why?  
- Can a user delete their account and all associated data, and does it actually delete (or anonymize) across every table, file store, and vendor (Stripe customer, email list, error tracker)?  
- Can a user export their data?  
- If any users could be in the EU or California, are the GDPR and CCPA basics handled: consent for non-essential cookies, a data processing note, a way to request data?  
- Is any regulated data involved (health, financial account data, children's data)? If yes, has this been flagged to Troy explicitly, because it changes the requirements substantially?  
- Are transactional emails compliant (real sender address, physical address in marketing emails, unsubscribe on marketing emails, none on transactional)?  
- Are third-party licenses compatible with commercial use (no GPL surprises in a closed product)?  
- Are cookie and analytics tools configured to respect consent where required?  
- Is there a data breach response note: who to notify, within what time, using what template?

---

## Section 15: Product, onboarding, and support

- What does a brand-new user see in the first 60 seconds, and does it lead them to the one action that shows the product's value?  
- Are empty states designed (a new account with no data shows guidance, not a blank table)?  
- Are the transactional emails set up and tested with a real inbox: welcome, verify email, password reset, receipt, trial ending, payment failed, invite?  
- Is there an in-app help entry point (link to docs, contact form, or chat) and does it reach Troy or the right inbox?  
- Is there a basic help page or FAQ covering the top five questions a new user would have?  
- Is Troy notified (email, Telegram, or dashboard) on: new signup, trial converted, payment failed, cancellation, and error spike?  
- Is there an admin dashboard where Troy can see users, tenants, subscription status, and recent activity without opening the database?  
- Is there a way to collect feedback and feature requests inside the app?  
- Does the app work on a phone browser for the core flows?  
- Is the product usable by someone who has never seen it, tested by a fresh session or person with no prior context?  
- Is there a changelog or "what's new" visible to customers?

---

## Section 16: Documentation and handoff

Every project keeps these files in `docs/`, kept current by the agent as part of every milestone:

- `ARCHITECTURE.md`: the stack, how requests flow, the main modules, and the reasons for the big choices.  
- `SCHEMA.md`: every table and relationship, regenerated when migrations change.  
- `DECISIONS.md`: a dated log of decisions and why (why Stripe, why row-level tenancy, why this AI model). Future agents read this before proposing to redo something.  
- `RUNBOOK.md`: how to deploy, roll back, restore a backup, find a user's errors, replay a webhook, rotate a key, handle the top five failure scenarios.  
- `KNOWN-ISSUES.md`: open bugs, workarounds, and technical debt, each with a severity and a date.  
- `COSTS.md`: every paid service, the tier, the monthly cost, and the point at which the tier changes.  
- `ACCOUNTS.md`: every third-party account by name and owner email (never the passwords; those go in the password manager).

Checks:

- Are all seven files present and updated in the same commit as the change they describe?  
- Could a brand-new agent session, given only the repo and `docs/`, deploy the app, fix a bug, and restore a backup without asking Troy anything?

---

## Section 17: What to anticipate (future-proofing ladder)

### Explanation first

An optimized SaaS is not one that anticipates everything. It is one where the expensive-to-change decisions (schema, tenancy, auth, vendor wrappers, module boundaries) are made carefully now, and everything else is kept simple until real usage demands more. Over-building is as costly as under-building. The ladder below says what to have in place at each stage and what to deliberately postpone.

### Stage 1: Before the first paying customer

- Everything in Sections 1 through 7, 10, 11, 14 at a passing level. No exceptions on security, tenancy, backups, billing correctness, and legal pages.  
- Error tracking, uptime monitoring, and structured logs from day one, because bugs found with ten customers are cheaper than bugs found with a thousand.  
- Postpone: load testing, multi-region, custom reporting, public API, enterprise SSO, white-labeling.

### Stage 2: First 10 to 100 paying customers

- Onboarding tuned from real user sessions; the top three support questions turned into in-app guidance.  
- Feature flags in use, so features can be trialed with a few tenants.  
- Cost per customer measured monthly against price.  
- Team roles and invitations working, because customers will ask to add a coworker.  
- Postpone: rearchitecting for scale until a measured bottleneck exists.

### Stage 3: 100 to 1,000 customers

- Read replicas or caching for dashboards, background job queue with visibility, rate limits per plan.  
- Audit log per tenant (who did what, when), which larger customers ask for.  
- SOC 2 style hygiene started (access reviews, logging, vendor list) even if certification is not pursued.  
- Public API and webhooks for customers if the product benefits from integrations.  
- Data export and import tooling, because customers migrating in and out will become routine.

### Stage 4: Beyond 1,000 customers or an enterprise deal

- Single sign-on (SAML or OIDC), per-tenant data residency questions, custom contracts, dedicated support process.  
- Formal on-call rotation or managed monitoring service.  
- Consider whether to sell, and keep the codebase and docs in a state where technical due diligence (this checklist, essentially) passes.

### Things that always come earlier than expected

- A customer asks for a team member seat (build roles and invitations early).  
- A customer asks to export everything (build export early, it is also the backup of last resort).  
- A vendor changes pricing or deprecates an API (the wrapper module pays for itself here).  
- AI model costs climb with usage (meter per tenant from day one).  
- Someone attempts to access another tenant's data by changing an ID in the URL (RLS from day one).  
- A refund or double-charge dispute (idempotent billing and webhook logs from day one).

---

## Section 18: Milestone Gate Report (the format Hermes returns)

Return this report at every milestone. Do not summarize or skip sections. Every item is answered.

```
MILESTONE GATE REPORT
Project:
Milestone:
Date:
Commit hash:

OVERALL: READY / CONDITIONAL / NOT READY

BLOCKERS (must fix before this milestone is accepted)
- Item, section number, what is wrong, proposed fix, estimated effort

SECTION RESULTS
For each section 1 through 17:
  Section N: <name>
  Passed: X of Y items
  Failed items: list each with reason
  Not applicable: list each with reason
  Could not verify: list each with what is needed to verify

PROOF ATTACHED
- Test run output (file path or pasted)
- Type check and lint output
- Security scan output
- Cross-tenant test results
- Billing test-mode walkthrough evidence
- Screenshot or log of health check and monitor
- Backup restore evidence (or date last tested)

CROSS-BUSINESS CONTAMINATION CHECK
- Business name, domain, phone, email, logo, colors: confirmed correct for <this business>, searched the codebase for the other six business names and found: <none / list>

CHANGES SINCE LAST GATE
- Bullet list, each pointing to a commit

OPEN QUESTIONS FOR TROY
- One question at a time, most important first, with the default the agent will take if no answer
```

---

## Section 19: Short glossary for Troy

- **RLS (Row Level Security)**: a database rule that says "a user can only see rows where tenant\_id matches theirs," enforced by the database itself so application bugs cannot leak data.  
- **Migration**: a file that describes one change to the database structure, applied in order, so every environment ends up identical.  
- **Webhook**: a message a vendor (Stripe) sends to your app when something happens (a payment succeeded). Must be signature-verified so a stranger cannot fake one.  
- **Idempotent**: safe to run twice with the same result. A charge with an idempotency key cannot double-bill on a retry.  
- **Staging**: a copy of production, with its own database and test keys, where changes are tried before real customers see them.  
- **Feature flag**: a switch that turns a feature on or off per tenant without a deploy.  
- **Request ID**: a unique tag on every request that appears in every log line it touches, so one search shows the whole story of what happened.  
- **p95**: the response time that 95 percent of requests beat. A better health number than the average, which hides slow outliers.  
- **Dunning**: the sequence of retries and emails after a failed payment before access is cut off.  
- **Dead-letter queue**: where background jobs go after all retries fail, so they are not silently lost.  
- **OWASP Top 10**: the standard list of the ten most common web security mistakes.  
- **N+1 query**: a loop that runs one database query per row instead of one query for all rows. Fine at 10 rows, a disaster at 10,000.

