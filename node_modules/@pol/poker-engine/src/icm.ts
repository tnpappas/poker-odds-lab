// Tournament math: ICM equity, bubble factor (risk premium), and push/fold.
//
// The chip evaluator elsewhere in the engine answers "am I ahead?"; this module
// answers "what is a chip worth right now?" — the question that actually drives
// short-stack and bubble decisions, and the one no free calculator teaches well.

import { Card, HandMatrix, Position } from './types.js';
import { calculateEquity } from './equity.js';
import { matrixToRange, vpipToRange, labelToCell } from './ranges.js';

/**
 * Malmuth-Harville ICM: convert chip stacks into real-money ($/prize) equity.
 *
 * Each player's probability of finishing in a given place is proportional to
 * their share of the chips still in play at that point. We walk the prize
 * ladder, assigning finishing positions recursively. Cost is bounded by the
 * number of paid places, so realistic fields (<= ~9 players, few prizes) are
 * instant.
 *
 * @param stacks  Chip stacks, one per player.
 * @param payouts Prize for 1st, 2nd, ... (money or %). Extra prizes past the
 *                player count are ignored; missing places pay 0.
 * @returns       $ equity per player, same order as `stacks`. Sums to the total
 *                prize money that can actually be awarded.
 */
export function icmEquities(stacks: number[], payouts: number[]): number[] {
  const n = stacks.length;
  const eq = new Array<number>(n).fill(0);
  const places = Math.min(payouts.length, n);
  if (places === 0) return eq;

  const taken = new Array<boolean>(n).fill(false);

  const recurse = (depth: number, prob: number, remainingChips: number) => {
    if (depth >= places || prob <= 0) return;
    const prize = payouts[depth] ?? 0;
    for (let i = 0; i < n; i++) {
      if (taken[i] || stacks[i] <= 0) continue;
      const pFinishHere = prob * (stacks[i] / remainingChips);
      if (prize) eq[i] += pFinishHere * prize;
      taken[i] = true;
      recurse(depth + 1, pFinishHere, remainingChips - stacks[i]);
      taken[i] = false;
    }
  };

  const total = stacks.reduce((s, x) => s + Math.max(0, x), 0);
  if (total <= 0) return eq;
  recurse(0, 1, total);
  return eq;
}

export interface BubbleFactor {
  /** Risk premium: how many chips of reward it takes to justify risking one chip. >1 = play tighter. */
  factor: number;
  /** $ gained by winning the confrontation. */
  rewardDelta: number;
  /** $ lost by losing it. */
  riskDelta: number;
}

/**
 * Bubble factor for a hero-vs-opponent all-in — the core "why can't I just call
 * with the best hand?" tournament lesson.
 *
 * Compares hero's ICM equity if the confrontation is won vs lost (for the
 * smaller of the two stacks). A factor of 1.4 means losing a chip hurts 1.4x as
 * much as winning one helps, so hero needs materially more than 50% to call off.
 */
export function bubbleFactor(
  stacks: number[],
  payouts: number[],
  heroIndex: number,
  opponentIndex: number,
): BubbleFactor {
  const at = Math.min(stacks[heroIndex], stacks[opponentIndex]);
  const cur = icmEquities(stacks, payouts)[heroIndex];

  const won = stacks.slice();
  won[heroIndex] += at;
  won[opponentIndex] -= at;
  const winEq = icmEquities(won, payouts)[heroIndex];

  const lost = stacks.slice();
  lost[heroIndex] -= at;
  lost[opponentIndex] += at;
  const loseEq = icmEquities(lost, payouts)[heroIndex];

  const rewardDelta = winEq - cur;
  const riskDelta = cur - loseEq;
  const factor = rewardDelta > 0 ? riskDelta / rewardDelta : Infinity;
  return { factor, rewardDelta, riskDelta };
}

/**
 * Chip EV of open-shoving `effectiveStackBB` big blinds, vs folding (EV 0).
 *
 * @param hero          Hero's two cards.
 * @param effectiveStackBB Shove size in big blinds.
 * @param callRange     Range the opponent(s) call the shove with.
 * @param callProbability Probability the shove gets called (fold equity = 1 - this).
 * @param deadMoneyBB   Blinds + antes already in the pot, in BB (default 1.5).
 */
export function shoveEV(
  hero: [Card, Card],
  effectiveStackBB: number,
  callRange: HandMatrix,
  callProbability: number,
  deadMoneyBB = 1.5,
  simulations = 8000,
): { ev: number; equityWhenCalled: number; foldEquity: number } {
  const range = matrixToRange(callRange);
  const equity = range.length ? calculateEquity(hero, range, [], simulations).equity : 1;
  const foldEquity = 1 - callProbability;
  const evFold = foldEquity * deadMoneyBB;
  const evCalled =
    callProbability * (equity * (effectiveStackBB + deadMoneyBB) - (1 - equity) * effectiveStackBB);
  return { ev: evFold + evCalled, equityWhenCalled: equity, foldEquity };
}

/**
 * Heuristic Nash-style open-shove range as a share of hands, by effective stack.
 * Shorter stacks shove wider; fewer players left to act widens further. Built on
 * the same strength ordering the rest of the engine uses, so it stays consistent
 * with the visualizer and adversary modeling rather than being a separate chart.
 */
export function nashShoveRange(effectiveStackBB: number, playersToAct = 1, position: Position = 'SB'): HandMatrix {
  // Anchor points (bb -> fraction of all hands to shove), interpolated.
  const anchors: [number, number][] = [
    [2, 1.0],
    [4, 0.62],
    [6, 0.45],
    [8, 0.34],
    [10, 0.27],
    [13, 0.19],
    [16, 0.13],
    [20, 0.085],
    [25, 0.05],
  ];
  const bb = Math.max(1, effectiveStackBB);
  let frac: number;
  if (bb <= anchors[0][0]) frac = anchors[0][1];
  else if (bb >= anchors[anchors.length - 1][0]) frac = anchors[anchors.length - 1][1];
  else {
    frac = anchors[anchors.length - 1][1];
    for (let i = 1; i < anchors.length; i++) {
      if (bb <= anchors[i][0]) {
        const [x0, y0] = anchors[i - 1];
        const [x1, y1] = anchors[i];
        frac = y0 + ((y1 - y0) * (bb - x0)) / (x1 - x0);
        break;
      }
    }
  }
  // More players still to act = someone is more likely to wake up with a hand.
  const widen = Math.pow(0.82, Math.max(0, playersToAct - 1));
  frac = Math.max(0.02, Math.min(1, frac * widen));
  return vpipToRange(frac, position);
}

/** Convenience: does the Nash shove range include this starting hand at this stack? */
export function shouldShove(handLabel: string, effectiveStackBB: number, playersToAct = 1): boolean {
  const m = nashShoveRange(effectiveStackBB, playersToAct);
  const [r, c] = labelToCell(handLabel);
  return (m[r]?.[c] ?? 0) > 0;
}
