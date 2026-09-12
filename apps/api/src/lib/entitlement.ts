import { storage } from '../storage/index';
import { tagGhlCustomer } from './ghl';
import { logger } from './logger';

/**
 * Grant Pro access. Tags the buyer in GoHighLevel on their first purchase only
 * (that tag fires the book-delivery workflow). Safe to call more than once.
 */
export async function grantPro(userId: string, subscriptionId?: string): Promise<void> {
  const user = await storage.getUserById(userId);
  if (!user) {
    logger.warn('grantPro: unknown user', { userId });
    return;
  }
  const firstPurchase = user.plan === 'free';
  await storage.setPlan(userId, 'pro');
  if (subscriptionId) await storage.setPaypalSubscription(userId, subscriptionId);
  if (firstPurchase) await tagGhlCustomer(user.email);
}

/**
 * Revoke Pro because a subscription ended. When the ended subscription id is
 * known, only revoke if it is the one on file: a late CANCELLED for an old
 * subscription must not take away access the customer re-bought.
 */
export async function revokePro(userId: string, endedSubscriptionId?: string): Promise<boolean> {
  const user = await storage.getUserById(userId);
  if (!user) return false;
  if (user.plan === 'lifetime') return false;
  if (endedSubscriptionId && user.paypalSubscriptionId && user.paypalSubscriptionId !== endedSubscriptionId) {
    logger.info('revokePro skipped: subscription is not the one on file', { userId, endedSubscriptionId });
    return false;
  }
  await storage.setPlan(userId, 'free');
  await storage.setPaypalSubscription(userId, null);
  return true;
}
