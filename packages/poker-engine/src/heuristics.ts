import { Card, HeuristicResult, OutsResult } from './types.js';
import { cardToInt } from './deck.js';

/**
 * Required equity to profitably call.
 *
 * @param potSize  Pot size BEFORE adversary's bet.
 * @param betSize  Adversary's bet (= amount you must call).
 * @returns        Break-even equity, 0..1.
 *
 * Example: pot $100, bet $50 -> 50 / (100 + 50 + 50) = 0.25 (25%).
 */
export function potOdds(potSize: number, betSize: number): number {
  if (betSize <= 0) return 0;
  return betSize / (potSize + 2 * betSize);
}

/**
 * Expected value of a call.
 *
 * @param equity     Hero win probability, 0..1.
 * @param potSize    Pot you would win — the current pot INCLUDING adversary's bet.
 * @param callAmount Amount you must put in to call.
 * @param impliedOdds Extra chips expected to win on later streets when you hit.
 * @returns          EV in chips. Positive = profitable call.
 */
export function callEV(
  equity: number,
  potSize: number,
  callAmount: number,
  impliedOdds = 0,
): number {
  return equity * (potSize + impliedOdds) - (1 - equity) * callAmount;
}

const C = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
};

/**
 * Rule of 2 and 4: multiply outs by 2 (one card to come) or 4 (two cards).
 * Returns the heuristic alongside the exact combinatorial equity and the error.
 *
 * @param street 'flop' = two cards to come (47 unseen), 'turn' = one card (46 unseen).
 */
export function ruleOf2And4(outs: number, street: 'flop' | 'turn'): HeuristicResult {
  let exact: number;
  let heuristic: number;
  if (street === 'flop') {
    const unseen = 47;
    exact = 1 - C(unseen - outs, 2) / C(unseen, 2);
    heuristic = (outs * 4) / 100;
  } else {
    const unseen = 46;
    exact = outs / unseen;
    heuristic = (outs * 2) / 100;
  }
  return { exact, heuristic, error: heuristic - exact };
}

/**
 * Heuristic out-counter for the common draw types hero holds.
 * Approximate by design (used for teaching/explanation, not exact equity).
 */
export function countOuts(heroHand: [Card, Card], board: Card[]): OutsResult {
  const hero = heroHand.map(cardToInt);
  const boardI = board.map(cardToInt);
  const all = [...hero, ...boardI];
  const draws: string[] = [];

  // Suit counts (for flush draws) — only meaningful when hero contributes.
  const suitCount = [0, 0, 0, 0];
  const heroSuit = [0, 0, 0, 0];
  for (const c of all) suitCount[c & 3]++;
  for (const c of hero) heroSuit[c & 3]++;
  let flushDraw = 0;
  for (let s = 0; s < 4; s++) {
    if (suitCount[s] === 4 && heroSuit[s] >= 1) {
      flushDraw = 9;
      draws.push('Flush draw (9 outs)');
    }
  }

  // Straight draws: enumerate all 10 five-rank straight windows. A window with
  // exactly 4 of its 5 ranks present is completable by the one missing rank.
  // The number of DISTINCT completing ranks decides outs: 2+ ranks (open-ended
  // or double-gutshot) = 8 outs, 1 rank (gutshot) = 4 outs.
  let rankMask = 0;
  for (const c of all) rankMask |= 1 << (c >> 2);

  const windows: number[][] = [[12, 0, 1, 2, 3]]; // wheel: A-2-3-4-5
  for (let hi = 4; hi <= 12; hi++) windows.push([hi, hi - 1, hi - 2, hi - 3, hi - 4]);

  let madeStraight = false;
  const completingRanks = new Set<number>();
  for (const w of windows) {
    let present = 0;
    let missing = -1;
    for (const r of w) {
      if (rankMask & (1 << r)) present++;
      else missing = r;
    }
    if (present === 5) madeStraight = true;
    else if (present === 4) completingRanks.add(missing);
  }

  let straightDraw = 0;
  if (!madeStraight && completingRanks.size >= 2) {
    straightDraw = 8;
    draws.push('Open-ended straight draw (8 outs)');
  } else if (!madeStraight && completingRanks.size === 1) {
    straightDraw = 4;
    draws.push('Gutshot straight draw (4 outs)');
  }

  // Overcards: hero cards strictly above the top board card, unpaired.
  let overcards = 0;
  if (boardI.length > 0) {
    let topBoard = -1;
    for (const c of boardI) topBoard = Math.max(topBoard, c >> 2);
    const boardRanks = new Set(boardI.map((c) => c >> 2));
    const heroRanks = hero.map((c) => c >> 2);
    const paired = heroRanks[0] === heroRanks[1];
    if (!paired) {
      for (const hr of heroRanks) {
        if (hr > topBoard && !boardRanks.has(hr)) overcards += 3;
      }
    }
    if (overcards > 0) draws.push(`${overcards / 3} overcard(s) (${overcards} outs)`);
  }

  // De-duplicate: flush + straight outs can overlap. Conservatively subtract
  // a small overlap when both draws are present.
  let total = flushDraw + straightDraw + overcards;
  if (flushDraw && straightDraw) total -= 2; // typical shared outs between FD + OESD/gutshot

  return { flushDraw, straightDraw, overcards, total: Math.max(total, 0), draws };
}
