import { Router, type Request } from 'express';
import { storage } from '../storage/index';
import { isOwner } from '../lib/owners';
import { tagGhlCustomer } from '../lib/ghl';
import { grantSchema } from './schemas';
import { isEntitled, expireIfDue } from '../lib/entitlement';

export const me = Router();

/** The client-side purchase gate reads `entitled` from here on every load. */
me.get('/me', async (req: Request, res) => {
  const u = await expireIfDue(req.user!);
  const owner = isOwner(u);
  const entitled = owner || isEntitled(u);
  const plan = entitled ? (u.plan === 'lifetime' ? 'lifetime' : 'pro') : 'free';
  res.json({
    id: u.id,
    email: u.email,
    plan,
    entitled,
    owner,
    hasSubscription: !!u.paypalSubscriptionId,
    /** Set when Pro is paid up to a date: renews on it if hasSubscription, ends on it otherwise. */
    proUntil: u.plan === 'pro' ? u.proUntil : null,
  });
});

/**
 * Owner only: unlock (or remove) access for an account by email, for comping
 * a customer or fixing a payment that failed to grant access.
 */
me.post('/admin/grant', async (req: Request, res) => {
  if (!isOwner(req.user!)) return res.status(403).json({ error: 'Owner only.' });
  const { email, plan } = grantSchema.parse(req.body);
  const user = await storage.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: `No account found for ${email}. They need to sign in once first.` });
  }
  const wasEntitled = user.plan !== 'free';
  await storage.setPlan(user.id, plan);
  if (plan !== 'free' && !wasEntitled) await tagGhlCustomer(user.email);
  res.json({ email: user.email, plan });
});
