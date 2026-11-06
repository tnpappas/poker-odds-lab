-- 0004: Live Read Challenge prizes (Oct 2026)
-- One row per prize per entrant. Written when the challenge ends; a ranked
-- prize is applied to the winner's account the first time they sign in with
-- the email they entered with. Idempotent.
--
-- The API also runs this same statement on first use (storage/drizzle.ts,
-- ensurePrizeTable), so pasting it into Neon is optional. It is kept here so
-- the migration history stays complete.
CREATE TABLE IF NOT EXISTS challenge_prizes (
  challenge_id text NOT NULL,
  email text NOT NULL,
  kind text NOT NULL,
  rank integer NOT NULL,
  handle text NOT NULL,
  notified_at timestamptz,
  granted_at timestamptz,
  granted_user_id uuid,
  access_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_prizes_pk PRIMARY KEY (challenge_id, email)
);
