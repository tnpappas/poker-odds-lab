import { describe, it, expect } from 'vitest';
import {
  icmEquities,
  bubbleFactor,
  shoveEV,
  nashShoveRange,
  shouldShove,
  narrowRange,
  narrowAcrossStreets,
  continueProbability,
  matrixToRange,
  parseRangeString,
  newDrillCard,
  reviewDrill,
  syncDrillCards,
  buildDrillQueue,
  isDue,
  type HandRange,
} from '../src/index.js';

describe('ICM', () => {
  it('winner-take-all reduces to chip proportion', () => {
    const eq = icmEquities([60, 40], [100, 0]);
    expect(eq[0]).toBeCloseTo(60, 5);
    expect(eq[1]).toBeCloseTo(40, 5);
  });

  it('equities sum to total awardable prize money', () => {
    const stacks = [5000, 3000, 2000];
    const payouts = [50, 30, 20];
    const eq = icmEquities(stacks, payouts);
    expect(eq.reduce((s, x) => s + x, 0)).toBeCloseTo(100, 4);
  });

  it('bigger stack has more $ equity, but less than its chip share (ICM tax)', () => {
    const stacks = [8000, 1000, 1000];
    const payouts = [50, 30, 20];
    const eq = icmEquities(stacks, payouts);
    expect(eq[0]).toBeGreaterThan(eq[1]);
    // chip-chip would give the leader 80% of the money; ICM must be less.
    expect(eq[0]).toBeLessThan(80);
  });

  it('bubble factor exceeds 1 when short stacks are near the money', () => {
    // Hero (chip leader) vs a covered opponent, one spot from the money.
    const stacks = [5000, 3000, 2000, 1000];
    const payouts = [50, 30, 20]; // 3 paid, 4 left = bubble
    const bf = bubbleFactor(stacks, payouts, 0, 1);
    expect(bf.factor).toBeGreaterThan(1);
    expect(bf.riskDelta).toBeGreaterThan(0);
  });
});

describe('push/fold', () => {
  it('shorter stacks shove a wider range', () => {
    const wide = matrixToRange(nashShoveRange(4)).length;
    const tight = matrixToRange(nashShoveRange(20)).length;
    expect(wide).toBeGreaterThan(tight);
  });

  it('premium hands shove at any depth; junk only enters the range when short', () => {
    expect(shouldShove('AA', 20)).toBe(true);
    expect(shouldShove('72o', 20)).toBe(false); // fold the worst hand deep
    // At 2bb the range is nearly every hand: a weak-but-not-worst hand is now a shove.
    expect(shouldShove('T2o', 2)).toBe(true);
    const at2 = matrixToRange(nashShoveRange(2)).length;
    const at6 = matrixToRange(nashShoveRange(6)).length;
    expect(at2).toBeGreaterThan(at6);
  });

  it('shoving AA is hugely +EV against a calling range', () => {
    const callRange = nashShoveRange(10); // some reasonable calling range
    const { ev, equityWhenCalled } = shoveEV(['As', 'Ah'], 10, callRange, 0.4, 1.5, 3000);
    expect(equityWhenCalled).toBeGreaterThan(0.7);
    expect(ev).toBeGreaterThan(0);
  });
});

describe('range narrowing', () => {
  it('drops combos that collide with the board (dead cards)', () => {
    const range = parseRangeString('AA');
    const narrowed = narrowRange(range, ['As', 'Kd', 'Qc']);
    // Combos containing the As can't exist; some AA combos survive.
    expect(narrowed.every((c) => c.cards[0] !== 'As' && c.cards[1] !== 'As')).toBe(true);
    expect(narrowed.length).toBeGreaterThan(0);
    expect(narrowed.length).toBeLessThan(range.length);
  });

  it('a made set continues far more often than air', () => {
    const setP = continueProbability(['7c', '7d'], ['7h', 'Kd', '2s']);
    const airP = continueProbability(['4c', '9d'], ['7h', 'Kd', '2s']);
    expect(setP).toBeGreaterThan(0.9);
    expect(airP).toBeLessThan(setP);
  });

  it('range survival shrinks street by street', () => {
    const range: HandRange = parseRangeString('22+,A2s+,KTs+,QJs,AJo+');
    const steps = narrowAcrossStreets(range, [
      ['2h', '7d', 'Ks'],
      ['2h', '7d', 'Ks', '3c'],
    ]);
    expect(steps).toHaveLength(2);
    expect(steps[0].survival).toBeLessThanOrEqual(1);
    expect(steps[1].survival).toBeLessThanOrEqual(steps[0].survival);
  });
});

describe('drill scheduler', () => {
  it('a new card is due immediately', () => {
    const now = 1_000_000;
    const card = newDrillCard('calling_too_wide', 0.8, now);
    expect(isDue(card, now)).toBe(true);
  });

  it('passing pushes the next review out; failing brings it back soon', () => {
    const now = 1_000_000;
    const card = newDrillCard('missing_value', 0.5, now);
    const passed = reviewDrill(card, 3, now);
    expect(passed.dueTs).toBeGreaterThan(now + 12 * 3600_000); // > ~half a day out
    expect(passed.reps).toBe(1);

    const failed = reviewDrill(card, 0, now);
    expect(failed.dueTs).toBeLessThan(now + 3600_000); // within the hour
    expect(failed.lapses).toBe(1);
  });

  it('sync keeps progress on persistent leaks and retires fixed ones', () => {
    const now = 1_000_000;
    let cards = syncDrillCards([{ leak: 'weak_reads', severity: 0.6 }], [], now);
    cards = cards.map((c) => reviewDrill(c, 3, now));
    // Re-detect the same leak: progress (reps) is preserved.
    const again = syncDrillCards([{ leak: 'weak_reads', severity: 0.6 }], cards, now);
    expect(again[0].reps).toBe(1);
    // Leak no longer detected -> no card.
    const cleared = syncDrillCards([], cards, now);
    expect(cleared).toHaveLength(0);
  });

  it('queue surfaces due cards, most severe first', () => {
    const now = 2_000_000;
    const cards = [
      newDrillCard('calling_too_wide', 0.3, now),
      newDrillCard('folding_to_aggression', 0.9, now),
    ];
    const q = buildDrillQueue(cards, now);
    expect(q[0].leak).toBe('folding_to_aggression');
  });
});
