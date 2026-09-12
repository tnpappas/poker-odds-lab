import { Router } from 'express';
import { config } from '../config';
import {
  paypalConfigured, createSubscription, verifySubscription, cancelSubscription, paypalPlanIdFor, PAYPAL_AUTOPAY_URL,
} from '../lib/paypal';
import { grantPro } from '../lib/entitlement';
import { logger } from '../lib/logger';
import { checkoutSchema, captureSchema } from './schemas';

export const billing = Router();

const notConfigured = { error: 'Payments are not configured. Set PAYPAL_CLIENT_ID and PAYPAL_SECRET.' };

/** Create a PayPal subscription and return the approval URL for the browser to open. */
billing.post('/billing/checkout', async (req, res) => {
  if (!paypalConfigured) return res.status(501).json(notConfigured);
  const { plan } = checkoutSchema.parse(req.body);
  const user = req.user!;
  const planId = paypalPlanIdFor(plan);
  if (!planId) {
    logger.error('checkout: plan id missing', { plan });
    return res.status(500).json({ error: 'This plan is not available right now. Please contact support.' });
  }
  const base = config.primaryFrontendUrl;
  const sub = await createSubscription({
    planId,
    userId: user.id,
    email: user.email,
    returnUrl: `${base}/?checkout=paypal&plan=${plan}`,
    cancelUrl: `${base}/?checkout=cancel`,
  });
  logger.info('checkout started', { userId: user.id, plan, subscriptionId: sub.id });
  res.json({ url: sub.approveUrl });
});

/**
 * Called when the buyer returns from PayPal. Confirms the subscription with
 * PayPal and grants access; BILLING.SUBSCRIPTION.ACTIVATED is the backup.
 */
billing.post('/billing/capture', async (req, res) => {
  if (!paypalConfigured) return res.status(501).json(notConfigured);
  const { subscriptionId } = captureSchema.parse(req.body);
  const user = req.user!;
  const result = await verifySubscription(subscriptionId);

  if (result.userId && result.userId !== user.id) {
    logger.warn('capture: subscription belongs to another user', { userId: user.id, subscriptionId });
    return res.status(403).json({ error: 'This subscription belongs to a different account.' });
  }
  if (result.active) {
    await grantPro(user.id, subscriptionId);
    return res.json({ entitled: true });
  }
  res.status(202).json({ entitled: false, status: result.status });
});

/** Cancel the signed-in user's subscription. Access is revoked by the CANCELLED webhook. */
billing.post('/billing/cancel', async (req, res) => {
  if (!paypalConfigured) return res.status(501).json(notConfigured);
  const user = req.user!;
  if (!user.paypalSubscriptionId) {
    return res.status(400).json({ error: 'No subscription found for this account.' });
  }
  try {
    await cancelSubscription(user.paypalSubscriptionId);
  } catch (err) {
    logger.error('paypal cancel failed', { userId: user.id, err: String(err) });
    return res.status(502).json({ error: 'Could not cancel the subscription. Please try again or contact support.' });
  }
  logger.info('subscription cancelled by user', { userId: user.id });
  res.json({ cancelled: true });
});

/** Where the customer can see payments, update their card, or cancel on PayPal's side. */
billing.get('/billing/portal', (_req, res) => {
  res.json({ url: PAYPAL_AUTOPAY_URL, provider: 'paypal' });
});
