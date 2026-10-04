/**
 * Live Read Challenge routes.
 *
 * `challenge` is public (no account needed): entrants are identified by email.
 * It is mounted in app.ts BEFORE the authenticated API router, with its own
 * tighter rate limit on writes. `challengeAdmin` is owner only and lives inside
 * the authenticated router.
 */
import { createHash } from 'node:crypto';
import { Router, type Request } from 'express';
import { storage } from '../storage/index';
import { isOwner } from '../lib/owners';
import { tagGhlContact } from '../lib/ghl';
import { CHALLENGE, SPOTS } from '../challenge/spots';
import { dayStatus, leaderboard, publicState } from '../challenge/scoring';
import { challengeAnswerSchema, challengeSignupSchema } from './schemas';

/** GHL tag on every challenge contact: drives the challenge emails. */
export const CHALLENGE_TAG = 'live-read-challenge';

export const challenge = Router();

challenge.get('/challenge', async (_req, res) => {
  const answers = await storage.listChallengeAnswers(CHALLENGE.id);
  res.setHeader('Cache-Control', 'no-store');
  res.json(publicState(answers, Date.now()));
});

/**
 * Pre-launch "save my seat": adds the email to GHL so it gets the Day 1 email.
 * GHL is the only place this is stored, so a failure is reported, never hidden.
 */
challenge.post('/challenge/signup', async (req, res) => {
  const { email } = challengeSignupSchema.parse(req.body);
  const saved = await tagGhlContact(email, CHALLENGE_TAG);
  if (!saved) return res.status(503).json({ error: 'We could not save your seat just now. Please try again in a minute.' });
  res.json({ ok: true });
});

/** Salted so the stored value can't be reversed to an IP with a lookup table. */
const ipHash = (req: Request) =>
  createHash('sha256').update(`${CHALLENGE.id}:${req.ip ?? ''}`).digest('hex').slice(0, 16);

challenge.post('/challenge/answer', async (req, res) => {
  const input = challengeAnswerSchema.parse(req.body);
  const status = dayStatus(input.day, Date.now());
  if (status !== 'open') {
    return res.status(409).json({
      error: status === 'upcoming' ? `Day ${input.day} is not open yet.` : `Day ${input.day} is closed. The answer is posted.`,
    });
  }
  const saved = await storage.addChallengeAnswer({ challengeId: CHALLENGE.id, ...input, ipHash: ipHash(req) });
  if (!saved) return res.status(409).json({ error: `You already locked in Day ${input.day}.` });
  void tagGhlContact(input.email, CHALLENGE_TAG);
  res.status(201).json({ ok: true, day: input.day });
});

export const challengeAdmin = Router();

/** Owner only: every spot with its answer, and the full leaderboard with emails for prize fulfillment. */
challengeAdmin.get('/admin/challenge', async (req: Request, res) => {
  if (!isOwner(req.user!)) return res.status(403).json({ error: 'Owner only.' });
  const answers = await storage.listChallengeAnswers(CHALLENGE.id);
  const now = Date.now();
  res.json({
    challenge: CHALLENGE,
    spots: SPOTS.map((s) => ({ ...s, status: dayStatus(s.day, now), entries: answers.filter((a) => a.day === s.day).length })),
    leaderboard: leaderboard(answers, now).map((row) => ({ ...row, sharedIpWith: sharedIp(answers, row.email) })),
  });
});

/** Other entrant emails that answered from the same IP as this one: a hint of multiple entries, for a human to judge. */
function sharedIp(answers: { email: string; ipHash: string | null }[], email: string): string[] {
  const mine = new Set(answers.filter((a) => a.email === email && a.ipHash).map((a) => a.ipHash));
  return [...new Set(answers.filter((a) => a.email !== email && a.ipHash && mine.has(a.ipHash)).map((a) => a.email))];
}
