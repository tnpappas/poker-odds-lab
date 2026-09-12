# Database schema

Neon Postgres, managed through Drizzle (`apps/api/src/db/schema.ts`). Regenerate this file whenever a migration changes the shape. Last updated: September 12, 2026 (migration 0001).

All ids are UUIDs (`gen_random_uuid()`), all timestamps are `timestamptz` in UTC. Every table holding customer data has `user_id` (not null) referencing `users.id` with `ON DELETE CASCADE`, so deleting a user removes everything they own in one statement.

## users

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| clerk_id | text, unique, not null | Clerk user id; the join key to the identity provider |
| email | text, not null | kept fresh by the Clerk webhook; indexed (`users_email_idx`) |
| username | text | |
| plan | enum `plan` ('free', 'pro', 'lifetime'), default 'free' | server-side entitlement; 'lifetime' only for accounts from the one-time-purchase era |
| paypal_subscription_id | text | active PayPal subscription (I-...); set on activation, cleared on cancel; indexed |
| pro_until | timestamptz | paid-through date (PayPal next billing time); set on activation and every renewal. After a cancel the subscription id is cleared and Pro stays on until this passes |
| polar_customer_id | text | unused since Sept 2026; left in place until the drop is rehearsed against a backup |
| created_at | timestamptz, not null | |
| updated_at | timestamptz, not null | set by the application on every update |

## sessions

One row per training session (a Hand Replay run, a Blitz round, and so on).

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users, not null | |
| mode | text, not null | 'hand_replay', 'blitz', 'adversary_lab', 'equity_viz' |
| hands_played, decisions_correct, decisions_total | integer, default 0 | |
| total_ev_won, total_ev_lost | double precision, default 0 | |
| started_at | timestamptz, not null | |
| ended_at | timestamptz | null while the session is open |
| updated_at | timestamptz, not null | |

Index: `sessions_user_started_idx (user_id, started_at)`.

## hand_decisions

One row per decision the player made.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| session_id | uuid FK sessions (cascade) | nullable |
| user_id | uuid FK users, not null | |
| street | text | preflop, flop, turn, river |
| decision_type | text | pot_odds, ev_call, range_read, blitz |
| user_action, correct_action | text | call, fold, raise |
| user_equity_estimate, actual_equity, ev_result, pot_size, bet_size | double precision | nullable |
| created_at | timestamptz, not null | |

Indexes: `hand_decisions_user_created_idx (user_id, created_at)`, `hand_decisions_session_idx (session_id)`.

## adversary_profiles

Saved opponent models from the Adversary Lab.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users, not null | indexed |
| name | text, not null | |
| vpip, pfr, cbet_flop, cbet_turn, fold_to_3bet, af, wtsd | double precision with defaults | the six reads plus aggression factor |
| notes | text | |
| created_at, updated_at | timestamptz, not null | |

## user_leaks

Server-side leak detection results (recomputed on `POST /api/leaks/recalculate`).

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users, not null | indexed |
| leak_type | text | |
| severity | double precision | |
| sample_size | integer | |
| last_calculated | timestamptz | |

## daily_usage

Free-tier counters per user per day.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users, not null | |
| date | date, not null | unique with user_id |
| replays_used, blitz_used | integer, default 0 | |

## webhook_events

Every webhook delivery the API has acted on. Inserting the id before processing makes a redelivered event a no-op.

| column | type | notes |
|---|---|---|
| id | text PK | `${provider}:${eventId}` (PayPal event id or Clerk svix-id) |
| provider | text | 'paypal' or 'clerk' |
| event_type | text | |
| received_at | timestamptz | |

## Personal data inventory

What we hold about a person and why. Nothing else is collected.

| Data | Table.column | Why | Source |
|---|---|---|---|
| Email address | users.email | account identity, support, receipts are sent by PayPal not us | Clerk sign-up |
| Username (optional) | users.username | display | Clerk profile |
| Clerk user id | users.clerk_id | link to the auth provider | Clerk |
| PayPal subscription id | users.paypal_subscription_id | cancel and entitlement checks; not a payment method | PayPal |
| Training activity | sessions, hand_decisions, user_leaks, daily_usage | the product itself: progress, mistakes, daily free-tier limits | the app |
| Saved opponents and notes | adversary_profiles (including free-text notes) | Adversary Lab | the user |

Not stored: names, addresses, card or bank details (PayPal holds them), IP addresses (Railway and Vercel access logs only, on their retention), analytics identifiers (Meta Pixel only after consent, in the visitor's browser).

## Relationships

users 1..n sessions, hand_decisions, adversary_profiles, user_leaks, daily_usage. sessions 1..n hand_decisions (optional). webhook_events stands alone.

## Migrations

Numbered SQL files in `apps/api/drizzle/`. Applied by hand in the Neon SQL editor before the dependent code is pushed (see RUNBOOK.md). History:

- (initial) tables users, sessions, hand_decisions, adversary_profiles, user_leaks, daily_usage via `drizzle-kit push`, July 2026
- `paypal_subscription_id` column, Sept 12 2026 (ad hoc ALTER, recorded in 0001's comment)
- `0001_billing_hardening.sql`, Sept 12 2026: plan enum, updated_at columns, indexes, webhook_events
- `0002_paid_through.sql`, Sept 12 2026: users.pro_until
