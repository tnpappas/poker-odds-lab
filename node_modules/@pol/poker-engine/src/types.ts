// Core type definitions for the poker engine.
// Cards use standard notation: rank char + suit char, e.g. 'As', 'Td', '7c'.

export type Suit = 'c' | 'd' | 'h' | 's';
export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'T' | 'J' | 'Q' | 'K' | 'A';
export type Card = `${Rank}${Suit}`;

export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

// Rank order, weakest to strongest. Index 0 = '2', index 12 = 'A'.
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS: Suit[] = ['c', 'd', 'h', 's'];

// Grid order, strongest to weakest — used for the 13x13 hand matrix.
export const GRID_RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

export const HAND_RANKS = [
  'high_card',
  'pair',
  'two_pair',
  'three_of_a_kind',
  'straight',
  'flush',
  'full_house',
  'four_of_a_kind',
  'straight_flush',
  'royal_flush',
] as const;
export type HandRank = (typeof HAND_RANKS)[number];

export interface EvaluatedHand {
  rank: HandRank;
  /** Numeric score for comparison (higher = better). */
  rankValue: number;
  /** Human-readable, e.g. "Pair of Kings, Ace kicker". */
  description: string;
}

export interface EquityResult {
  win: number;
  tie: number;
  lose: number;
  /** Win probability including split-pot fractions, 0..1. */
  equity: number;
  samples: number;
}

export interface HandCombo {
  cards: [Card, Card];
  /** Frequency this combo appears in the range, 0..1. */
  weight: number;
}
export type HandRange = HandCombo[];

/** 13x13 grid of weights (0..1). Row/col indexed by GRID_RANKS (0 = 'A'). */
export type HandMatrix = number[][];

export interface HeuristicResult {
  /** True equity from combinatorics, 0..1. */
  exact: number;
  /** Rule-of-2-and-4 approximation, 0..1. */
  heuristic: number;
  /** heuristic - exact. */
  error: number;
}

export interface OutsResult {
  flushDraw: number;
  straightDraw: number;
  overcards: number;
  /** De-duplicated total outs (overlaps removed). */
  total: number;
  /** Human-readable list of detected draws. */
  draws: string[];
}
