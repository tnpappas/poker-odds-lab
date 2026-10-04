import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

const ghl = vi.hoisted(() => ({ tagGhlContact: vi.fn(async (_email: string, _tag: string) => true) }));
vi.mock('../src/lib/ghl', () => ({ ghlConfigured: true, tagGhlCustomer: vi.fn(async () => undefined), ...ghl }));

import { startServer, asUser, json } from './helpers';
import { CHALLENGE, SPOTS } from '../src/challenge/spots';
import { dayWindow, dayStatus, leaderboard } from '../src/challenge/scoring';
import type { ChallengeAnswer } from '../src/storage/types';

let base: string;
let close: () => Promise<void>;
beforeAll(async () => ({ base, close } = await startServer()));
afterAll(() => close());
afterEach(() => vi.useRealTimers());

/** Freeze Date.now() (only Date, so the HTTP server keeps working). */
const at = (ms: number) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(ms);
};
const post = (path: string, body: unknown) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const answer = (over: Record<string, unknown> = {}) => ({
  email: 'Player@Example.com', handle: 'river_rat', day: 1, action: 'call', equityGuess: 45, ...over,
});

describe('challenge schedule', () => {
  it('day 1 opens at 7pm ET Oct 19 and each day lasts 24 hours', () => {
    expect(new Date(dayWindow(1).opensAt).toISOString()).toBe('2026-10-19T23:00:00.000Z');
    expect(dayWindow(2).opensAt).toBe(dayWindow(1).closesAt);
    expect(dayStatus(1, dayWindow(1).opensAt - 1)).toBe('upcoming');
    expect(dayStatus(1, dayWindow(1).opensAt)).toBe('open');
    expect(dayStatus(1, dayWindow(1).closesAt)).toBe('revealed');
  });
});

describe('public challenge API', () => {
  it('needs no account and hides spots before they open', async () => {
    at(dayWindow(1).opensAt - 1000);
    const res = await fetch(base + '/api/challenge');
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.days).toHaveLength(7);
    expect(body.days[0].status).toBe('upcoming');
    expect(body.days[0].spot).toBeUndefined();
  });

  it('shows an open spot without its answer', async () => {
    at(dayWindow(1).opensAt + 1000);
    const body = await json(fetch(base + '/api/challenge'));
    expect(body.days[0].status).toBe('open');
    expect(body.days[0].spot.hero).toEqual(SPOTS[0].hero);
    expect(body.days[0].reveal).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(SPOTS[0].rangeText);
    expect(body.days[1].spot).toBeUndefined();
  });

  it('rejects answers before a day opens', async () => {
    at(dayWindow(2).opensAt - 1000);
    const res = await post('/api/challenge/answer', answer({ day: 2 }));
    expect(res.status).toBe(409);
  });

  it('accepts one answer per email per day and tags the contact in GHL', async () => {
    at(dayWindow(1).opensAt + 1000);
    const first = await post('/api/challenge/answer', answer());
    expect(first.status).toBe(201);
    expect(ghl.tagGhlContact).toHaveBeenCalledWith('player@example.com', 'live-read-challenge');
    const again = await post('/api/challenge/answer', answer({ email: 'player@example.com', action: 'fold' }));
    expect(again.status).toBe(409);
  });

  it('validates the body', async () => {
    at(dayWindow(1).opensAt + 1000);
    expect((await post('/api/challenge/answer', answer({ email: 'nope' }))).status).toBe(400);
    expect((await post('/api/challenge/answer', answer({ action: 'raise' }))).status).toBe(400);
    expect((await post('/api/challenge/answer', answer({ equityGuess: 101 }))).status).toBe(400);
    expect((await post('/api/challenge/answer', answer({ handle: '<script>' }))).status).toBe(400);
  });

  it('closes a day and reveals the answer after 24 hours, with a leaderboard and no emails', async () => {
    at(dayWindow(1).opensAt + 2000);
    await post('/api/challenge/answer', answer({ email: 'b@example.com', handle: 'folder', action: 'fold', equityGuess: 20 }));
    at(dayWindow(1).closesAt + 1000);
    expect((await post('/api/challenge/answer', answer({ email: 'late@example.com' }))).status).toBe(409);
    const body = await json(fetch(base + '/api/challenge'));
    expect(body.days[0].status).toBe('revealed');
    expect(body.days[0].reveal.correct).toBe(SPOTS[0].correct);
    expect(body.days[0].reveal.entries).toBe(2);
    expect(body.leaderboard[0].handle).toBe('river_rat');
    expect(body.leaderboard[0].points).toBe(1);
    expect(JSON.stringify(body)).not.toContain('@example.com');
  });

  it('signup tags the email in GHL', async () => {
    ghl.tagGhlContact.mockClear();
    const res = await post('/api/challenge/signup', { email: 'early@example.com' });
    expect(res.status).toBe(200);
    expect(ghl.tagGhlContact).toHaveBeenCalledWith('early@example.com', 'live-read-challenge');
  });

  it('signup reports a failure instead of losing the email', async () => {
    ghl.tagGhlContact.mockResolvedValueOnce(false);
    const res = await post('/api/challenge/signup', { email: 'lost@example.com' });
    expect(res.status).toBe(503);
  });

  it('treats Gmail dot and plus aliases as the same entrant', async () => {
    at(dayWindow(3).opensAt + 1000);
    expect((await post('/api/challenge/answer', answer({ email: 'joe.smith@gmail.com', day: 3 }))).status).toBe(201);
    expect((await post('/api/challenge/answer', answer({ email: 'JoeSmith+2@googlemail.com', day: 3 }))).status).toBe(409);
  });
});

describe('challenge admin', () => {
  it('is owner only', async () => {
    expect((await asUser(base, 'u1', 'someone@example.com').get('/api/admin/challenge')).status).toBe(403);
    const res = await asUser(base, 'o1', 'owner@example.com').get('/api/admin/challenge');
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.spots[0].correct).toBe(SPOTS[0].correct);
    // Every test entry comes from 127.0.0.1, so entrants are flagged as sharing an IP.
    const row = body.leaderboard.find((r: { email: string }) => r.email === 'player@example.com');
    expect(row.sharedIpWith).toContain('b@example.com');
  });
});

describe('scoring', () => {
  const a = (email: string, day: number, action: 'call' | 'fold', equityGuess: number, createdAt: string): ChallengeAnswer => ({
    id: `${email}${day}`, challengeId: CHALLENGE.id, email, handle: email, day, action, equityGuess, ipHash: null, createdAt,
  });
  const afterAll7 = dayWindow(7).closesAt;
  const right = (d: number) => SPOTS[d - 1].correct;
  const wrong = (d: number) => (SPOTS[d - 1].correct === 'call' ? 'fold' : 'call');

  it('day 7 is worth double', () => {
    const rows = leaderboard([a('x', 7, right(7), 27, '1')], afterAll7);
    expect(rows[0].points).toBe(2);
  });

  it('breaks ties on total equity error, counting a skipped day as 100', () => {
    const answers = [
      a('close', 1, right(1), SPOTS[0].equityPct, '2'),
      a('close', 2, wrong(2), SPOTS[1].equityPct, '2'),
      a('far', 1, right(1), 0, '1'),
      a('far', 2, wrong(2), 0, '1'),
    ];
    const rows = leaderboard(answers, afterAll7);
    expect(rows.map((r) => r.email)).toEqual(['close', 'far']);
    expect(rows[0].points).toBe(1);
    expect(rows[0].totalError).toBe(500); // five skipped days
  });
});
