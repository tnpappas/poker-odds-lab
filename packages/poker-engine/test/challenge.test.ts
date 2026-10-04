import { describe, it, expect } from 'vitest';
import { parseRangeString, calculateExactEquity, potOdds, type Card } from '../src/index.js';
import { SPOTS, CHALLENGE } from '../../../apps/api/src/challenge/spots';

/**
 * Every number shown in the Live Read Challenge must be real. This recomputes
 * each spot's equity and break-even price with the engine and checks the
 * stored values and the stored correct answer.
 */
function rangeEquity(hero: [Card, Card], board: Card[], range: string, extra: [Card, Card][]): number {
  const dead = new Set<string>([...hero, ...board]);
  const combos = [...parseRangeString(range).map((c) => c.cards), ...extra].filter(
    ([a, b]) => !dead.has(a) && !dead.has(b),
  );
  let total = 0;
  for (const c of combos) total += calculateExactEquity(hero, c, board).equity;
  return total / combos.length;
}

describe('Live Read Challenge spots', () => {
  it('has one spot per day, in order', () => {
    expect(SPOTS.map((s) => s.day)).toEqual(Array.from({ length: CHALLENGE.days }, (_, i) => i + 1));
  });

  for (const s of SPOTS) {
    it(`day ${s.day}: stored equity, price and answer match the engine`, () => {
      const hero = s.hero as [Card, Card];
      const board = s.board as Card[];
      const all = [...hero, ...board];
      expect(new Set(all).size).toBe(all.length);

      const eq = rangeEquity(hero, board, s.range, s.extraCombos as [Card, Card][]) * 100;
      const req = potOdds(s.pot, s.bet) * 100;
      expect(Math.abs(eq - s.equityPct)).toBeLessThan(0.05);
      expect(Math.abs(req - s.requiredPct)).toBeLessThan(0.05);
      expect(s.correct).toBe(eq >= req ? 'call' : 'fold');
      // Keep every answer clear enough to defend in public.
      expect(Math.abs(eq - req)).toBeGreaterThan(5);
    });
  }
});
