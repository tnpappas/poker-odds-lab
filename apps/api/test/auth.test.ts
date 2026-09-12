import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, asUser, json } from './helpers';

let base: string;
let close: () => Promise<void>;

beforeAll(async () => ({ base, close } = await startServer()));
afterAll(() => close());

describe('auth and entitlement', () => {
  it('health reports the configured backends', async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.ok).toBe(true);
    expect(body.storage).toBe('memory');
    expect(body.payments).toBe('disabled');
  });

  it('a new user starts on the free plan and is not entitled', async () => {
    const res = await asUser(base, 'user-a', 'a@example.com').get('/api/me');
    expect(res.status).toBe(200);
    const me = await json(res);
    expect(me.plan).toBe('free');
    expect(me.entitled).toBe(false);
    expect(me.owner).toBe(false);
    expect(me.hasSubscription).toBe(false);
  });

  it('an owner email is entitled without paying', async () => {
    const me = await json(asUser(base, 'owner', 'owner@example.com').get('/api/me'));
    expect(me.owner).toBe(true);
    expect(me.entitled).toBe(true);
  });

  it('non-owners cannot use admin grant', async () => {
    const res = await asUser(base, 'user-a', 'a@example.com').post('/api/admin/grant', { email: 'a@example.com' });
    expect(res.status).toBe(403);
  });

  it('owner grant unlocks another account by email', async () => {
    const owner = asUser(base, 'owner', 'owner@example.com');
    const res = await owner.post('/api/admin/grant', { email: 'a@example.com', plan: 'pro' });
    expect(res.status).toBe(200);
    const me = await json(asUser(base, 'user-a', 'a@example.com').get('/api/me'));
    expect(me.plan).toBe('pro');
    expect(me.entitled).toBe(true);
  });

  it('rejects malformed bodies with 400, not 500', async () => {
    const res = await asUser(base, 'user-a').post('/api/decisions', { street: 'nope' });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toBe('Validation failed');
  });

  it('every response carries a request id', async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});

describe('rate limiting', () => {
  it('billing routes are rate limited per IP (headers present)', async () => {
    const res = await asUser(base, 'rl', 'rl@example.com').get('/api/billing/portal');
    expect(res.headers.get('ratelimit')).toBeTruthy();
  });
});
