# Privacy Policy — Poker Odds Lab

_Last updated: [DATE]_

> **Draft template.** This reflects how the app is actually built (Clerk auth,
> Stripe payments, Neon Postgres, client-side engine). Fill in every `[BRACKETED]`
> placeholder and have a lawyer confirm it meets GDPR/CCPA and any other law that
> applies to your users before publishing.

## 1. Who we are

Poker Odds Lab ("the Service") is operated by [LEGAL ENTITY NAME] ("we", "us"),
[BUSINESS ADDRESS]. Data-protection contact: [PRIVACY EMAIL].

## 2. What we collect

**Account data (via Clerk):** your email address, username (if provided), and a
unique account identifier.

**Billing data (via Stripe):** we store a Stripe customer identifier and your
plan status. Card numbers are collected and stored by Stripe, **not by us**.

**Training data:** the sessions you play and the decisions you make — the street,
your action, the correct action, your equity estimates, EV results, pot/bet
sizes, adversary profiles you create, and derived "leak" statistics. This powers
your dashboard and personalized drills.

**Usage/technical data:** basic request logs and daily usage counters used to
enforce free-tier limits and keep the Service secure.

The core poker math runs **in your browser**; equity calculations are not sent to
our servers.

## 3. How we use it

To provide and personalize the Service (dashboards, leak detection, adversary
training), process payments, enforce plan limits, secure the platform, and
communicate service and transactional messages (e.g., receipts, password resets).

## 4. Legal bases (GDPR)

Where GDPR applies, we process data to perform our contract with you (providing
the Service and billing), for our legitimate interests (security, product
improvement), and with your consent where required.

## 5. Sharing

We share data only with the processors that run the Service:

- **Clerk** — authentication and account management.
- **Stripe** — payment processing.
- **Neon** — managed Postgres database hosting.
- **[HOSTING PROVIDER]** — application hosting.

We do **not** sell your personal information. [If you add analytics or ads
tooling, disclose it here and add a cookie-consent banner.]

## 6. Data retention

We keep your data while your account is active. When you delete your account we
remove your personal data and training records from our production database
(subject to short-term backups that expire on a rolling [N]-day cycle) and
limited records we must retain for legal or accounting purposes (e.g., payment
records).

## 7. Your rights

Depending on where you live (e.g., EU/UK under GDPR, California under CCPA/CPRA),
you may have the right to access, correct, delete, export, or restrict processing
of your personal data, and to object or withdraw consent.

- **Delete your account and data:** use the in-app "Delete account" action, which
  permanently removes your account and associated training data, or email
  [PRIVACY EMAIL].
- **Other requests:** contact [PRIVACY EMAIL]; we respond within the timeframe
  required by applicable law.

We do not discriminate against you for exercising these rights.

## 8. Cookies

We use strictly necessary cookies/local storage for authentication and to run the
app (including saving your progress locally). [If you add non-essential cookies,
add a consent banner and describe them here.]

## 9. Security

We use HTTPS, signed webhooks, scoped access controls, and reputable processors.
No system is perfectly secure, but we work to protect your data.

## 10. Children

The Service is not directed to anyone under 18, and we do not knowingly collect
data from children.

## 11. International transfers

Your data may be processed in [COUNTRY/REGION]. Where required, we rely on
appropriate safeguards (e.g., Standard Contractual Clauses) for transfers.

## 12. Changes

We may update this policy; material changes will be notified in-app or by email.

## 13. Contact

Privacy questions or requests: [PRIVACY EMAIL].
