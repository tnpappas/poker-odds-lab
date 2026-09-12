import { Router, type Request, type Response } from 'express';
import { storage } from '../storage/index';
import { verifyWebhookSignature, verifySubscription } from '../lib/paypal';
import { grantPro, revokePro, endSubscription, extendPro } from '../lib/entitlement';
import { logger } from '../lib/logger';
import { rawJson } from './raw';

export const paypalWebhook = Router();

interface PayPalEvent {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    status?: string;
    /** On subscription events: the next charge time, i.e. the end of the paid period. */
    billing_info?: { next_billing_time?: string };
    /** On PAYMENT.SALE.COMPLETED: the subscription the payment belongs to. */
    billing_agreement_id?: string;
  };
}

const GRANT_EVENTS = new Set(['BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.RE-ACTIVATED']);
/**
 * Immediate revoke: the customer has not paid for the current period.
 * SUSPENDED fires after the plan's missed-payment threshold; EXPIRED when the
 * subscription reaches its end. CANCELLED is handled separately: the customer
 * keeps Pro until the period they already paid for ends.
 */
const REVOKE_EVENTS = new Set(['BILLING.SUBSCRIPTION.EXPIRED', 'BILLING.SUBSCRIPTION.SUSPENDED']);

/**
 * PayPal subscription lifecycle. Signature verified with PayPal, deduplicated
 * by event id, and the subscription id on the event is checked against the
 * one on file before access is revoked.
 */
paypalWebhook.post('/paypal/webhooks', rawJson, async (req: Request, res: Response) => {
  const body = req.body as Buffer;
  if (!(await verifyWebhookSignature(req.headers as Record<string, string | undefined>, body))) {
    return res.status(403).json({ error: 'Invalid PayPal webhook signature' });
  }

  let event: PayPalEvent;
  try {
    event = JSON.parse(body.toString('utf8')) as PayPalEvent;
  } catch {
    return res.status(400).json({ error: 'Invalid PayPal webhook body' });
  }

  const type = event.event_type ?? 'unknown';
  if (event.id && !(await storage.recordWebhookEvent('paypal', event.id, type))) {
    logger.info('paypal webhook duplicate ignored', { id: event.id, type });
    return res.status(200).json({ received: true, duplicate: true });
  }

  const userId = event.resource?.custom_id;
  const subscriptionId = event.resource?.id;
  const paidThrough = event.resource?.billing_info?.next_billing_time;

  if (GRANT_EVENTS.has(type)) {
    if (userId) {
      await grantPro(userId, subscriptionId, paidThrough);
      logger.info('paypal subscription active', { userId, subscriptionId, type, paidThrough });
    }
  } else if (type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    if (userId) {
      const outcome = await endSubscription(userId, subscriptionId);
      logger.info('paypal subscription cancelled', { userId, subscriptionId, outcome });
    }
  } else if (REVOKE_EVENTS.has(type)) {
    if (userId) {
      const revoked = await revokePro(userId, subscriptionId);
      logger.info('paypal subscription ended', { userId, subscriptionId, type, revoked });
    }
  } else if (type === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
    // PayPal retries on its own; access stays until SUSPENDED. Logged so failed
    // renewals are visible in Railway logs and Sentry breadcrumbs.
    logger.warn('paypal renewal payment failed', { userId, subscriptionId });
  } else if (type === 'PAYMENT.SALE.COMPLETED') {
    // A renewal: read the subscription back to move the paid-through date.
    const subId = event.resource?.billing_agreement_id;
    if (subId) {
      try {
        const sub = await verifySubscription(subId);
        if (sub.userId && sub.nextBillingTime) await extendPro(sub.userId, sub.nextBillingTime);
        logger.info('paypal renewal payment completed', { saleId: event.resource?.id, subId, paidThrough: sub.nextBillingTime });
      } catch (err) {
        logger.error('paypal renewal: could not read subscription', { subId, err: String(err) });
      }
    } else {
      logger.info('paypal payment completed (no subscription id)', { saleId: event.resource?.id });
    }
  } else {
    logger.debug('paypal webhook ignored', { type });
  }

  res.status(200).json({ received: true });
});
