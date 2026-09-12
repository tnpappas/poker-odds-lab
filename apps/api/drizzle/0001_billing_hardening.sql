-- 0001: billing hardening (Sept 12, 2026)
-- Applied by hand in the Neon SQL editor before deploying the code that uses it.
-- Every statement is idempotent so re-running is safe.

-- Plan becomes a real enum. 'lifetime' stays for accounts from the one-time era.
DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('free', 'pro', 'lifetime');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE users ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE users ALTER COLUMN plan TYPE plan USING plan::plan;
ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'free';

-- updated_at where rows change after insert.
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE adversary_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Indexes on every user_id and the list-ordering columns.
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_paypal_subscription_idx ON users (paypal_subscription_id);
CREATE INDEX IF NOT EXISTS sessions_user_started_idx ON sessions (user_id, started_at);
CREATE INDEX IF NOT EXISTS hand_decisions_user_created_idx ON hand_decisions (user_id, created_at);
CREATE INDEX IF NOT EXISTS hand_decisions_session_idx ON hand_decisions (session_id);
CREATE INDEX IF NOT EXISTS adversary_profiles_user_idx ON adversary_profiles (user_id);
CREATE INDEX IF NOT EXISTS user_leaks_user_idx ON user_leaks (user_id);

-- Webhook deliveries we have acted on, so a redelivery is a no-op.
CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  provider text NOT NULL,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- polar_customer_id is no longer read or written by the application. The
-- column is left in place (nullable, unused); drop it in a later migration
-- once a backup restore has been rehearsed. See docs/KNOWN-ISSUES.md.
