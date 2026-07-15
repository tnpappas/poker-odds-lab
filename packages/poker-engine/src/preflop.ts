import { Card, Rank } from './types.js';
import { calculateEquity } from './equity.js';
import { cellLabel, expandLabel } from './ranges.js';

/** A concrete representative combo for a label (e.g. 'AKs' -> ['As','Ks']). */
export function representativeCombo(label: string): [Card, Card] {
  return expandLabel(label)[0];
}

/** All 169 starting-hand labels. */
export function allHandLabels(): string[] {
  const labels: string[] = [];
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      labels.push(cellLabel(r, c));
    }
  }
  return [...new Set(labels)];
}

/**
 * Compute equity-vs-a-random-hand for every starting hand category.
 * Used to color the Preflop Equity Visualizer. Compute once and cache.
 *
 * @param simsPerHand Monte Carlo samples per hand (default balances speed/accuracy).
 */
export function computePreflopEquityTable(
  simsPerHand = 12000,
  rng: () => number = Math.random,
): Record<string, number> {
  const table: Record<string, number> = {};
  for (const label of allHandLabels()) {
    const hero = representativeCombo(label);
    const { equity } = calculateEquity(hero, 'random', [], simsPerHand, rng);
    table[label] = Math.round(equity * 1000) / 1000;
  }
  return table;
}

/**
 * A small seed table of well-known preflop equities vs a random hand, for an
 * instant first paint before the full Monte Carlo table is computed.
 */
export const PREFLOP_EQUITY_SEED: Record<string, number> = {
  AA: 0.852, KK: 0.824, QQ: 0.799, JJ: 0.775, TT: 0.751,
  AKs: 0.67, AQs: 0.661, AKo: 0.653, AJs: 0.653, AQo: 0.644,
  99: 0.721, 88: 0.691, 77: 0.663, 66: 0.633, 55: 0.604,
  44: 0.569, 33: 0.535, 22: 0.503,
  '72o': 0.323, '32o': 0.318, '32s': 0.346,
};
