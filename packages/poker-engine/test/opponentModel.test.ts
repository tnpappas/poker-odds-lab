import { describe, it, expect } from 'vitest';
import {
  adversaryStyle,
  preflopStartRange,
  vpipToRange,
  labelToCell,
} from '../src/index.js';

describe('adversaryStyle', () => {
  it('maps aggression and c-bet to a narrowing style', () => {
    expect(adversaryStyle({ af: 1.4, cbetFlop: 0.4 })).toBe('passive');
    expect(adversaryStyle({ af: 2.5, cbetFlop: 0.6 })).toBe('balanced');
    expect(adversaryStyle({ af: 4.2, cbetFlop: 0.85 })).toBe('aggressive');
    expect(adversaryStyle({ af: 2.5, cbetFlop: 0.8 })).toBe('aggressive');
    expect(adversaryStyle({})).toBe('balanced');
  });
});

describe('preflopStartRange', () => {
  const p = { vpip: 0.3, pfr: 0.15 };

  it('raise range sits inside the full range, cell by cell', () => {
    const all = vpipToRange(0.3);
    const raise = vpipToRange(0.15);
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) expect(raise[r][c]).toBeLessThanOrEqual(all[r][c] + 1e-9);
  });

  it('raises when the roll is under PFR / VPIP, and starts from the raise range', () => {
    const s = preflopStartRange(p, () => 0.1);
    expect(s.raised).toBe(true);
    expect(s.matrix).toEqual(vpipToRange(0.15));
  });

  it('a caller has a capped range: no aces when his best hands raise', () => {
    const s = preflopStartRange(p, () => 0.9);
    expect(s.raised).toBe(false);
    const [r, c] = labelToCell('AA');
    expect(s.matrix[r][c]).toBe(0);
    const total = s.matrix.flat().reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });

  it('with no raises recorded he always calls with his whole range', () => {
    const s = preflopStartRange({ vpip: 0.3, pfr: 0 }, () => 0);
    expect(s.raised).toBe(false);
    expect(s.matrix).toEqual(vpipToRange(0.3));
  });
});
