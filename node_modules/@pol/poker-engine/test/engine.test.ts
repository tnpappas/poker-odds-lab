import { describe, it, expect } from 'vitest';
import {
  evaluate7Cards,
  compareHands,
  calculateEquity,
  calculateExactEquity,
  potOdds,
  callEV,
  ruleOf2And4,
  countOuts,
  parseRangeString,
  parseRangeToLabels,
  comboToLabel,
  cellLabel,
  labelToCell,
  rangeToMatrix,
  matrixToRange,
  vpipToRange,
  comboCount,
  cardToInt,
  intToCard,
  Card,
} from '../src/index.js';

// Deterministic RNG for reproducible Monte Carlo assertions.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('deck', () => {
  it('round-trips cards through int representation', () => {
    const cards: Card[] = ['As', 'Kd', '2c', 'Th', '7s'];
    for (const c of cards) expect(intToCard(cardToInt(c))).toBe(c);
  });
});

describe('hand evaluator', () => {
  it('identifies categories correctly', () => {
    expect(evaluate7Cards(['As', 'Ks', 'Qs', 'Js', 'Ts', '2c', '3d']).rank).toBe('royal_flush');
    expect(evaluate7Cards(['9s', '8s', '7s', '6s', '5s', 'Ac', 'Kd']).rank).toBe('straight_flush');
    expect(evaluate7Cards(['As', 'Ad', 'Ah', 'Ac', 'Kd', '2c', '3d']).rank).toBe('four_of_a_kind');
    expect(evaluate7Cards(['As', 'Ad', 'Ah', 'Kc', 'Kd', '2c', '3d']).rank).toBe('full_house');
    expect(evaluate7Cards(['As', 'Js', '9s', '6s', '3s', 'Kc', 'Qd']).rank).toBe('flush');
    expect(evaluate7Cards(['As', 'Kd', 'Qh', 'Jc', 'Ts', '2c', '3d']).rank).toBe('straight');
    expect(evaluate7Cards(['As', 'Ad', 'Ah', 'Kc', 'Qd', '2c', '3d']).rank).toBe('three_of_a_kind');
    expect(evaluate7Cards(['As', 'Ad', 'Kh', 'Kc', 'Qd', '2c', '3d']).rank).toBe('two_pair');
    expect(evaluate7Cards(['As', 'Ad', 'Kh', 'Qc', 'Jd', '2c', '3d']).rank).toBe('pair');
    expect(evaluate7Cards(['As', '9d', 'Kh', 'Qc', 'Jd', '2c', '4d']).rank).toBe('high_card');
  });

  it('handles the wheel (A-2-3-4-5) as a 5-high straight', () => {
    const wheel = evaluate7Cards(['Ad', '2c', '3h', '4s', '5d', 'Kc', 'Qh']);
    expect(wheel.rank).toBe('straight');
    const sixHigh = evaluate7Cards(['2c', '3h', '4s', '5d', '6c', 'Kc', 'Qh']);
    expect(compareHands(sixHigh, wheel)).toBe(1); // 6-high beats wheel
  });

  it('orders hand categories correctly', () => {
    const quads = evaluate7Cards(['As', 'Ad', 'Ah', 'Ac', 'Kd', '2c', '3d']);
    const boat = evaluate7Cards(['As', 'Ad', 'Ah', 'Kc', 'Kd', '2c', '3d']);
    const flush = evaluate7Cards(['As', 'Js', '9s', '6s', '3s', 'Kc', 'Qd']);
    const straight = evaluate7Cards(['As', 'Kd', 'Qh', 'Jc', 'Ts', '2c', '3d']);
    expect(compareHands(quads, boat)).toBe(1);
    expect(compareHands(boat, flush)).toBe(1);
    expect(compareHands(flush, straight)).toBe(1);
  });

  it('breaks ties on kickers', () => {
    const aceKicker = evaluate7Cards(['Ks', 'Kd', 'Ah', '5c', '3d', '2s', '7h']);
    const queenKicker = evaluate7Cards(['Ks', 'Kd', 'Qh', '5c', '3d', '2s', '7h']);
    expect(compareHands(aceKicker, queenKicker)).toBe(1);
  });
});

describe('equity — exact enumeration', () => {
  it('computes a known turn flush-draw spot exactly', () => {
    // Hero has nut flush draw vs set of queens; only clean hearts win on the river.
    const res = calculateExactEquity(
      ['Ah', 'Kh'],
      ['Qs', 'Qd'],
      ['Qh', '7h', '2c', '9d'],
    );
    // 7 clean hearts out of 44 unseen cards win (2h/9h pair the board -> adversary boat).
    expect(res.equity).toBeCloseTo(7 / 44, 5);
  });

  it('a dominating pair beats a lower pair preflop (sampled)', () => {
    const rng = mulberry32(42);
    const res = calculateEquity(['As', 'Ad'], [{ cards: ['Ks', 'Kd'], weight: 1 }], [], 60000, rng);
    expect(res.equity).toBeGreaterThan(0.79);
    expect(res.equity).toBeLessThan(0.84);
  });
});

describe('equity — Monte Carlo', () => {
  it('AA vs a random hand is ~85%', () => {
    const rng = mulberry32(7);
    const res = calculateEquity(['As', 'Ad'], 'random', [], 40000, rng);
    expect(res.equity).toBeGreaterThan(0.83);
    expect(res.equity).toBeLessThan(0.87);
  });

  it('72o vs a random hand is a clear underdog', () => {
    const rng = mulberry32(11);
    const res = calculateEquity(['7s', '2d'], 'random', [], 40000, rng);
    expect(res.equity).toBeGreaterThan(0.28);
    expect(res.equity).toBeLessThan(0.37);
  });

  it('equity vs a tight range is lower than vs random', () => {
    const rng1 = mulberry32(3);
    const rng2 = mulberry32(3);
    const tight = parseRangeString('AA,KK,QQ,AKs');
    const vsTight = calculateEquity(['Js', 'Jd'], tight, [], 30000, rng1).equity;
    const vsRandom = calculateEquity(['Js', 'Jd'], 'random', [], 30000, rng2).equity;
    expect(vsTight).toBeLessThan(vsRandom);
  });
});

describe('heuristics', () => {
  it('pot odds', () => {
    expect(potOdds(100, 50)).toBeCloseTo(0.25, 5);
    expect(potOdds(142, 71)).toBeCloseTo(0.25, 5);
    expect(potOdds(100, 100)).toBeCloseTo(1 / 3, 5);
  });

  it('call EV', () => {
    expect(callEV(0.5, 100, 50)).toBeCloseTo(25, 5);
    expect(callEV(0.25, 150, 50)).toBeCloseTo(0, 5); // break-even
    expect(callEV(0.1, 100, 50)).toBeLessThan(0);
  });

  it('rule of 2 and 4', () => {
    const turn = ruleOf2And4(9, 'turn');
    expect(turn.exact).toBeCloseTo(9 / 46, 4);
    expect(turn.heuristic).toBeCloseTo(0.18, 4);

    const flop = ruleOf2And4(9, 'flop');
    expect(flop.exact).toBeCloseTo(0.3497, 3);
    expect(flop.heuristic).toBeCloseTo(0.36, 4);
  });

  it('counts a flush draw', () => {
    const outs = countOuts(['Ah', 'Kh'], ['Qh', '7h', '2c']);
    expect(outs.flushDraw).toBe(9);
  });

  it('counts an open-ended straight draw', () => {
    const outs = countOuts(['9d', '8c'], ['7h', '6s', '2c']);
    expect(outs.straightDraw).toBe(8);
  });
});

describe('ranges', () => {
  it('labels grid cells correctly', () => {
    expect(cellLabel(0, 0)).toBe('AA');
    expect(cellLabel(0, 1)).toBe('AKs');
    expect(cellLabel(1, 0)).toBe('AKo');
    expect(cellLabel(12, 12)).toBe('22');
  });

  it('round-trips label <-> cell', () => {
    for (const lbl of ['AA', 'AKs', 'AKo', 'T9s', '72o', '22']) {
      const [r, c] = labelToCell(lbl);
      expect(cellLabel(r, c)).toBe(lbl);
    }
  });

  it('derives the label for a concrete combo', () => {
    expect(comboToLabel(['As', 'Ks'])).toBe('AKs');
    expect(comboToLabel(['Ah', 'Kd'])).toBe('AKo');
    expect(comboToLabel(['Qs', 'Qd'])).toBe('QQ');
  });

  it('counts combos', () => {
    expect(comboCount('AA')).toBe(6);
    expect(comboCount('AKs')).toBe(4);
    expect(comboCount('AKo')).toBe(12);
  });

  it('expands a single hand into its combos', () => {
    expect(parseRangeString('AA')).toHaveLength(6);
    expect(parseRangeString('AKs')).toHaveLength(4);
    expect(parseRangeString('AKo')).toHaveLength(12);
  });

  it('parses plus and span notation', () => {
    expect(parseRangeToLabels('JJ+').sort()).toEqual(['AA', 'JJ', 'KK', 'QQ']);
    expect(parseRangeToLabels('AQs-ATs').sort()).toEqual(['AJs', 'AQs', 'ATs']);
    const a2plus = parseRangeToLabels('A2s+');
    expect(a2plus).toContain('A2s');
    expect(a2plus).toContain('AKs');
    expect(a2plus).toHaveLength(12);
  });

  it('round-trips range <-> matrix', () => {
    const range = parseRangeString('AA,KK,AKs');
    const matrix = rangeToMatrix(range);
    const [aaR, aaC] = labelToCell('AA');
    expect(matrix[aaR][aaC]).toBe(1);
    const back = matrixToRange(matrix);
    expect(back.filter((c) => comboToLabel(c.cards) === 'AA')).toHaveLength(6);
  });

  it('vpip -> range includes premiums and excludes trash', () => {
    const tight = vpipToRange(0.15, 'CO');
    const [aaR, aaC] = labelToCell('AA');
    const [trashR, trashC] = labelToCell('72o');
    expect(tight[aaR][aaC]).toBeGreaterThan(0);
    expect(tight[trashR][trashC]).toBe(0);
  });
});
