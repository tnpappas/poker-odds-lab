import { potOdds, callEV, ruleOf2And4 } from '@pol/poker-engine';

export interface BlitzScenario {
  prompt: string;
  sub: string;
  leftLabel: string;
  rightLabel: string;
  answerRight: boolean; // true if the RIGHT option is correct
  explain: string;
}

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const ri = (min: number, max: number) => Math.floor(rnd(min, max + 1));
const round5 = (n: number) => Math.round(n / 5) * 5;

/**
 * Generate one binary scenario. RIGHT is always the "call / yes / over" side,
 * LEFT the "fold / no / under". `difficulty` (0..1) narrows the margins so the
 * decision gets closer to break-even as the streak grows.
 */
export type BlitzFocus = 'pot_odds' | 'ev_call' | 'rule_2_4' | 'bet_sizing';

export function generateBlitzScenario(difficulty = 0, focus?: BlitzFocus): BlitzScenario {
  const margin = 0.12 - difficulty * 0.09; // shrinks toward break-even
  // When drilling a specific leak, bias ~70% of prompts to that scenario type.
  const FOCUS_TYPE: Record<BlitzFocus, number> = { pot_odds: 0, ev_call: 1, rule_2_4: 2, bet_sizing: 3 };
  const type = focus && Math.random() < 0.7 ? FOCUS_TYPE[focus] : ri(0, 3);

  if (type === 0) {
    // pot odds: equity vs required
    const pot = round5(rnd(40, 200));
    const bet = round5(rnd(20, pot));
    const req = potOdds(pot, bet);
    const equity = Math.max(0.05, Math.min(0.95, req + (Math.random() < 0.5 ? 1 : -1) * rnd(0.02, margin + 0.1)));
    const eqPct = Math.round(equity * 100);
    return {
      prompt: `Pot $${pot}, adversary bets $${bet}.`,
      sub: `You have ${eqPct}% equity.`,
      leftLabel: 'Fold',
      rightLabel: 'Call',
      answerRight: equity >= req,
      explain: `You need ${(req * 100).toFixed(0)}% to call; you have ${eqPct}%.`,
    };
  }

  if (type === 1) {
    // EV of call: +EV or -EV
    const pot = round5(rnd(60, 220));
    const call = round5(rnd(20, pot));
    const breakeven = call / (pot + call);
    const equity = Math.max(0.05, Math.min(0.95, breakeven + (Math.random() < 0.5 ? 1 : -1) * rnd(0.02, margin + 0.1)));
    const ev = callEV(equity, pot + call, call);
    return {
      prompt: `${Math.round(equity * 100)}% equity. $${pot} pot, $${call} to call.`,
      sub: `Is calling profitable?`,
      leftLabel: '−EV',
      rightLabel: '+EV',
      answerRight: ev > 0,
      explain: `EV of calling ≈ ${ev >= 0 ? '+' : ''}${ev.toFixed(1)} chips.`,
    };
  }

  if (type === 2) {
    // rule of 2 & 4: equity over/under a threshold
    const street = Math.random() < 0.5 ? 'flop' : 'turn';
    const outs = ri(4, 15);
    const { exact } = ruleOf2And4(outs, street);
    const threshold = Math.max(0.05, exact + (Math.random() < 0.5 ? 1 : -1) * rnd(0.02, margin + 0.06));
    const thrPct = Math.round(threshold * 100);
    return {
      prompt: `${outs} outs on the ${street}.`,
      sub: `Is your equity over ${thrPct}%?`,
      leftLabel: 'Under',
      rightLabel: 'Over',
      answerRight: exact > threshold,
      explain: `${outs} outs ≈ ${(exact * 100).toFixed(0)}% (rule of ${street === 'flop' ? '4' : '2'}).`,
    };
  }

  // bet threshold: required equity to call a sized bet
  const sizes = [
    { label: '⅓ pot', pct: 1 / 3 },
    { label: '½ pot', pct: 0.5 },
    { label: '⅔ pot', pct: 2 / 3 },
    { label: 'pot', pct: 1 },
  ];
  const s = sizes[ri(0, sizes.length - 1)];
  const pot = 100;
  const bet = pot * s.pct;
  const req = potOdds(pot, bet);
  const askPct = Math.round((req + (Math.random() < 0.5 ? 1 : -1) * rnd(0.02, margin + 0.05)) * 100);
  return {
    prompt: `Adversary bets ${s.label}.`,
    sub: `Do you need more than ${askPct}% to call?`,
    leftLabel: 'No',
    rightLabel: 'Yes',
    answerRight: req * 100 > askPct,
    explain: `A ${s.label} bet needs ${(req * 100).toFixed(0)}% equity.`,
  };
}
