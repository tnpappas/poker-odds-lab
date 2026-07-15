// Street-by-street range narrowing.
//
// A real read isn't static: the hands an opponent keeps betting/calling shrink
// as the board runs out. This module reweights a starting range by how likely
// each holding is to continue on a given board, so Hand Replay can show the
// adversary's range tightening street to street — the actual skill the
// range-guess mechanic is meant to train.

import { Card, HandRange, HandRank } from './types.js';
import { cardToInt } from './deck.js';
import { evaluate7Cards } from './hands.js';
import { countOuts } from './heuristics.js';

export type AdversaryStyle = 'passive' | 'balanced' | 'aggressive';

/** Base continue-frequency by made-hand category (before draws & style). */
const MADE_HAND_BASE: Record<HandRank, number> = {
  royal_flush: 1,
  straight_flush: 1,
  four_of_a_kind: 1,
  full_house: 1,
  flush: 0.98,
  straight: 0.96,
  three_of_a_kind: 0.95,
  two_pair: 0.9,
  pair: 0.55,
  high_card: 0.12,
};

const STYLE_AIR: Record<AdversaryStyle, number> = {
  passive: 0.55, // folds air readily
  balanced: 1,
  aggressive: 1.5, // barrels/floats wider
};

/**
 * Probability an opponent continues (bets or calls) with a specific holding on
 * a board, combining made-hand strength and draw strength. Teaching-oriented,
 * not a solver output.
 */
export function continueProbability(
  hole: [Card, Card],
  board: Card[],
  style: AdversaryStyle = 'balanced',
): number {
  if (board.length === 0) return 1;
  const made = evaluate7Cards([...hole, ...board]).rank;
  const base = MADE_HAND_BASE[made];

  // Draw strength: only relevant when not already a strong made hand.
  const outs = countOuts(hole, board).total;
  const drawWeight = Math.min(0.7, outs * 0.06);

  // Combine as independent reasons to continue.
  let p = 1 - (1 - base) * (1 - drawWeight);

  // Style only swings the marginal (air / weak) part of the range.
  if (p < 0.5) p *= STYLE_AIR[style];

  return Math.max(0, Math.min(1, p));
}

export interface NarrowOptions {
  style?: AdversaryStyle;
  /** Drop combos whose weight falls below this after reweighting. */
  minWeight?: number;
}

/**
 * Reweight a range by continue-probability on `board`, dropping combos that
 * collide with the board (dead cards) and folded-out holdings. The returned
 * weights are relative — the equity calculator normalizes by total weight.
 */
export function narrowRange(range: HandRange, board: Card[], opts: NarrowOptions = {}): HandRange {
  const style = opts.style ?? 'balanced';
  const minWeight = opts.minWeight ?? 0.02;
  const dead = new Set(board.map(cardToInt));

  const out: HandRange = [];
  for (const combo of range) {
    const a = cardToInt(combo.cards[0]);
    const b = cardToInt(combo.cards[1]);
    if (dead.has(a) || dead.has(b)) continue; // can't hold a board card
    const cont = continueProbability(combo.cards, board, style);
    const w = combo.weight * cont;
    if (w >= minWeight) out.push({ cards: combo.cards, weight: w });
  }
  return out;
}

/**
 * Narrow a base range across an ordered list of boards (flop, turn, river),
 * each street building on the last. Returns the surviving range after each
 * street plus the fraction of the original range still live — a compact way to
 * drive a "range shrinking" UI.
 */
export function narrowAcrossStreets(
  baseRange: HandRange,
  streetBoards: Card[][],
  opts: NarrowOptions = {},
): { range: HandRange; survival: number }[] {
  const startTotal = baseRange.reduce((s, c) => s + c.weight, 0) || 1;
  const result: { range: HandRange; survival: number }[] = [];
  let current = baseRange;
  for (const board of streetBoards) {
    current = narrowRange(current, board, opts);
    const total = current.reduce((s, c) => s + c.weight, 0);
    result.push({ range: current, survival: total / startTotal });
  }
  return result;
}
