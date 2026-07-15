import { Card, HandMatrix, HandRange, Position, Rank, RANKS, GRID_RANKS, SUITS } from './types.js';

// ---------------------------------------------------------------------------
// Hand labels & combos
// ---------------------------------------------------------------------------

/** Label for grid cell (row, col). Pairs on the diagonal, suited upper-right. */
export function cellLabel(row: number, col: number): string {
  const hi = GRID_RANKS[Math.min(row, col)];
  const lo = GRID_RANKS[Math.max(row, col)];
  if (row === col) return `${hi}${lo}`;
  return row < col ? `${hi}${lo}s` : `${hi}${lo}o`;
}

/** Grid coordinates (row, col) for a label like 'AKs', 'QQ', 'T9o'. */
export function labelToCell(label: string): [number, number] {
  const hi = label[0] as Rank;
  const lo = label[1] as Rank;
  const hiIdx = GRID_RANKS.indexOf(hi);
  const loIdx = GRID_RANKS.indexOf(lo);
  if (label.length === 2) return [hiIdx, hiIdx]; // pair
  const suited = label[2] === 's';
  // suited = upper-right (row < col): row is the higher rank (smaller index)
  return suited ? [Math.min(hiIdx, loIdx), Math.max(hiIdx, loIdx)] : [Math.max(hiIdx, loIdx), Math.min(hiIdx, loIdx)];
}

/** Number of card combinations for a label: pair=6, suited=4, offsuit=12. */
export function comboCount(label: string): number {
  if (label.length === 2) return 6;
  return label[2] === 's' ? 4 : 12;
}

/** Expand a label into its concrete card combos. */
export function expandLabel(label: string): [Card, Card][] {
  const r1 = label[0] as Rank;
  const r2 = label[1] as Rank;
  const out: [Card, Card][] = [];
  if (label.length === 2) {
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        out.push([`${r1}${SUITS[i]}` as Card, `${r1}${SUITS[j]}` as Card]);
      }
    }
  } else if (label[2] === 's') {
    for (const s of SUITS) out.push([`${r1}${s}` as Card, `${r2}${s}` as Card]);
  } else {
    for (const s1 of SUITS) {
      for (const s2 of SUITS) {
        if (s1 !== s2) out.push([`${r1}${s1}` as Card, `${r2}${s2}` as Card]);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Range string parsing
// ---------------------------------------------------------------------------

const ri = (r: string): number => RANKS.indexOf(r as Rank); // 0='2'..12='A'

/** Parse standard range notation ("AA,KK,AKs,AQs-ATs,JJ+,A2s+") into labels. */
export function parseRangeToLabels(range: string): string[] {
  const labels = new Set<string>();
  for (const raw of range.split(',')) {
    const token = raw.trim();
    if (!token) continue;

    // Range with explicit endpoints: "AQs-ATs", "TT-77"
    if (token.includes('-')) {
      const [a, b] = token.split('-').map((t) => t.trim());
      addSpan(labels, a, b);
      continue;
    }

    // Plus notation: "JJ+", "A9s+", "KTo+"
    if (token.endsWith('+')) {
      addPlus(labels, token.slice(0, -1));
      continue;
    }

    // Bare two ranks without suit qualifier -> both suited and offsuit.
    if (token.length === 2 && token[0] !== token[1]) {
      labels.add(token + 's');
      labels.add(token + 'o');
      continue;
    }
    labels.add(token);
  }
  return [...labels];
}

function addPlus(set: Set<string>, base: string): void {
  if (base.length === 2 && base[0] === base[1]) {
    // pair plus: "JJ+" -> JJ..AA
    for (let r = ri(base[0]); r <= 12; r++) set.add(`${RANKS[r]}${RANKS[r]}`);
    return;
  }
  const hi = base[0];
  const lo = base[1];
  const suit = base[2] ?? '';
  // kicker climbs from `lo` up to one below `hi`
  for (let r = ri(lo); r < ri(hi); r++) {
    const lbl = `${hi}${RANKS[r]}${suit}`;
    if (suit) set.add(lbl);
    else {
      set.add(lbl + 's');
      set.add(lbl + 'o');
    }
  }
}

function addSpan(set: Set<string>, a: string, b: string): void {
  // Pairs: "TT-77"
  if (a.length === 2 && a[0] === a[1] && b.length === 2 && b[0] === b[1]) {
    const lo = Math.min(ri(a[0]), ri(b[0]));
    const hi = Math.max(ri(a[0]), ri(b[0]));
    for (let r = lo; r <= hi; r++) set.add(`${RANKS[r]}${RANKS[r]}`);
    return;
  }
  // Suited/offsuit span sharing the high card: "AQs-ATs"
  const hi = a[0];
  const suit = a[2] ?? '';
  const lo1 = ri(a[1]);
  const lo2 = ri(b[1]);
  const lo = Math.min(lo1, lo2);
  const hiK = Math.max(lo1, lo2);
  for (let r = lo; r <= hiK; r++) set.add(`${hi}${RANKS[r]}${suit}`);
}

/** Parse a range string into an explicit weighted combo list. */
export function parseRangeString(range: string): HandRange {
  const combos: HandRange = [];
  for (const label of parseRangeToLabels(range)) {
    for (const cards of expandLabel(label)) combos.push({ cards, weight: 1 });
  }
  return combos;
}

// ---------------------------------------------------------------------------
// Matrix conversions
// ---------------------------------------------------------------------------

export function emptyMatrix(): HandMatrix {
  return Array.from({ length: 13 }, () => new Array(13).fill(0));
}

/** Convert a weighted combo range into a 13x13 matrix (cell = avg weight present). */
export function rangeToMatrix(range: HandRange): HandMatrix {
  const sum = emptyMatrix();
  for (const { cards, weight } of range) {
    const label = comboToLabel(cards);
    const [r, c] = labelToCell(label);
    sum[r][c] += weight;
  }
  const m = emptyMatrix();
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const label = cellLabel(r, c);
      m[r][c] = Math.min(1, sum[r][c] / comboCount(label));
    }
  }
  return m;
}

/** Convert a matrix back into an explicit weighted combo range. */
export function matrixToRange(matrix: HandMatrix): HandRange {
  const range: HandRange = [];
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const w = matrix[r][c];
      if (w <= 0) continue;
      for (const cards of expandLabel(cellLabel(r, c))) range.push({ cards, weight: w });
    }
  }
  return range;
}

/** Determine the label ('AKs','QQ','T9o') for a concrete two-card combo. */
export function comboToLabel(cards: [Card, Card]): string {
  const r1 = cards[0][0] as Rank;
  const s1 = cards[0][1];
  const r2 = cards[1][0] as Rank;
  const s2 = cards[1][1];
  if (r1 === r2) return `${r1}${r2}`;
  const hi = ri(r1) > ri(r2) ? r1 : r2;
  const lo = ri(r1) > ri(r2) ? r2 : r1;
  return `${hi}${lo}${s1 === s2 ? 's' : 'o'}`;
}

// ---------------------------------------------------------------------------
// Hand strength (Chen formula) & VPIP -> range
// ---------------------------------------------------------------------------

const chenBase: Record<string, number> = { A: 10, K: 8, Q: 7, J: 6, T: 5 };

/** Bill Chen's preflop hand-strength formula. Higher = stronger. */
export function chenScore(label: string): number {
  const r1 = label[0] as Rank;
  const r2 = label[1] as Rank;
  const v = (r: Rank): number => chenBase[r] ?? (ri(r) + 2) / 2; // 9->4.5 ... 2->1
  const isPair = label.length === 2;
  const suited = label[2] === 's';

  let score: number;
  if (isPair) {
    score = Math.max(5, v(r1) * 2);
  } else {
    score = v(ri(r1) >= ri(r2) ? r1 : r2);
    if (suited) score += 2;
    const gap = Math.abs(ri(r1) - ri(r2)) - 1;
    if (gap === 1) score -= 1;
    else if (gap === 2) score -= 2;
    else if (gap === 3) score -= 4;
    else if (gap >= 4) score -= 5;
    // straight bonus: 0/1 gap and both below Q
    const bothLow = ri(r1) < ri('Q' as Rank) && ri(r2) < ri('Q' as Rank);
    if (gap <= 1 && bothLow) score += 1;
  }
  return Math.round(score);
}

/** All 169 labels sorted strongest -> weakest by Chen score. */
export function strengthOrder(): string[] {
  const labels: string[] = [];
  for (let r = 0; r < 13; r++) for (let c = r; c < 13; c++) labels.push(cellLabel(r, c));
  // also include the offsuit mirror for non-pairs
  for (let r = 0; r < 13; r++) for (let c = 0; c < r; c++) labels.push(cellLabel(r, c));
  const uniq = [...new Set(labels)];
  return uniq.sort((a, b) => {
    const d = chenScore(b) - chenScore(a);
    if (d !== 0) return d;
    // tie-break: higher top card, then suited before offsuit
    const topA = Math.max(ri(a[0] as Rank), ri(a[1] as Rank));
    const topB = Math.max(ri(b[0] as Rank), ri(b[1] as Rank));
    if (topB !== topA) return topB - topA;
    return (b[2] === 's' ? 1 : 0) - (a[2] === 's' ? 1 : 0);
  });
}

const POSITION_FACTOR: Record<Position, number> = {
  UTG: 0.8,
  MP: 0.9,
  CO: 1.0,
  BTN: 1.15,
  SB: 0.95,
  BB: 1.05,
};

/**
 * Approximate a player's range from a VPIP percentage.
 * Selects the strongest hands (by combos) until the target fraction of all
 * 1326 combos is reached. Position widens/tightens the effective VPIP.
 *
 * @param vpip 0..1 (e.g. 0.25 for 25%).
 */
export function vpipToRange(vpip: number, position: Position = 'CO'): HandMatrix {
  const effective = Math.max(0, Math.min(1, vpip * POSITION_FACTOR[position]));
  const targetCombos = effective * 1326;
  const m = emptyMatrix();
  let acc = 0;
  for (const label of strengthOrder()) {
    if (acc >= targetCombos) break;
    const [r, c] = labelToCell(label);
    const cc = comboCount(label);
    if (acc + cc <= targetCombos) {
      m[r][c] = 1;
      acc += cc;
    } else {
      // partial inclusion of the boundary hand
      m[r][c] = Math.max(0, (targetCombos - acc) / cc);
      acc = targetCombos;
    }
  }
  return m;
}

/** Convenience: VPIP -> explicit weighted combo range. */
export function statsToRange(vpip: number, _pfr: number, position: Position = 'CO'): HandRange {
  return matrixToRange(vpipToRange(vpip, position));
}
