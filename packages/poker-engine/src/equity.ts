import { Card, EquityResult, HandRange } from './types.js';
import { cardToInt, intToCard } from './deck.js';
import { evaluate7Ints } from './hands.js';

type RNG = () => number;

/** Build a flat array of adversary combos as int pairs, with a cumulative weight table. */
function prepRange(range: HandRange): { combos: [number, number][]; cum: number[]; total: number } {
  const combos: [number, number][] = [];
  const cum: number[] = [];
  let total = 0;
  for (const c of range) {
    if (c.weight <= 0) continue;
    combos.push([cardToInt(c.cards[0]), cardToInt(c.cards[1])]);
    total += c.weight;
    cum.push(total);
  }
  return { combos, cum, total };
}

function pickWeighted(cum: number[], total: number, rng: RNG): number {
  const x = rng() * total;
  // linear scan is fine; ranges are typically < 1326 combos
  for (let i = 0; i < cum.length; i++) if (x < cum[i]) return i;
  return cum.length - 1;
}

/**
 * Monte Carlo equity calculator.
 * Estimates hero's win probability against an adversary range on a given board.
 *
 * @param adversaryRange  Either an explicit weighted range, or 'random' for a
 *                      uniformly random two-card holding from the live deck.
 */
export function calculateEquity(
  heroHand: [Card, Card],
  adversaryRange: HandRange | 'random',
  board: Card[] = [],
  simulations = 10000,
  rng: RNG = Math.random,
): EquityResult {
  const hero = [cardToInt(heroHand[0]), cardToInt(heroHand[1])];
  const boardInts = board.map(cardToInt);

  const dead = new Uint8Array(52);
  for (const c of hero) dead[c] = 1;
  for (const c of boardInts) dead[c] = 1;

  // Base deck excludes hero + known board (constant across iterations).
  const baseDeck: number[] = [];
  for (let i = 0; i < 52; i++) if (!dead[i]) baseDeck.push(i);

  const need = 5 - boardInts.length; // board cards still to come
  const isRandom = adversaryRange === 'random';
  const prepped = isRandom ? null : prepRange(adversaryRange as HandRange);
  if (prepped && prepped.combos.length === 0) {
    throw new Error('Adversary range is empty after removing blockers/zero weights.');
  }

  let win = 0;
  let tie = 0;
  let lose = 0;
  let samples = 0;

  const work = new Int32Array(baseDeck.length);
  const hero7 = [hero[0], hero[1], 0, 0, 0, 0, 0];
  const vill7 = [0, 0, 0, 0, 0, 0, 0];

  for (let s = 0; s < simulations; s++) {
    // 1. Pick adversary hand.
    let v1: number;
    let v2: number;
    if (isRandom) {
      v1 = -1;
      v2 = -1; // chosen below from the shuffled deck
    } else {
      let tries = 0;
      do {
        const idx = pickWeighted(prepped!.cum, prepped!.total, rng);
        [v1, v2] = prepped!.combos[idx];
        tries++;
      } while ((dead[v1] || dead[v2]) && tries < 20);
      if (dead[v1] || dead[v2]) continue; // couldn't place this combo on this board
    }

    // 2. Build working deck (base minus adversary cards) and partial-shuffle.
    let n = 0;
    for (let i = 0; i < baseDeck.length; i++) {
      const c = baseDeck[i];
      if (c === v1 || c === v2) continue;
      work[n++] = c;
    }
    // Draw `need` board cards (+2 for adversary if random) via partial Fisher-Yates.
    const draw = need + (isRandom ? 2 : 0);
    for (let i = 0; i < draw; i++) {
      const j = i + Math.floor(rng() * (n - i));
      const tmp = work[i];
      work[i] = work[j];
      work[j] = tmp;
    }

    let di = 0;
    if (isRandom) {
      v1 = work[di++];
      v2 = work[di++];
    }

    // 3. Assemble 7-card hands.
    vill7[0] = v1;
    vill7[1] = v2;
    for (let i = 0; i < boardInts.length; i++) {
      hero7[2 + i] = boardInts[i];
      vill7[2 + i] = boardInts[i];
    }
    for (let i = 0; i < need; i++) {
      const c = work[di++];
      hero7[2 + boardInts.length + i] = c;
      vill7[2 + boardInts.length + i] = c;
    }

    const hScore = evaluate7Ints(hero7);
    const vScore = evaluate7Ints(vill7);
    if (hScore > vScore) win++;
    else if (hScore < vScore) lose++;
    else tie++;
    samples++;
  }

  const equity = samples === 0 ? 0 : (win + tie / 2) / samples;
  return { win, tie, lose, equity, samples };
}

/** Generate all C(52,2) combos minus dead cards as a uniform range. */
function allCombosRange(dead: Set<number>): HandRange {
  const range: HandRange = [];
  for (let a = 0; a < 52; a++) {
    if (dead.has(a)) continue;
    for (let b = a + 1; b < 52; b++) {
      if (dead.has(b)) continue;
      range.push({ cards: [intToCard(a), intToCard(b)], weight: 1 });
    }
  }
  return range;
}

/**
 * Exact equity by full enumeration of remaining runouts (heads-up, specific hands).
 * Fast for turn/river/flop; preflop enumerates ~1.7M runouts (use sparingly).
 */
export function calculateExactEquity(
  heroHand: [Card, Card],
  adversaryHand: [Card, Card],
  board: Card[] = [],
): EquityResult {
  const hero = [cardToInt(heroHand[0]), cardToInt(heroHand[1])];
  const vill = [cardToInt(adversaryHand[0]), cardToInt(adversaryHand[1])];
  const boardInts = board.map(cardToInt);

  const dead = new Set<number>([...hero, ...vill, ...boardInts]);
  const remaining: number[] = [];
  for (let i = 0; i < 52; i++) if (!dead.has(i)) remaining.push(i);

  const need = 5 - boardInts.length;
  let win = 0;
  let tie = 0;
  let lose = 0;
  let samples = 0;

  const hero7 = [hero[0], hero[1], ...boardInts, ...new Array(need).fill(0)];
  const vill7 = [vill[0], vill[1], ...boardInts, ...new Array(need).fill(0)];
  const base = 2 + boardInts.length;

  const combo = new Array(need).fill(0);
  const rec = (start: number, depth: number): void => {
    if (depth === need) {
      for (let i = 0; i < need; i++) {
        hero7[base + i] = combo[i];
        vill7[base + i] = combo[i];
      }
      const h = evaluate7Ints(hero7);
      const v = evaluate7Ints(vill7);
      if (h > v) win++;
      else if (h < v) lose++;
      else tie++;
      samples++;
      return;
    }
    for (let i = start; i < remaining.length; i++) {
      combo[depth] = remaining[i];
      rec(i + 1, depth + 1);
    }
  };
  rec(0, 0);

  const equity = samples === 0 ? 0 : (win + tie / 2) / samples;
  return { win, tie, lose, equity, samples };
}

export { allCombosRange };
