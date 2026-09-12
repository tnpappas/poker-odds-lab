-- 0002: paid-through date (Sept 12, 2026)
-- A cancelled subscriber keeps Pro until the period they paid for ends.
-- Idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_until timestamptz;
