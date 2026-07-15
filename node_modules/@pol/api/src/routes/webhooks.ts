import { Router, type Request, type Response } from 'express';
import express from 'express';
import { Webhook } from 'svix';
import { storage } from '../storage/index';
import { stripe } from '../lib/stripe';
import { logger } from '../lib/logger';
import type { Plan } from '../storage/types';

export const webhooks = Router();

// These routes are mounted BEFORE express.json() in app.ts and parse the raw
// body themselves — signature verification requires the exact bytes Stripe/Clerk
// signed, which a prior JSON parse would destroy.
const rawJson = express.raw({ type: 'application/json' });

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

// ---- Stripe payment events -> upgrade/downgrade plan --------------------
webhooks.post('/stripe/webhooks', rawJson, async (req: Request, res: Response) => {
  if (!stripe || !stripeWebhookSecret) {
    return res.status(501).json({ error: 'Stripe webhook not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.' });
  }

  const sig = req.header('stripe-signature') ?? '';
  let evt;
  try {
    evt = stripe.webhooks.constructEvent(req.body as Buffer, sig, stripeWebhookSecret);
  } catch {
    return res.status(400).json({ error: 'Invalid Stripe webhook signature' });
  }

  switch (evt.type) {
    case 'checkout.session.completed': {
      const s = evt.data.object;
      const userId = (s.metadata?.userId as string | undefined) ?? (s.client_reference_id ?? undefined);
      const plan: Plan = s.metadata?.plan === 'lifetime' ? 'lifetime' : 'pro';
      if (userId) {
        if (typeof s.customer === 'string') await storage.setStripeCustomer(userId, s.customer);
        await storage.setPlan(userId, plan);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      // Subscription ended -> revoke pro access (lifetime buyers keep access).
      const customerId = evt.data.object.customer;
      if (typeof customerId === 'string') {
        const user = await storage.findUserByStripeCustomer(customerId);
        if (user && user.plan !== 'lifetime') await storage.setPlan(user.id, 'free');
      }
      break;
    }
    case 'invoice.payment_failed': {
      // Surface for observability; Stripe's own dunning handles retries.
      const customerId = (evt.data.object as { customer?: unknown }).customer;
      logger.warn('stripe invoice.payment_failed', { customer: String(customerId) });
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});
