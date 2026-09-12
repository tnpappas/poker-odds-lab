import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// PayPal is mocked: configured, with controllable verify/cancel behaviour.
const paypalMock = vi.hoisted(() => ({
  verifySubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  createSubscription: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));
vi.mock('../src/lib/paypal', () => ({
  paypalConfigured: true,
  PAYPAL_AUTOPAY_URL: 'https://www.paypal.com/myaccount/autopay/',
  paypalPlanIdFor: (plan: string) => (plan === 'monthly' ? 'P-MONTHLY' : 'P-ANNUAL'),
  ...paypalMock,
}));
vi.mock('../src/lib/ghl', () => ({ ghlConfigured: false, tagGhlCustomer: vi.fn(async () => undefined) }));

import { startServer, asUser, json } from './helpers';

let base: string;
let close: () => Promise<void>;

beforeAll(async () => ({ base, close } = await startServer()));
afterAll(() => close());

describe('billing routes', () => {
  it('checkout returns the PayPal approval url', async () => {
    paypalMock.createSubscription.mockResolvedValueOnce({ id: 'I-NEW', approveUrl: 'https://paypal.test/approve', status: 'APPROVAL_PENDING' });
    const res = await asUser(base, 'b1', 'b1@example.com').post('/api/billing/checkout', { plan: 'monthly' });
    expect(res.status).toBe(200);
    expect((await json(res)).url).toBe('https://paypal.test/approve');
    expect(paypalMock.createSubscription).toHaveBeenCalledWith(expect.objectContaining({ planId: 'P-MONTHLY', email: 'b1@example.com' }));
  });

  it('checkout rejects an unknown plan', async () => {
    const res = await asUser(base, 'b1').post('/api/billing/checkout', { plan: 'lifetime' });
    expect(res.status).toBe(400);
  });

  it('capture grants pro and stores the subscription id when PayPal says ACTIVE', async () => {
    const u = asUser(base, 'b2', 'b2@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    const next = new Date(Date.now() + 30 * 86_400_000).toISOString();
    paypalMock.verifySubscription.mockResolvedValueOnce({ subscriptionId: 'I-ACTIVE', userId: meId, active: true, status: 'ACTIVE', nextBillingTime: next });
    const res = await u.post('/api/billing/capture', { subscriptionId: 'I-ACTIVE' });
    expect(res.status).toBe(200);
    expect((await json(res)).entitled).toBe(true);
    const me = await json(u.get('/api/me'));
    expect(me.plan).toBe('pro');
    expect(me.hasSubscription).toBe(true);
    expect(me.proUntil).toBe(next);
  });

  it('capture refuses a subscription that belongs to a different user', async () => {
    const u = asUser(base, 'b3', 'b3@example.com');
    paypalMock.verifySubscription.mockResolvedValueOnce({ subscriptionId: 'I-OTHER', userId: 'someone-else', active: true, status: 'ACTIVE' });
    const res = await u.post('/api/billing/capture', { subscriptionId: 'I-OTHER' });
    expect(res.status).toBe(403);
    expect((await json(u.get('/api/me'))).plan).toBe('free');
  });

  it('capture answers 202 while approval is still pending', async () => {
    const u = asUser(base, 'b4', 'b4@example.com');
    paypalMock.verifySubscription.mockResolvedValueOnce({ subscriptionId: 'I-PEND', userId: undefined, active: false, status: 'APPROVAL_PENDING' });
    const res = await u.post('/api/billing/capture', { subscriptionId: 'I-PEND' });
    expect(res.status).toBe(202);
  });

  it('cancel without a subscription on file is a 400', async () => {
    const res = await asUser(base, 'b5', 'b5@example.com').post('/api/billing/cancel');
    expect(res.status).toBe(400);
  });

  it('cancel calls PayPal with the subscription on file', async () => {
    const u = asUser(base, 'b2', 'b2@example.com'); // b2 subscribed above
    paypalMock.cancelSubscription.mockResolvedValueOnce(undefined);
    const res = await u.post('/api/billing/cancel');
    expect(res.status).toBe(200);
    expect(paypalMock.cancelSubscription).toHaveBeenCalledWith('I-ACTIVE');
  });

  it('cancel surfaces a PayPal outage as 502 with a generic message', async () => {
    const u = asUser(base, 'b6', 'b6@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    paypalMock.verifySubscription.mockResolvedValueOnce({ subscriptionId: 'I-B6', userId: meId, active: true, status: 'ACTIVE' });
    await u.post('/api/billing/capture', { subscriptionId: 'I-B6' });
    paypalMock.cancelSubscription.mockRejectedValueOnce(new Error('PayPal cancel error 500: secret details'));
    const res = await u.post('/api/billing/cancel');
    expect(res.status).toBe(502);
    const body = await json(res);
    expect(body.error).not.toContain('secret details');
  });

  it('portal points at PayPal automatic payments', async () => {
    const res = await asUser(base, 'b1').get('/api/billing/portal');
    expect((await json(res)).url).toContain('paypal.com');
  });

  it('account deletion cancels the PayPal subscription first', async () => {
    const u = asUser(base, 'b7', 'b7@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    paypalMock.verifySubscription.mockResolvedValueOnce({ subscriptionId: 'I-B7', userId: meId, active: true, status: 'ACTIVE' });
    await u.post('/api/billing/capture', { subscriptionId: 'I-B7' });
    paypalMock.cancelSubscription.mockClear();
    paypalMock.cancelSubscription.mockResolvedValueOnce(undefined);
    const res = await u.del('/api/account');
    expect(res.status).toBe(204);
    expect(paypalMock.cancelSubscription).toHaveBeenCalledWith('I-B7', expect.any(String));
  });

  it('account deletion is refused when PayPal cannot cancel', async () => {
    const u = asUser(base, 'b8', 'b8@example.com');
    const meId = (await json(u.get('/api/me'))).id;
    paypalMock.verifySubscription.mockResolvedValueOnce({ subscriptionId: 'I-B8', userId: meId, active: true, status: 'ACTIVE' });
    await u.post('/api/billing/capture', { subscriptionId: 'I-B8' });
    paypalMock.cancelSubscription.mockRejectedValueOnce(new Error('down'));
    const res = await u.del('/api/account');
    expect(res.status).toBe(502);
    expect((await u.get('/api/me')).status).toBe(200); // still exists
  });
});
