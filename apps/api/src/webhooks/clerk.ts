import { Router, type Request, type Response } from 'express';
import { Webhook } from 'svix';
import { config } from '../config';
import { storage } from '../storage/index';
import { logger } from '../lib/logger';
import { rawJson } from './raw';

export const clerkWebhook = Router();

interface ClerkEvent {
  type?: string;
  data?: {
    id?: string;
    username?: string | null;
    primary_email_address_id?: string;
    email_addresses?: { id: string; email_address: string }[];
  };
}

/** Keep our users table in sync with Clerk sign-ups, profile edits and deletions. */
clerkWebhook.post('/webhooks/clerk', rawJson, async (req: Request, res: Response) => {
  const secret = config.CLERK_WEBHOOK_SECRET;
  if (!secret) return res.status(501).json({ error: 'Clerk webhook not configured. Set CLERK_WEBHOOK_SECRET.' });

  const payload = (req.body as Buffer).toString('utf8');
  const svixId = req.header('svix-id') ?? '';
  const headers = {
    'svix-id': svixId,
    'svix-timestamp': req.header('svix-timestamp') ?? '',
    'svix-signature': req.header('svix-signature') ?? '',
  };

  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(payload, headers) as ClerkEvent;
  } catch {
    return res.status(400).json({ error: 'Invalid Clerk webhook signature' });
  }

  if (svixId && !(await storage.recordWebhookEvent('clerk', svixId, evt.type ?? 'unknown'))) {
    logger.debug('clerk webhook duplicate ignored', { svixId });
    return res.json({ received: true, duplicate: true });
  }

  const data = evt.data ?? {};
  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const clerkId = data.id;
    const email =
      data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address ??
      data.email_addresses?.[0]?.email_address ??
      `${clerkId}@placeholder.local`;
    if (clerkId) await storage.upsertUserFromWebhook(clerkId, email, data.username ?? undefined);
  } else if (evt.type === 'user.deleted' && data.id) {
    const user = await storage.getOrCreateUser(data.id, `${data.id}@placeholder.local`);
    await storage.deleteUser(user.id);
  }

  res.json({ received: true });
});
