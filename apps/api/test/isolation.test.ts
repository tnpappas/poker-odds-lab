import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, asUser, json } from './helpers';

let base: string;
let close: () => Promise<void>;

beforeAll(async () => ({ base, close } = await startServer()));
afterAll(() => close());

const adversary = { name: 'Villain', vpip: 0.3, pfr: 0.2, cbetFlop: 0.6, cbetTurn: 0.4, foldTo3bet: 0.5, af: 2, wtsd: 0.3 };

describe('tenant isolation: user B cannot read, change or delete user A data', () => {
  it('adversaries', async () => {
    const a = asUser(base, 'iso-a');
    const b = asUser(base, 'iso-b');
    const created = await json(a.post('/api/adversaries', adversary));

    const listB = await json(b.get('/api/adversaries'));
    expect(listB).toEqual([]);

    const patch = await fetch(`${base}/api/adversaries/${created.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-id': 'iso-b' }, body: JSON.stringify({ name: 'Hijacked' }),
    });
    expect(patch.status).toBe(404);

    const del = await b.del(`/api/adversaries/${created.id}`);
    expect(del.status).toBe(404);

    const stillThere = await json(a.get('/api/adversaries'));
    expect(stillThere[0].name).toBe('Villain');
  });

  it('sessions and decisions', async () => {
    const a = asUser(base, 'iso-a');
    const b = asUser(base, 'iso-b');
    const session = await json(a.post('/api/sessions', { mode: 'hand_replay' }));
    await a.post('/api/decisions', { street: 'flop', decisionType: 'pot_odds', userAction: 'call', correctAction: 'call' });

    const patch = await fetch(`${base}/api/sessions/${session.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-id': 'iso-b' }, body: JSON.stringify({ handsPlayed: 99 }),
    });
    expect(patch.status).toBe(404);

    const bDecisions = await json(b.get('/api/decisions'));
    expect(bDecisions).toEqual([]);
    const aSummary = await json(a.get('/api/decisions/summary'));
    expect(aSummary.totalDecisions).toBe(1);
  });

  it('a user cannot promote themselves by posting a plan', async () => {
    const a = asUser(base, 'iso-c', 'c@example.com');
    // No route accepts a plan from a non-owner; the only writer is the webhook/admin.
    const res = await a.post('/api/me', { plan: 'pro' });
    expect([404, 405]).toContain(res.status);
    const me = await json(a.get('/api/me'));
    expect(me.plan).toBe('free');
  });
});
