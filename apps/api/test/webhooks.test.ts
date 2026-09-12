import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const paypalMock = vi.hoisted(() => ({ verifyWebhookSignature: vi.fn(async () => true) }));
vi.mock('../src/lib/paypal', () => ({
  paypalConfigured: true,
  PAYPAL_AUTOPAY_URL: 'https://www.paypal.com/myaccount/autopay/',
  paypalPlanIdFor: () => 'P-X',
  verifySubscription: vi.fn(),
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

function paypalEvent(id: string, type: string, userId: string, subscriptionId: string) {
  return fetch(`${base}/api/paypal/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, event_type: type, resource: { id: subscriptionId, custom_id: userId } }),
  });
}

describe('PayPal webhook', () => {
  it('rejects a bad signature with 403 and changes nothing', async () => {
    const u = asUser(base, 'w0', 'w0@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    paypalMock.verifyWebhookSignature.mockResolvedValueOnce(false);
    const res = await paypalEvent('WH-bad', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-0');
    expect(res.status).toBe(403);
    expect((await json(u.get('/api/me'))).plan).toBe('free');
  });

  it('ACTIVATED grants pro, CANCELLED revokes it', async () => {
    const u = asUser(base, 'w1', 'w1@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    expect((await paypalEvent('WH-1', 'BILLING.SUBSCRIPTION.ACTIVATED', meId, 'I-1')).status).toBe(200);
    let me = await json(u.get('/api/me'));
    expect(me.plan).toBe('pro');
    expect(me.hasSubscription).toBe(true);

    expect((await paypalEvent('WH-2', 'BILLING.SUBSCRIPTION.CANCELLED', meId, 'I-1')).status).toBe(200);
    me = await json(u.get('/api/me'));
    expect(me.plan).toBe('free');
    expect(me.hasSubscription).toBe(false);
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
