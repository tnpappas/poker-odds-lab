import { Router } from 'express';
import { storage } from '../storage/index';
import { cancelSubscription, paypalConfigured } from '../lib/paypal';
import { logger } from '../lib/logger';

export const account = Router();

/**
 * Delete the signed-in user and everything they own (GDPR / CCPA).
 *
 * A live PayPal subscription is cancelled first. If PayPal cannot be reached
 * the deletion is refused rather than leaving a subscription billing a user
 * who no longer exists in our system.
 */
account.delete('/account', async (req, res) => {
  const user = req.user!;
  if (user.paypalSubscriptionId && paypalConfigured) {
    try {
      await cancelSubscription(user.paypalSubscriptionId, 'Account deleted by user');
    } catch (err) {
      logger.error('account delete: paypal cancel failed', { userId: user.id, err: String(err) });
      return res.status(502).json({
        error: 'We could not cancel your subscription with PayPal just now. Please try again in a few minutes or cancel it from your PayPal account first.',
      });
    }
  }
  const ok = await storage.deleteUser(user.id);
  if (!ok) return res.status(404).json({ error: 'User not found' });
  logger.info('account deleted', { userId: user.id });
  res.status(204).end();
});
