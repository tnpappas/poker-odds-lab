# Database migrations

One SQL file per change, numbered, committed with the code that needs it.
Each file is idempotent (IF NOT EXISTS, DO $$ ... EXCEPTION) so it can be
re-run safely.

To apply: open the Neon console, project poker-logic-lab, branch production,
SQL Editor, paste the file, Run. Apply the migration BEFORE pushing code that
depends on it: new columns are additive, so old code keeps working against the
new schema, but new code fails against the old one.

`npm run db:generate --workspace=apps/api` (with DATABASE_URL set) will also
produce a diff from schema.ts if you prefer drizzle-kit to write the SQL.
