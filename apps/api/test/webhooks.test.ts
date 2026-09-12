import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const paypalMock = vi.hoisted(() => ({ verifyWebhookSignature: vi.fn(async () => true), verifySubscription: vi.fn() }));
vi.mock('../src/lib/paypal', () => ({
  paypalConfigured: true,
  PAYPAL_AUTOPAY_URL: 'https://www.paypal.com/myaccount/autopay/',
  paypalPlanIdFor: () => 'P-X',
  cancelSubscription: vi.fn(),
  createSubscription: vi.fn(),
  ...paypalMock,
}));
vi.mock('../src/lib/ghl', () => ({ ghlConfigured: false, tagGhlCustomer: vi.fn(async () => undefined) }));

import { startServer, asUser, json } from './helpers';

let base: string;
let close: () => Promise<void>;
beforeAll(async () => ({ base, close } = await startServer()));
afterAll(() => close());

function paypalEvent(id: string, type: string, userId: string, subscriptionId: string, nextBillingTime?: string) {
  return fetch(`${base}/api/paypal/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      event_type: type,
      resource: {
        id: subscriptionId,
        custom_id: userId,
        billing_info: nextBillingTime ? { next_billing_time: nextBillingTime } : undefined,
      },
    }),
  });
}

const inAMonth = new Date(Date.now() + 30 * 86_400_000).toISOString();
const yesterday = new Date(Date.now() - 86_400_000).toISOString();

describe('PayPal webhook', () => {
  it('rejects a bad signature with 403 and changes nothing', async () => {
    const u = asUser(base, 'w0', 'w0@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    paypalMock.verifyWebhookSignature.mockResolvedValueOnce(false);
    const res = await paypalEvent('WH-bad', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-0');
    expect(res.status).toBe(403);
    expect((await json(u.get('/api/me'))).plan).toBe('free');
  });

  it('ACTIVATED grants pro; CANCELLED keeps it until the paid-through date', async () => {
    const u = asUser(base, 'w1', 'w1@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    expect((await paypalEvent('WH-1', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-1', inAMonth)).status).toBe(200);
    let me = await json(u.get('/api/me'));
    expect(me.plan).toBe('pro');
    expect(me.hasSubscription).toBe(true);
    expect(me.proUntil).toBe(inAMonth);

    expect((await paypalEvent('WH-2', 'BILLING.SUBSCRIPTION.CANCELLED', meId, 'I-1')).status).toBe(200);
    me = await json(u.get('/api/me'));
    expect(me.plan).toBe('pro');
    expect(me.entitled).toBe(true);
    expect(me.hasSubscription).toBe(false);
    expect(me.proUntil).toBe(inAMonth);
  });

  it('CANCELLED with no paid-through date on file revokes at once', async () => {
    const u = asUser(base, 'w1b', 'w1b@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    await paypalEvent('WH-1b', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-1b');
    await paypalEvent('WH-2b', 'BILLING.SUBSCRIPTION.CANCELLED', meId, 'I-1b');
    const me = await json(u.get('/api/me'));
    expect(me.plan).toBe('free');
    expect(me.hasSubscription).toBe(false);
  });

  it('a cancelled subscriber whose paid period has ended is moved to free on /me', async () => {
    const u = asUser(base, 'w1c', 'w1c@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    await paypalEvent('WH-1c', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-1c', yesterday);
    expect((await json(u.get('/api/me'))).plan).toBe('pro'); // still billing, so still pro
    await paypalEvent('WH-2c', 'BILLING.SUBSCRIPTION.CANCELLED', meId, 'I-1c');
    const me = await json(u.get('/api/me'));
    expect(me.plan).toBe('free');
    expect(me.entitled).toBe(false);
    expect(me.proUntil).toBeNull();
  });

  it('PAYMENT.SALE.COMPLETED moves the paid-through date forward', async () => {
    const u = asUser(base, 'w1d', 'w1d@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    await paypalEvent('WH-1d', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-1d', inAMonth);
    const inTwoMonths = new Date(Date.now() + 60 * 86_400_000).toISOString();
    paypalMock.verifySubscription.mockResolvedValueOnce({ subscriptionId: 'I-1d', userId: meId, active: true, status: 'ACTIVE', nextBillingTime: inTwoMonths });
    const res = await fetch(`${base}/api/paypal/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'WH-1e', event_type: 'PAYMENT.SALE.COMPLETED', resource: { id: 'SALE-1', billing_agreement_id: 'I-1d' } }),
    });
    expect(res.status).toBe(200);
    expect((await json(u.get('/api/me'))).proUntil).toBe(inTwoMonths);
  });

  it('SUSPENDED revokes and RE-ACTIVATED restores', async () => {
    const u = asUser(base, 'w2', 'w2@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    await paypalEvent('WH-3', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-2');
    await paypalEvent('WH-4', 'BILLING.SUBSCRIPTION.SUSPENDED', meId, 'I-2');
    expect((await json(u.get('/api/me'))).plan).toBe('free');
    await paypalEvent('WH-5', 'BILLING.SUBSCRIPTION.RE-ACTIVATED', meId, 'I-2');
    expect((await json(u.get('/api/me'))).plan).toBe('pro');
  });

  it('a redelivered event is ignored', async () => {
    const u = asUser(base, 'w3', 'w3@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    await paypalEvent('WH-6', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-3');
    await paypalEvent('WH-7', 'BILLING.SUBSCRIPTION.CANCELLED', meId, 'I-3');
    // PayPal redelivers the old ACTIVATED: must not re-grant.
    const res = await paypalEvent('WH-6', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-3');
    expect((await json(res)).duplicate).toBe(true);
    expect((await json(u.get('/api/me'))).plan).toBe('free');
  });

  it('a late CANCELLED for an old subscription does not revoke a newer one', async () => {
    const u = asUser(base, 'w4', 'w4@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    await paypalEvent('WH-8', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-OLD');
    await paypalEvent('WH-9', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-NEW');
    await paypalEvent('WH-10', 'BILLING.SUBSCRIPTION.CANCELLED', meId, 'I-OLD');
    const me = await json(u.get('/api/me'));
    expect(me.plan).toBe('pro');
    expect(me.hasSubscription).toBe(true);
  });

  it('PAYMENT.FAILED alone does not revoke access', async () => {
    const u = asUser(base, 'w5', 'w5@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    await paypalEvent('WH-11', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-5');
    await paypalEvent('WH-12', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED', meId, 'I-5');
    expect((await json(u.get('/api/me'))).plan).toBe('pro');
  });
});
