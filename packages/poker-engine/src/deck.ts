import { Card, Rank, Suit, RANKS, SUITS } from './types.js';

// Internal integer representation: 0..51, where rank = int >> 2 (0='2'..12='A')
// and suit = int & 3. This keeps the Monte Carlo loop allocation-free and fast.

export function cardToInt(card: Card): number {
  const r = card[0] as Rank;
  const s = card[1] as Suit;
  const ri = RANKS.indexOf(r);
  const si = SUITS.indexOf(s);
  if (ri < 0 || si < 0) throw new Error(`Invalid card: ${card}`);
  return (ri << 2) | si;
}

export function intToCard(i: number): Card {
  const r = RANKS[i >> 2];
  const s = SUITS[i & 3];
  return `${r}${s}` as Card;
}

export function cardsToInts(cards: Card[]): number[] {
  return cards.map(cardToInt);
}

/** Full 52-card deck in standard notation. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push(`${r}${s}` as Card);
    }
  }
  return deck;
}

/** Full 52-card deck as integers 0..51. */
export function makeIntDeck(): number[] {
  return Array.from({ length: 52 }, (_, i) => i);
}

/** Validate that a set of cards has no duplicates and all are legal. */
export function assertNoDuplicates(cards: Card[]): void {
  const seen = new Set<number>();
  for (const c of cards) {
    const i = cardToInt(c);
    if (seen.has(i)) throw new Error(`Duplicate card: ${c}`);
    seen.add(i);
  }
}
