import { Router, type Request, type Response } from 'express';
import express from 'express';
import { Webhook } from 'svix';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { storage } from '../storage/index';
import { planForProduct } from '../lib/polar';
import { verifyWebhookSignature as verifyPaypalWebhook } from '../lib/paypal';
import { logger } from '../lib/logger';
import type { Plan } from '../storage/types';

export const webhooks = Router();

// These routes are mounted BEFORE express.json() in app.ts and parse the raw
// body themselves — signature verification requires the exact bytes Polar/Clerk
// signed, which a prior JSON parse would destroy.
const rawJson = express.raw({ type: 'application/json' });

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;
const polarWebhookSecret = process.env.POLAR_WEBHOOK_SECRET;

// Minimal shape we read off Polar order/subscription payloads.
interface PolarBillingObject {
  metadata?: Record<string, unknown>;
  customerId?: string;
  externalCustomerId?: string | null;
  customer?: { id?: string; externalId?: string | null } | null;
  productId?: string;
  product?: { id?: string } | null;
  status?: string;
}

// ---- Clerk user lifecycle -> keep our users table in sync ---------------
webhooks.post('/webhooks/clerk', rawJson, async (req: Request, res: Response) => {
  if (!clerkWebhookSecret) {
    return res.status(501).json({ error: 'Clerk webhook not configured. Set CLERK_WEBHOOK_SECRET.' });
  }

  const payload = (req.body as Buffer).toString('utf8');
  const headers = {
    'svix-id': req.header('svix-id') ?? '',
    'svix-timestamp': req.header('svix-timestamp') ?? '',
    'svix-signature': req.header('svix-signature') ?? '',
  };

  let evt: { type?: string; data?: any };
  try {
    evt = new Webhook(clerkWebhookSecret).verify(payload, headers) as { type?: string; data?: any };
  } catch {
    return res.status(400).json({ error: 'Invalid Clerk webhook signature' });
  }

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const data = evt.data ?? {};
    const clerkId: string | undefined = data.id;
    const email: string =
      data.email_addresses?.find((e: any) => e.id === data.primary_email_address_id)?.email_address ??
      data.email_addresses?.[0]?.email_address ??
      `${clerkId}@placeholder.local`;
    const username: string | undefined = data.username ?? undefined;
    if (clerkId) await storage.upsertUserFromWebhook(clerkId, email, username);
  } else if (evt.type === 'user.deleted') {
    // Best-effort: resolve the internal id and delete the account + its data.
    const clerkId: string | undefined = evt.data?.id;
    if (clerkId) {
      const user = await storage.getOrCreateUser(clerkId, `${clerkId}@placeholder.local`);
      await storage.deleteUser(user.id);
    }
  }

  res.json({ received: true });
});

// ---- Polar payment events -> upgrade/downgrade plan ---------------------
// Helpers to read the internal user id / customer id / plan from a Polar object.
function readUserId(o: PolarBillingObject): string | undefined {
  return (o.metadata?.userId as string | undefined) ?? o.externalCustomerId ?? o.customer?.externalId ?? undefined;
}
function readCustomerId(o: PolarBillingObject): string | undefined {
  return o.customerId ?? o.customer?.id ?? undefined;
}
function readProductId(o: PolarBillingObject): string | undefined {
  return o.productId ?? o.product?.id ?? undefined;
}

webhooks.post('/polar/webhooks', rawJson, async (req: Request, res: Response) => {
  if (!polarWebhookSecret) {
    return res.status(501).json({ error: 'Polar webhook not configured. Set POLAR_WEBHOOK_SECRET.' });
  }

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(req.body as Buffer, req.headers as Record<string, string>, polarWebhookSecret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return res.status(403).json({ error: 'Invalid Polar webhook signature' });
    }
    throw err;
  }

  switch (event.type) {
    // A one-time purchase or a subscription's paid invoice.
    case 'order.paid': {
      const o = event.data as unknown as PolarBillingObject;
      const userId = readUserId(o);
      const plan: Plan = planForProduct(readProductId(o)) ?? 'pro';
      if (userId) {
        const customerId = readCustomerId(o);
        if (customerId) await storage.setPolarCustomer(userId, customerId);
        await storage.setPlan(userId, plan);
      }
      break;
    }
    // Subscription became active -> grant pro.
    case 'subscription.active': {
      const s = event.data as unknown as PolarBillingObject;
      const userId = readUserId(s);
      if (userId) {
        const customerId = readCustomerId(s);
        if (customerId) await storage.setPolarCustomer(userId, customerId);
        await storage.setPlan(userId, 'pro');
      }
      break;
    }
    // Access actually ended -> revoke pro (lifetime buyers keep access).
    case 'subscription.revoked': {
      const s = event.data as unknown as PolarBillingObject;
      const customerId = readCustomerId(s);
      const user = customerId ? await storage.findUserByPolarCustomer(customerId) : null;
      if (user && user.plan !== 'lifetime') {
        await storage.setPlan(user.id, 'free');
      } else {
        const userId = readUserId(s);
        if (userId) await storage.setPlan(userId, 'free');
      }
      break;
    }
    default:
      // Log unhandled types at debug for visibility; ignore otherwise.
      logger.debug('polar webhook ignored', { type: event.type });
      break;
  }

  res.status(202).send('');
});

// ---- PayPal payment events -> grant lifetime access ---------------------
// The authoritative backup to the capture-on-return call. custom_id carries our
// internal user id (set on the order's purchase_unit; PayPal propagates it to
// the capture resource).
webhooks.post('/paypal/webhooks', rawJson, async (req: Request, res: Response) => {
  const body = req.body as Buffer;
  const ok = await verifyPaypalWebhook(req.headers as Record<string, string | undefined>, body);
  if (!ok) {
    return res.status(403).json({ error: 'Invalid PayPal webhook signature' });
  }

  let event: { event_type?: string; resource?: any };
  try {
    event = JSON.parse(body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid PayPal webhook body' });
  }

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const userId: string | undefined =
      event.resource?.custom_id ?? event.resource?.purchase_units?.[0]?.custom_id;
    if (userId) await storage.setPlan(userId, 'lifetime');
  } else {
    logger.debug('paypal webhook ignored', { type: event.event_type });
  }

  res.status(200).send('');
});
