/**
 * Live Read Challenge prize fulfillment, fully automatic.
 *
 * 1. When Day 7 closes, `finalizePrizes` writes one prize row per winner from
 *    the final leaderboard: 1st place a year of access, 2nd to 5th a month,
 *    and everyone else who answered all seven days the free chapters.
 * 2. It then tags each winner in GoHighLevel. The tag fires the matching
 *    workflow, which emails the winner (official rules, rule 8). A failed tag
 *    is retried on the next run because notified_at stays empty.
 * 3. A ranked winner's access is applied the first time they sign in with the
 *    email they entered with (`claimChallengePrize`, called from GET /me). The
 *    access starts when applied and ends on a real date (users.pro_until), so
 *    it expires on its own like a cancelled subscription.
 *
 * Nobody has to click anything. The owner page shows every prize's status.
 */
import { CHALLENGE } from './spots';
import { dayWindow, leaderboard } from './scoring';
import { storage } from '../storage/index';
import type { ChallengeAnswer, ChallengePrize, ChallengePrizeInput, ChallengePrizeKind, User } from '../storage/types';
import { normalizeEntrantEmail } from '../routes/schemas';
import { tagGhlContact } from '../lib/ghl';
import { isOwner } from '../lib/owners';
import { logger } from '../lib/logger';
import { captureException } from '../lib/sentry';

/** GHL tags that fire the prize emails. Each needs a "Contact Tag added" workflow in GHL. */
export const PRIZE_TAGS: Record<ChallengePrizeKind, string> = {
  year: 'lrc-prize-1st',
  month: 'lrc-prize-top5',
  chapters: 'lrc-all-7',
};

/** Ranked places that win access. */
const ACCESS_PLACES = 5;

export const challengeFinished = (now: number) => now >= dayWindow(CHALLENGE.days).closesAt;

/** Pure: the prize rows the final leaderboard earns. Empty until the challenge is over. */
export function planPrizes(answers: ChallengeAnswer[], now: number): ChallengePrizeInput[] {
  if (!challengeFinished(now)) return [];
  return leaderboard(answers, now).flatMap((row, i): ChallengePrizeInput[] => {
    const rank = i + 1;
    const base = { challengeId: CHALLENGE.id, email: row.email, rank, handle: row.handle };
    if (rank === 1) return [{ ...base, kind: 'year' }];
    if (rank <= ACCESS_PLACES) return [{ ...base, kind: 'month' }];
    if (row.answered >= CHALLENGE.days) return [{ ...base, kind: 'chapters' }];
    return [];
  });
}

/** Add one year or one month (calendar), clamped so Jan 31 + 1 month is Feb 28, not Mar 3. */
export function addPrizePeriod(fromIso: string, kind: 'year' | 'month'): string {
  const d = new Date(fromIso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  if (kind === 'year') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString();
}

/** Write the prize rows once the challenge is over. Safe to call any number of times. */
export async function ensurePrizesWritten(now: number): Promise<ChallengePrize[]> {
  if (!challengeFinished(now)) return [];
  const existing = await storage.listChallengePrizes(CHALLENGE.id);
  if (existing.length) return existing;
  const answers = await storage.listChallengeAnswers(CHALLENGE.id);
  const rows = planPrizes(answers, now);
  if (!rows.length) return [];
  await storage.addChallengePrizes(rows);
  logger.info('challenge prizes written', { challengeId: CHALLENGE.id, prizes: rows.length });
  return storage.listChallengePrizes(CHALLENGE.id);
}

/**
 * Write the prizes (if not yet written) and tag every winner not yet notified.
 * A winner in the top five who also answered all seven days gets both tags.
 * Runs on a timer in the API process; see startPrizeJob.
 */
export async function finalizePrizes(now: number = Date.now()): Promise<{ written: number; notified: number }> {
  const prizes = await ensurePrizesWritten(now);
  const pending = prizes.filter((p) => !p.notifiedAt);
  if (!pending.length) return { written: prizes.length, notified: 0 };

  const answers = await storage.listChallengeAnswers(CHALLENGE.id);
  const answeredAll = (email: string) => new Set(answers.filter((a) => a.email === email).map((a) => a.day)).size >= CHALLENGE.days;

  let notified = 0;
  for (const p of pending) {
    const tags = [PRIZE_TAGS[p.kind]];
    if (p.kind !== 'chapters' && answeredAll(p.email)) tags.push(PRIZE_TAGS.chapters);
    let ok = true;
    for (const tag of tags) ok = (await tagGhlContact(p.email, tag)) && ok;
    if (ok) {
      await storage.markChallengePrizeNotified(p.challengeId, p.email);
      notified++;
    } else {
      logger.warn('challenge prize email tag failed, will retry', { rank: p.rank, kind: p.kind });
    }
  }
  logger.info('challenge prizes notified', { notified, pending: pending.length });
  return { written: prizes.length, notified };
}

export interface PrizeStatus {
  place: number;
  kind: 'year' | 'month';
  accessUntil: string | null;
}

/**
 * Apply a ranked prize to this account if its email won one and it has not
 * been applied yet, then report the account's prize (if any) for the /me
 * response. Never throws: a prize problem must not stop someone signing in.
 */
export async function claimChallengePrize(user: User, now: number = Date.now()): Promise<{ user: User; prize: PrizeStatus | null }> {
  if (!challengeFinished(now)) return { user, prize: null };
  try {
    const prizes = await ensurePrizesWritten(now);
    const email = normalizeEntrantEmail(user.email.trim().toLowerCase());
    const mine = prizes.find((p) => p.email === email && p.kind !== 'chapters');
    if (!mine) return { user, prize: statusFor(prizes.find((p) => p.grantedUserId === user.id), now) };
    if (mine.grantedAt) return { user, prize: mine.grantedUserId === user.id ? statusFor(mine, now) : null };

    const claimed = await storage.claimChallengePrize(mine.challengeId, mine.email, user.id);
    if (!claimed) return { user, prize: null }; // another sign-in got there first
    try {
      const updated = await applyAccess(user, claimed.kind as 'year' | 'month', now);
      await storage.finishChallengePrizeClaim(claimed.challengeId, claimed.email, updated.proUntil ?? new Date(now).toISOString());
      logger.info('challenge prize applied', { userId: user.id, place: claimed.rank, kind: claimed.kind, until: updated.proUntil });
      return { user: updated, prize: { place: claimed.rank, kind: claimed.kind as 'year' | 'month', accessUntil: updated.proUntil } };
    } catch (err) {
      await storage.finishChallengePrizeClaim(claimed.challengeId, claimed.email, null);
      throw err;
    }
  } catch (err) {
    captureException(err);
    logger.error('challenge prize claim failed', { userId: user.id, error: err instanceof Error ? err.message : String(err) });
    return { user, prize: null };
  }
}

/** The prize behind this account's current access; null once that access has ended. */
function statusFor(p: ChallengePrize | undefined, now: number): PrizeStatus | null {
  if (!p || p.kind === 'chapters' || !p.grantedAt) return null;
  if (p.accessUntil && Date.parse(p.accessUntil) <= now) return null;
  return { place: p.rank, kind: p.kind, accessUntil: p.accessUntil };
}

/**
 * Give the account the prize period of unlimited access.
 * - Free account: Pro until now + the period.
 * - Pro with time left and no subscription (a cancelled subscriber or an
 *   earlier prize): the period is added on top of the time they have.
 * - Active PayPal subscriber: the paid-through date moves out by the period
 *   (it governs only after they cancel). Logged, since PayPal will keep
 *   billing; with no paying customers yet this is not expected.
 * - Lifetime or owner: nothing to add; the prize is recorded as applied.
 */
async function applyAccess(user: User, kind: 'year' | 'month', now: number): Promise<User> {
  const fresh = (await storage.getUserById(user.id)) ?? user;
  if (fresh.plan === 'lifetime' || isOwner(fresh)) return fresh;

  const nowIso = new Date(now).toISOString();
  const timeLeft = fresh.plan === 'pro' && fresh.proUntil && Date.parse(fresh.proUntil) > now;
  const until = addPrizePeriod(timeLeft ? fresh.proUntil! : nowIso, kind);
  if (fresh.paypalSubscriptionId) {
    logger.warn('challenge prize won by an active subscriber; paid-through date extended, PayPal still bills', { userId: fresh.id });
  }
  await storage.setPlan(fresh.id, 'pro');
  await storage.setProUntil(fresh.id, until);
  return { ...fresh, plan: 'pro', proUntil: until };
}

const PRIZE_JOB_MS = 10 * 60 * 1000;

/** Run finalizePrizes now and every 10 minutes. Cheap before the end: it returns at once. */
export function startPrizeJob(): void {
  const run = () =>
    finalizePrizes().catch((err: unknown) => {
      captureException(err);
      logger.error('challenge prize job failed', { error: err instanceof Error ? err.message : String(err) });
    });
  // Touch the prize table at startup so a database problem surfaces in the
  // logs on deploy day, not when the challenge ends.
  storage
    .listChallengePrizes(CHALLENGE.id)
    .then((rows) => logger.info('challenge prize table ready', { prizes: rows.length }))
    .catch((err: unknown) => {
      captureException(err);
      logger.error('challenge prize table not ready', { error: err instanceof Error ? err.message : String(err) });
    })
    .finally(() => void run());
  setInterval(run, PRIZE_JOB_MS).unref();
}
