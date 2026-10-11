// How a modeled opponent plays a hand in Hand Replay.
//
// Turns Adversary Lab stats into behavior:
//   - Preflop raise rate (PFR) vs hands played (VPIP): did he raise or just
//     call before the flop? A raiser starts with his top PFR% of hands. A caller
//     starts with the rest of his VPIP range, which is "capped": his best hands
//     would have raised.
//   - Aggression factor and flop c-bet: how readily he keeps betting weak hands
//     (maps to the narrowing style).
//
// Teaching-oriented, like the rest of the narrowing model. Not a solver.

import { HandMatrix, Position } from './types.js';
import { vpipToRange } from './ranges.js';
import type { AdversaryStyle } from './narrowing.js';
import type { AdversaryProfile } from './adversary.js';

/** Betting style from aggression factor and flop c-bet frequency. */
export function adversaryStyle(p: Pick<AdversaryProfile, 'af' | 'cbetFlop'>): AdversaryStyle {
  const af = p.af ?? 2.5;
  const cbet = p.cbetFlop ?? 0.6;
  if (af < 1.5 || cbet < 0.45) return 'passive';
  if (af >= 3 || cbet > 0.75) return 'aggressive';
  return 'balanced';
}

export interface PreflopStart {
  raised: boolean;
  matrix: HandMatrix;
}

function matrixTotal(m: HandMatrix): number {
  let t = 0;
  for (const row of m) for (const w of row) t += w;
  return t;
}

/**
 * Decide whether the opponent raised or called preflop, and return the range
 * he starts the hand with. He raises with probability PFR / VPIP.
 */
export function preflopStartRange(
  p: Pick<AdversaryProfile, 'vpip' | 'pfr'>,
  rand: () => number = Math.random,
  position: Position = 'CO',
): PreflopStart {
  const vpip = p.vpip;
  const pfr = Math.max(0, Math.min(p.pfr ?? 0, vpip));
  const all = vpipToRange(vpip, position);
  const raiseM = vpipToRange(pfr, position);

  const raiseShare = vpip > 0 ? pfr / vpip : 0;
  if (pfr > 0 && matrixTotal(raiseM) > 0 && rand() < raiseShare) {
    return { raised: true, matrix: raiseM };
  }
  const call = all.map((row, r) => row.map((w, c) => Math.max(0, w - raiseM[r][c])));
  if (matrixTotal(call) > 0) return { raised: false, matrix: call };
  // He raises everything he plays.
  return { raised: matrixTotal(raiseM) > 0, matrix: matrixTotal(raiseM) > 0 ? raiseM : all };
}
