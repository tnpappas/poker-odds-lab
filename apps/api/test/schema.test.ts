import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { users, webhookEvents, sessions } from '../src/db/schema';

/**
 * The in-memory store used by the other tests never touches Postgres, so a
 * column named differently in schema.ts and in the SQL migration only fails in
 * production (Sept 12 2026: webhook_events.received_at vs created_at made every
 * webhook 500). Pin the physical column names that migrations created.
 */
const columnNames = (t: Parameters<typeof getTableColumns>[0]) =>
  Object.values(getTableColumns(t)).map((c) => c.name);

describe('schema column names match the migrations', () => {
  it('webhook_events', () => {
    expect(columnNames(webhookEvents)).toEqual(['id', 'provider', 'event_type', 'received_at']);
  });
  it('users has the billing columns', () => {
    const names = columnNames(users);
    expect(names).toContain('paypal_subscription_id');
    expect(names).toContain('updated_at');
    expect(names).toContain('clerk_id');
  });
  it('sessions has updated_at', () => {
    expect(columnNames(sessions)).toContain('updated_at');
  });
});
