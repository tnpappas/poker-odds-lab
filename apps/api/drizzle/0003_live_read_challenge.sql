-- 0003: Live Read Challenge answers (Oct 2026)
-- One row per entrant per day. Entrants are identified by email (no account
-- needed). Idempotent.
CREATE TABLE IF NOT EXISTS challenge_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id text NOT NULL,
  day integer NOT NULL,
  email text NOT NULL,
  handle text NOT NULL,
  action text NOT NULL,
  equity_guess integer NOT NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_answers_one_per_day UNIQUE (challenge_id, day, email)
);
CREATE INDEX IF NOT EXISTS challenge_answers_challenge_idx ON challenge_answers (challenge_id);
