import { Card, HandMatrix, HandRange, Position } from './types.js';
import { matrixToRange, vpipToRange } from './ranges.js';
import { calculateEquity } from './equity.js';

export interface AdversaryProfile {
  name?: string;
  vpip: number; // 0..1
  pfr: number; // 0..1
  cbetFlop?: number;
  cbetTurn?: number;
  foldTo3bet?: number;
  af?: number;
  wtsd?: number;
}

/**
 * Build a probabilistic preflop range matrix from an adversary's stats.
 * VPIP defines which hands enter the pot. PFR (when given) trims the looser
 * tail for the "raising" sub-range; here we model the overall calling+raising
 * range, which is what matters for equity.
 */
export function buildAdversaryRange(profile: AdversaryProfile, position: Position = 'CO'): HandMatrix {
  return vpipToRange(profile.vpip, position);
}

/** The raise-only sub-range (tighter), derived from PFR. */
export function buildAdversaryRaiseRange(profile: AdversaryProfile, position: Position = 'CO'): HandMatrix {
  return vpipToRange(Math.min(profile.pfr, profile.vpip), position);
}

export interface ExploitAdjustment {
  adjustment: string;
  evGain: number;
  reason: string;
}

/**
 * Suggest exploitative adjustments against an adversary based on their tendencies.
 * Heuristic, teaching-oriented — surfaces the biggest leaks to attack.
 */
export function calculateExploitativeAdjustments(
  _heroHand: [Card, Card],
  adversary: AdversaryProfile,
): ExploitAdjustment[] {
  const out: ExploitAdjustment[] = [];

  if ((adversary.foldTo3bet ?? 0.55) > 0.65) {
    out.push({
      adjustment: '3-bet light instead of calling',
      evGain: Math.round((adversary.foldTo3bet! - 0.5) * 24 * 10) / 10,
      reason: `Folds to 3-bets ${Math.round(adversary.foldTo3bet! * 100)}% of the time — 3-betting prints from fold equity alone.`,
    });
  }

  if ((adversary.cbetFlop ?? 0.6) > 0.75) {
    out.push({
      adjustment: 'Float wider / raise flop as a bluff',
      evGain: Math.round((adversary.cbetFlop! - 0.6) * 18 * 10) / 10,
      reason: `C-bets ${Math.round(adversary.cbetFlop! * 100)}% — his range is too wide to defend a raise.`,
    });
  }

  if (adversary.vpip > 0.4) {
    out.push({
      adjustment: 'Value bet thinner, bluff less',
      evGain: Math.round((adversary.vpip - 0.4) * 30 * 10) / 10,
      reason: `Plays ${Math.round(adversary.vpip * 100)}% of hands — a calling station. Bet your made hands relentlessly.`,
    });
  }

  if ((adversary.af ?? 2.5) < 1.5) {
    out.push({
      adjustment: 'Fold to his aggression',
      evGain: 6.5,
      reason: 'Very passive (AF < 1.5) — when he bets or raises, he almost always has it.',
    });
  }

  return out;
}

/** Compute hero equity against an adversary's modeled range on a board. */
export function equityVsAdversary(
  hero: [Card, Card],
  profile: AdversaryProfile,
  board: Card[] = [],
  position: Position = 'CO',
  simulations = 8000,
): number {
  const range: HandRange = matrixToRange(buildAdversaryRange(profile, position));
  return calculateEquity(hero, range, board, simulations).equity;
}
