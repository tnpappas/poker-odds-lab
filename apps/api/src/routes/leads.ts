/**
 * Public lead capture (no account needed). Mounted in app.ts BEFORE the
 * authenticated API router, with its own tight rate limit on writes.
 */
import { Router } from 'express';
import { tagGhlContact } from '../lib/ghl';
import { logger } from '../lib/logger';
import { freeChaptersSchema } from './schemas';

/** GHL tag on everyone who asks for the free chapters on the site. */
export const FREE_CHAPTERS_TAG = 'free-chapters';

export const leads = Router();

/**
 * Free chapters signup. GHL is the only place the address is stored, so a
 * failure is reported to the visitor, never hidden.
 */
leads.post('/leads/free-chapters', async (req, res) => {
  const { email, source } = freeChaptersSchema.parse(req.body);
  const saved = await tagGhlContact(email, FREE_CHAPTERS_TAG);
  if (!saved) return res.status(503).json({ error: 'We could not save your email just now. Please try again in a minute.' });
  logger.info('free chapters signup', { source });
  res.json({ ok: true });
});
