import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

const ghl = vi.hoisted(() => ({ tagGhlContact: vi.fn(async (_email: string, _tag: string) => true) }));
vi.mock('../src/lib/ghl', () => ({ ghlConfigured: true, tagGhlCustomer: vi.fn(async () => undefined), ...ghl }));

import { startServer, asUser, json } from './helpers';
import { CHALLENGE, SPOTS } from '../src/challenge/spots';
import { dayWindow } from '../src/challenge/scoring';
import { addPrizePeriod, finalizePrizes, planPrizes, PRIZE_TAGS } from '../src/challenge/prizes';
import { storage } from '../src/storage/index';
import type { ChallengeAnswer } from '../src/storage/types';

let base: string;
let close: () => Promise<void>;
beforeAll(async () => ({ base, close } = await startServer()));
afterAll(() => close());
afterEach(() => vi.useRealTimers());

const at = (ms: number) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(ms);
};
const END = dayWindow(CHALLENGE.days).closesAt;
const DAY_MS = 24 * 60 * 60 * 1000;
const wrong = (a: 'call' | 'fold') => (a === 'call' ? 'fold' : 'call');

/**
 * Enter an answer for each listed day while that day is open.
 * `right` = how many of those days to answer correctly (the first N).
 */
async function enter(email: string, handle: string, days: number[], right: number, equityOff = 5) {
  let n = 0;
  for (const day of days) {
    at(dayWindow(day).opensAt + 60_000 + days.indexOf(day));
    const spot = SPOTS[day - 1];
    await storage.addChallengeAnswer({
      challengeId: CHALLENGE.id, day, email, handle,
      action: n++ < right ? spot.correct : wrong(spot.correct),
      equityGuess: Math.min(100, Math.round(spot.equityPct) + equityOff),
      ipHash: null,
    });
  }
}

const ALL = [1, 2, 3, 4, 5, 6, 7];

describe('prize dates', () => {
  it('adds a calendar year or month', () => {
    expect(addPrizePeriod('2026-10-27T15:00:00.000Z', 'year')).toBe('2027-10-27T15:00:00.000Z');
    expect(addPrizePeriod('2026-10-27T15:00:00.000Z', 'month')).toBe('2026-11-27T15:00:00.000Z');
    expect(addPrizePeriod('2027-01-31T00:00:00.000Z', 'month')).toBe('2027-02-28T00:00:00.000Z');
  });
});

describe('planPrizes', () => {
  const a = (email: string, day: number, action: 'call' | 'fold'): ChallengeAnswer => ({
    id: `${email}${day}`, challengeId: CHALLENGE.id, day, email, handle: email, action, equityGuess: 50, ipHash: null,
    createdAt: new Date(dayWindow(day).opensAt).toISOString(),
  });
  it('is empty until Day 7 closes', () => {
    expect(planPrizes([a('x@y.com', 1, 'call')], END - 1)).toEqual([]);
  });
  it('gives 1st a year, 2nd to 5th a month, and all-7 finishers outside the top 5 the chapters', () => {
    const answers = [
      ...ALL.map((d) => a('first@x.com', d, SPOTS[d - 1].correct)),
      ...['b', 'c', 'd', 'e'].map((n) => a(`${n}@x.com`, 1, SPOTS[0].correct)),
      ...ALL.map((d) => a('sixth@x.com', d, wrong(SPOTS[d - 1].correct))),
      a('seventh@x.com', 2, wrong(SPOTS[1].correct)),
    ];
    const plan = planPrizes(answers, END);
    expect(plan.map((p) => [p.email, p.kind, p.rank])).toEqual([
      ['first@x.com', 'year', 1],
      ['b@x.com', 'month', 2], ['c@x.com', 'month', 3], ['d@x.com', 'month', 4], ['e@x.com', 'month', 5],
      ['sixth@x.com', 'chapters', 6],
    ]);
  });
});

describe('automatic prize fulfillment', () => {
  beforeAll(async () => {
    // 1st: all seven right, entered with a dotted, +tagged Gmail address.
    await enter('alpha@gmail.com', 'alpha', ALL, 7);
    await enter('second@example.com', 'second', ALL, 6);
    await enter('third@example.com', 'third', ALL, 5);
    await enter('fourth@example.com', 'fourth', [1, 2, 3], 3);
    await enter('fifth@example.com', 'fifth', [1, 2], 2);
    // 6th: answered all seven, wins the chapters only.
    await enter('sixth@example.com', 'sixth', ALL, 1, 30);
    await enter('seventh@example.com', 'seventh', [1], 0);
  });

  it('does nothing before the challenge ends', async () => {
    at(END - 1000);
    expect(await finalizePrizes(Date.now())).toEqual({ written: 0, notified: 0 });
    const me = await json(asUser(base, 'alpha-user', 'A.lpha+poker@gmail.com').get('/api/me'));
    expect(me.entitled).toBe(false);
    expect(me.challengePrize).toBeNull();
  });

  it('writes the prizes and emails every winner once Day 7 closes', async () => {
    ghl.tagGhlContact.mockClear();
    at(END + 1000);
    expect(await finalizePrizes(Date.now())).toEqual({ written: 6, notified: 6 });
    const tags = ghl.tagGhlContact.mock.calls.map(([email, tag]) => `${email} ${tag}`);
    expect(tags).toContain(`alpha@gmail.com ${PRIZE_TAGS.year}`);
    expect(tags).toContain(`alpha@gmail.com ${PRIZE_TAGS.chapters}`); // 1st also answered all seven
    expect(tags).toContain(`second@example.com ${PRIZE_TAGS.month}`);
    expect(tags).toContain(`fifth@example.com ${PRIZE_TAGS.month}`);
    expect(tags).not.toContain(`fifth@example.com ${PRIZE_TAGS.chapters}`);
    expect(tags).toContain(`sixth@example.com ${PRIZE_TAGS.chapters}`);
    expect(tags.some((t) => t.startsWith('seventh@'))).toBe(false);

    ghl.tagGhlContact.mockClear();
    expect(await finalizePrizes(Date.now())).toEqual({ written: 6, notified: 0 });
    expect(ghl.tagGhlContact).not.toHaveBeenCalled();
  });

  it('turns on a year of access the first time 1st place signs in, matching Gmail dots and +tags', async () => {
    const now = END + DAY_MS;
    at(now);
    const me = await json(asUser(base, 'alpha-user', 'A.lpha+poker@gmail.com').get('/api/me'));
    expect(me.entitled).toBe(true);
    expect(me.plan).toBe('pro');
    expect(me.hasSubscription).toBe(false);
    expect(me.proUntil).toBe(addPrizePeriod(new Date(now).toISOString(), 'year'));
    expect(me.challengePrize).toEqual({ place: 1, kind: 'year', accessUntil: me.proUntil });

    at(now + DAY_MS);
    const again = await json(asUser(base, 'alpha-user', 'A.lpha+poker@gmail.com').get('/api/me'));
    expect(again.proUntil).toBe(me.proUntil); // applied once, never stacked
  });

  it('gives 2nd to 5th one month, and the access ends on its own', async () => {
    const now = END + 2 * DAY_MS;
    at(now);
    const me = await json(asUser(base, 'second-user', 'second@example.com').get('/api/me'));
    expect(me.entitled).toBe(true);
    expect(me.proUntil).toBe(addPrizePeriod(new Date(now).toISOString(), 'month'));
    expect(me.challengePrize.place).toBe(2);

    at(Date.parse(me.proUntil) + 1000);
    const later = await json(asUser(base, 'second-user', 'second@example.com').get('/api/me'));
    expect(later.entitled).toBe(false);
    expect(later.plan).toBe('free');
    expect(later.challengePrize).toBeNull();
  });

  it('gives no access to the chapters winner or to non-winners', async () => {
    at(END + DAY_MS);
    for (const [id, email] of [['sixth-user', 'sixth@example.com'], ['seventh-user', 'seventh@example.com']]) {
      const me = await json(asUser(base, id, email).get('/api/me'));
      expect(me.entitled).toBe(false);
      expect(me.challengePrize).toBeNull();
    }
  });

  it('shows the owner every prize with its status', async () => {
    at(END + 3 * DAY_MS);
    const body = await json(asUser(base, 'o1', 'owner@example.com').get('/api/admin/challenge'));
    const byEmail = Object.fromEntries(body.prizes.map((p: { email: string }) => [p.email, p]));
    expect(body.prizes).toHaveLength(6);
    expect(byEmail['alpha@gmail.com'].grantedAt).not.toBeNull();
    expect(byEmail['third@example.com'].grantedAt).toBeNull(); // has not signed in yet
    expect(byEmail['third@example.com'].notifiedAt).not.toBeNull();
  });
});

describe('a failed prize email is retried', () => {
  it('leaves the prize unnotified when GHL fails, then sends it on the next run', async () => {
    await storage.addChallengePrizes([{ challengeId: CHALLENGE.id, email: 'late@example.com', kind: 'month', rank: 5, handle: 'late' }]);
    ghl.tagGhlContact.mockResolvedValueOnce(false);
    at(END + 4 * DAY_MS);
    expect((await finalizePrizes(Date.now())).notified).toBe(0);
    expect((await finalizePrizes(Date.now())).notified).toBe(1);
  });
});
