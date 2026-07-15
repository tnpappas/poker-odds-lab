import {
  makeDeck,
  cardToInt,
  potOdds,
  callEV,
  countOuts,
  calculateExactEquity,
  matrixToRange,
  rangeToMatrix,
  vpipToRange,
  narrowRange,
  type Card,
  type HandRange,
  type AdversaryProfile,
} from '@pol/poker-engine';
import { computeEquity } from '../../lib/useEquityWorker';
import type { Action, Street } from '../../store/useGameStore';

export interface DecisionNode {
  street: Street;
  pot: number; // pot including adversary's bet (what you'd win)
  betSize: number; // amount to call
  rangeEquity: number; // hero equity vs adversary's modeled range, 0..1
  exactEquity: number; // hero equity vs adversary's actual hand, 0..1
  adversaryRangeMatrix: number[][]; // adversary's likely range on THIS street (narrowed)
  rangeSurvival: number; // fraction of the preflop range still continuing, 0..1
  outs: ReturnType<typeof countOuts>;
  requiredEquity: number; // pot odds
  correctAction: Action;
  evOfCall: number;
  evOfFold: number;
  evOfRaise: number;
  explanation: string;
}

export interface GeneratedHand {
  heroCards: [Card, Card];
  adversaryCards: [Card, Card];
  board: Card[]; // full 5 cards
  adversaryName: string;
  nodes: DecisionNode[];
}

const PROFILES: (AdversaryProfile & { name: string })[] = [
  { name: 'TAG reg', vpip: 0.21, pfr: 0.17, cbetFlop: 0.62, af: 2.8 },
  { name: 'Loose fish', vpip: 0.48, pfr: 0.12, cbetFlop: 0.4, af: 1.4 },
  { name: 'Nit', vpip: 0.12, pfr: 0.1, cbetFlop: 0.7, af: 2.2 },
  { name: 'Maniac', vpip: 0.38, pfr: 0.32, cbetFlop: 0.85, af: 4.2 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreAction(chosen: Action, evCall: number, evFold: number, evRaise: number): { correct: Action; skill: number } {
  const opts: [Action, number][] = [
    ['call', evCall],
    ['fold', evFold],
    ['raise', evRaise],
  ];
  opts.sort((a, b) => b[1] - a[1]);
  const correct = opts[0][0];
  const bestEV = opts[0][1];
  const chosenEV = chosen === 'call' ? evCall : chosen === 'fold' ? evFold : evRaise;
  const skill = chosen === correct ? Math.max(5, Math.round(bestEV)) : Math.round(chosenEV - bestEV);
  return { correct, skill };
}

/** Score a user's action at a node into signed skill points + correctness. */
export function judge(node: DecisionNode, action: Action) {
  return scoreAction(action, node.evOfCall, node.evOfFold, node.evOfRaise);
}

function explain(node: Omit<DecisionNode, 'explanation'>): string {
  const eqPct = (node.rangeEquity * 100).toFixed(0);
  const reqPct = (node.requiredEquity * 100).toFixed(0);
  const drawTxt = node.outs.draws.length ? ` You hold ${node.outs.draws.join(' + ')}.` : '';
  if (node.correctAction === 'call') {
    return `Your ~${eqPct}% equity beats the ${reqPct}% you need to call.${drawTxt} Calling is +EV (${node.evOfCall >= 0 ? '+' : ''}${node.evOfCall.toFixed(1)} chips).`;
  }
  if (node.correctAction === 'raise') {
    return `With ~${eqPct}% equity you're crushing this range — raising for value extracts more than a flat call.${drawTxt}`;
  }
  return `You only have ~${eqPct}% equity but need ${reqPct}% to call.${drawTxt} Folding saves chips — calling is ${node.evOfCall.toFixed(1)} EV.`;
}

/** Generate a complete hand with engine-computed decision nodes. */
export async function generateHand(
  opts: { profileIndex?: number; adversary?: { name: string; vpip: number } } = {},
): Promise<GeneratedHand> {
  const profile: AdversaryProfile & { name: string } = opts.adversary
    ? { name: opts.adversary.name, vpip: opts.adversary.vpip, pfr: 0 }
    : PROFILES[opts.profileIndex ?? Math.floor(Math.random() * PROFILES.length)];
  const adversaryRange = matrixToRange(vpipToRange(profile.vpip, 'CO'));

  // Deal hero, adversary (from range), and a full board with no conflicts.
  const deck = shuffle(makeDeck());
  const used = new Set<number>();
  const draw = (): Card => {
    while (true) {
      const c = deck.pop()!;
      if (!used.has(cardToInt(c))) {
        used.add(cardToInt(c));
        return c;
      }
    }
  };
  const heroCards: [Card, Card] = [draw(), draw()];

  // Pick an adversary combo from the range that doesn't collide with hero.
  let adversaryCards: [Card, Card] = [draw(), draw()];
  const candidates = shuffle(adversaryRange).filter(
    (c) => !used.has(cardToInt(c.cards[0])) && !used.has(cardToInt(c.cards[1])),
  );
  if (candidates.length) {
    adversaryCards = candidates[0].cards;
    used.add(cardToInt(adversaryCards[0]));
    used.add(cardToInt(adversaryCards[1]));
  }

  const board: Card[] = [draw(), draw(), draw(), draw(), draw()];

  // Build flop & turn decision nodes.
  const nodes: DecisionNode[] = [];
  let pot = 6 + Math.floor(Math.random() * 8); // preflop pot in BB-ish chips

  // The adversary's range narrows street by street: only holdings that keep
  // betting/calling survive. rangeEquity is measured vs this shrinking range.
  const startCombos = adversaryRange.reduce((t, c) => t + c.weight, 0) || 1;
  let liveRange: HandRange = adversaryRange;

  for (const street of ['flop', 'turn'] as const) {
    const boardSlice = street === 'flop' ? board.slice(0, 3) : board.slice(0, 4);
    const betSize = Math.round(pot * (0.5 + Math.random() * 0.25));
    const potAfterBet = pot + betSize; // what hero can win

    liveRange = narrowRange(liveRange, boardSlice, { style: 'balanced' });
    const rangeSurvival = (liveRange.reduce((t, c) => t + c.weight, 0)) / startCombos;
    const adversaryRangeMatrix = rangeToMatrix(liveRange);

    const rangeEq = (await computeEquity(heroCards, liveRange, boardSlice, 9000)).equity;
    const exactEq = calculateExactEquity(heroCards, adversaryCards, boardSlice).equity;
    const outs = countOuts(heroCards, boardSlice);
    const required = potOdds(pot, betSize);
    const evOfCall = callEV(rangeEq, potAfterBet, betSize);
    const evOfFold = 0;
    const evOfRaise = (rangeEq - 0.5) * (potAfterBet + betSize) * 1.4;

    const base = {
      street: street as Street,
      pot: potAfterBet,
      betSize,
      rangeEquity: rangeEq,
      exactEquity: exactEq,
      adversaryRangeMatrix,
      rangeSurvival,
      outs,
      requiredEquity: required,
      correctAction: scoreAction('fold', evOfCall, evOfFold, evOfRaise).correct,
      evOfCall,
      evOfFold,
      evOfRaise,
    };
    nodes.push({ ...base, explanation: explain(base) });

    pot = potAfterBet + betSize; // assume hero called -> pot for next street
  }

  return { heroCards, adversaryCards, board, adversaryName: profile.name, nodes };
}
