import { Card, EvaluatedHand, HandRank, RANKS } from './types.js';
import { cardToInt } from './deck.js';

// Hand evaluation operates on integer cards (0..51): rank = int >> 2, suit = int & 3.
//
// evaluate7Ints returns a single comparable integer score (higher = better).
// Encoding: category (0..8) in the top nibble, then up to 5 tiebreaker ranks
// (each 0..12) packed into 4-bit fields. This makes hand comparison a single
// integer compare and keeps the Monte Carlo loop allocation-free.

const CAT_HIGH_CARD = 0;
const CAT_PAIR = 1;
const CAT_TWO_PAIR = 2;
const CAT_TRIPS = 3;
const CAT_STRAIGHT = 4;
const CAT_FLUSH = 5;
const CAT_FULL_HOUSE = 6;
const CAT_QUADS = 7;
const CAT_STRAIGHT_FLUSH = 8;

function pack(cat: number, t: number[]): number {
  let s = cat;
  for (let i = 0; i < 5; i++) s = s * 16 + (t[i] ?? 0);
  return s;
}

/**
 * Given a 13-bit rank mask, return the high rank (0..12) of the best straight,
 * or -1 if none. Handles the wheel (A-2-3-4-5), where the straight is 5-high.
 */
function highestStraight(mask: number): number {
  for (let hi = 12; hi >= 4; hi--) {
    let ok = true;
    for (let k = 0; k < 5; k++) {
      if (!(mask & (1 << (hi - k)))) {
        ok = false;
        break;
      }
    }
    if (ok) return hi;
  }
  // Wheel: A(12),5(3),4(2),3(1),2(0) -> 5-high straight, high rank index 3.
  if (mask & (1 << 12) && mask & 1 && mask & 2 && mask & 4 && mask & 8) return 3;
  return -1;
}

/** Top N set bits of a mask, as rank indices, descending. */
function topRanks(mask: number, n: number): number[] {
  const out: number[] = [];
  for (let r = 12; r >= 0 && out.length < n; r--) {
    if (mask & (1 << r)) out.push(r);
  }
  return out;
}

/**
 * Evaluate the best 5-card hand from 7 integer cards.
 * Returns a comparable score (higher = better).
 */
export function evaluate7Ints(cards: number[]): number {
  const rankCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const suitMask = [0, 0, 0, 0];
  const suitCount = [0, 0, 0, 0];
  let rankMask = 0;

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const r = c >> 2;
    const s = c & 3;
    rankCounts[r]++;
    suitMask[s] |= 1 << r;
    suitCount[s]++;
    rankMask |= 1 << r;
  }

  // Straight flush
  let flushSuit = -1;
  for (let s = 0; s < 4; s++) if (suitCount[s] >= 5) flushSuit = s;
  if (flushSuit >= 0) {
    const sf = highestStraight(suitMask[flushSuit]);
    if (sf >= 0) return pack(CAT_STRAIGHT_FLUSH, [sf]);
  }

  // Group ranks by count (descending rank within each group)
  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  for (let r = 12; r >= 0; r--) {
    if (rankCounts[r] === 4) quads.push(r);
    else if (rankCounts[r] === 3) trips.push(r);
    else if (rankCounts[r] === 2) pairs.push(r);
  }

  // Four of a kind
  if (quads.length) {
    const q = quads[0];
    const kicker = topRanks(rankMask & ~(1 << q), 1);
    return pack(CAT_QUADS, [q, kicker[0] ?? 0]);
  }

  // Full house (also covers two sets -> use second set as the pair)
  if (trips.length >= 1 && (trips.length >= 2 || pairs.length >= 1)) {
    const tripRank = trips[0];
    const pairRank = trips.length >= 2 ? trips[1] : pairs[0];
    return pack(CAT_FULL_HOUSE, [tripRank, pairRank]);
  }

  // Flush
  if (flushSuit >= 0) {
    return pack(CAT_FLUSH, topRanks(suitMask[flushSuit], 5));
  }

  // Straight
  const straightHi = highestStraight(rankMask);
  if (straightHi >= 0) return pack(CAT_STRAIGHT, [straightHi]);

  // Three of a kind
  if (trips.length) {
    const t = trips[0];
    return pack(CAT_TRIPS, [t, ...topRanks(rankMask & ~(1 << t), 2)]);
  }

  // Two pair
  if (pairs.length >= 2) {
    const p1 = pairs[0];
    const p2 = pairs[1];
    const kicker = topRanks(rankMask & ~(1 << p1) & ~(1 << p2), 1);
    return pack(CAT_TWO_PAIR, [p1, p2, kicker[0] ?? 0]);
  }

  // One pair
  if (pairs.length === 1) {
    const p = pairs[0];
    return pack(CAT_PAIR, [p, ...topRanks(rankMask & ~(1 << p), 3)]);
  }

  // High card
  return pack(CAT_HIGH_CARD, topRanks(rankMask, 5));
}

const RANK_NAMES = ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
const RANK_PLURAL = ['Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens', 'Jacks', 'Queens', 'Kings', 'Aces'];

function categoryOf(score: number): number {
  return Math.floor(score / 16 ** 5);
}

function tiebreaksOf(score: number): number[] {
  const t: number[] = [];
  let rem = score % 16 ** 5;
  for (let i = 4; i >= 0; i--) {
    const div = 16 ** i;
    t.push(Math.floor(rem / div));
    rem = rem % div;
  }
  return t;
}

function describe(score: number): { rank: HandRank; description: string } {
  const cat = categoryOf(score);
  const t = tiebreaksOf(score);
  switch (cat) {
    case CAT_STRAIGHT_FLUSH:
      if (t[0] === 12) return { rank: 'royal_flush', description: 'Royal Flush' };
      return { rank: 'straight_flush', description: `Straight Flush, ${RANK_NAMES[t[0]]}-high` };
    case CAT_QUADS:
      return { rank: 'four_of_a_kind', description: `Four ${RANK_PLURAL[t[0]]}, ${RANK_NAMES[t[1]]} kicker` };
    case CAT_FULL_HOUSE:
      return { rank: 'full_house', description: `Full House, ${RANK_PLURAL[t[0]]} full of ${RANK_PLURAL[t[1]]}` };
    case CAT_FLUSH:
      return { rank: 'flush', description: `Flush, ${RANK_NAMES[t[0]]}-high` };
    case CAT_STRAIGHT:
      return { rank: 'straight', description: `Straight, ${RANK_NAMES[t[0]]}-high` };
    case CAT_TRIPS:
      return { rank: 'three_of_a_kind', description: `Three ${RANK_PLURAL[t[0]]}` };
    case CAT_TWO_PAIR:
      return { rank: 'two_pair', description: `Two Pair, ${RANK_PLURAL[t[0]]} and ${RANK_PLURAL[t[1]]}` };
    case CAT_PAIR:
      return { rank: 'pair', description: `Pair of ${RANK_PLURAL[t[0]]}, ${RANK_NAMES[t[1]]} kicker` };
    default:
      return { rank: 'high_card', description: `${RANK_NAMES[t[0]]}-high` };
  }
}

/** Evaluate 7 cards (notation) into a rich, human-readable result. */
export function evaluate7Cards(cards: Card[]): EvaluatedHand {
  const score = evaluate7Ints(cards.map(cardToInt));
  const { rank, description } = describe(score);
  return { rank, rankValue: score, description };
}

/** Compare two evaluated hands. */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): -1 | 0 | 1 {
  if (a.rankValue > b.rankValue) return 1;
  if (a.rankValue < b.rankValue) return -1;
  return 0;
}

// Re-export for convenience / testing
export { RANKS };
