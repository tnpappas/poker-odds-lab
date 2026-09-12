import { storage } from '../storage/index';
import type { User } from '../storage/types';
import { tagGhlCustomer } from './ghl';
import { logger } from './logger';

/**
 * Is this user entitled to Pro right now?
 *
 * - lifetime: always.
 * - pro with a subscription on file: yes (PayPal is still billing them).
 * - pro with no subscription but a paid-through date: yes until that date.
 *   This is the cancelled-but-paid-up case; they keep what they paid for.
 * - pro with neither: yes (comped by the owner via /admin/grant).
 */
export function isEntitled(user: User, now: Date = new Date()): boolean {
  if (user.plan === 'lifetime') return true;
  if (user.plan !== 'pro') return false;
  if (user.paypalSubscriptionId) return true;
  if (user.proUntil) return new Date(user.proUntil) > now;
  return true;
}

/**
 * Grant Pro access. Tags the buyer in GoHighLevel on their first purchase only
 * (that tag fires the book-delivery workflow). Safe to call more than once.
 * paidThrough is PayPal's next billing time; it moves forward on every renewal.
 */
export async function grantPro(userId: string, subscriptionId?: string, paidThrough?: string): Promise<void> {
  const user = await storage.getUserById(userId);
  if (!user) {
    logger.warn('grantPro: unknown user', { userId });
    return;
  }
  const firstPurchase = user.plan === 'free';
  await storage.setPlan(userId, 'pro');
  if (subscriptionId) await storage.setPaypalSubscription(userId, subscriptionId);
  if (paidThrough) await storage.setProUntil(userId, paidThrough);
  if (firstPurchase) await tagGhlCustomer(user.email);
}

/** Record a renewal: only the paid-through date moves. */
export async function extendPro(userId: string, paidThrough: string): Promise<void> {
  await storage.setProUntil(userId, paidThrough);
}

function isOnFile(user: User, endedSubscriptionId?: string): boolean {
  if (endedSubscriptionId && user.paypalSubscriptionId && user.paypalSubscriptionId !== endedSubscriptionId) {
    logger.info('subscription event skipped: not the subscription on file', { userId: user.id, endedSubscriptionId });
    return false;
  }
  return true;
}

/**
 * The customer cancelled. PayPal stops billing at once, but they keep Pro
 * until the period they paid for ends. Returns what happened.
 */
export async function endSubscription(
  userId: string,
  endedSubscriptionId?: string,
): Promise<'kept-until-paid-through' | 'revoked' | 'skipped'> {
  const user = await storage.getUserById(userId);
  if (!user || user.plan === 'lifetime' || !isOnFile(user, endedSubscriptionId)) return 'skipped';
  await storage.setPaypalSubscription(userId, null);
  if (user.proUntil && new Date(user.proUntil) > new Date()) return 'kept-until-paid-through';
  // No paid-through date on file (a subscription from before this was stored).
  await storage.setPlan(userId, 'free');
  await storage.setProUntil(userId, null);
  return 'revoked';
}

/**
 * Revoke Pro at once because the subscription ended without the customer
 * having paid for the current period (SUSPENDED after failed payments, or
 * EXPIRED). When the ended subscription id is known, only revoke if it is
 * the one on file: a late event for an old subscription must not take away
 * access the customer re-bought.
 */
export async function revokePro(userId: string, endedSubscriptionId?: string): Promise<boolean> {
  const user = await storage.getUserById(userId);
  if (!user) return false;
  if (user.plan === 'lifetime') return false;
  if (!isOnFile(user, endedSubscriptionId)) return false;
  await storage.setPlan(userId, 'free');
  await storage.setPaypalSubscription(userId, null);
  await storage.setProUntil(userId, null);
  return true;
}

/**
 * Called on every /me: if a cancelled subscriber's paid period has ended,
 * move them to free so the rest of the app sees a consistent plan.
 */
export async function expireIfDue(user: User): Promise<User> {
  if (user.plan === 'pro' && !user.paypalSubscriptionId && user.proUntil && new Date(user.proUntil) <= new Date()) {
    await storage.setPlan(user.id, 'free');
    await storage.setProUntil(user.id, null);
    logger.info('pro period ended, moved to free', { userId: user.id });
    return { ...user, plan: 'free', proUntil: null };
  }
  return user;
}
