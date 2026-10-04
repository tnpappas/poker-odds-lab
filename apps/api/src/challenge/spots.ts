/**
 * The 7-Day Live Read Challenge: schedule and the seven river spots.
 *
 * Pure data with no imports, on purpose: packages/poker-engine/test/challenge.test.ts
 * imports this file and recomputes every equity and every correct answer with
 * the engine, so a number shown on the site can never drift from the math.
 *
 * Answers stay server side. The API only sends a spot once its day opens and
 * only sends the answer once that day has closed.
 */

export type ChallengeAction = 'call' | 'fold';

export interface ChallengeSpot {
  day: number;
  title: string;
  /** One-line hook used on the page and in the social post. */
  hook: string;
  /** How this opponent plays, in plain words. */
  profile: string;
  /** The betting line up to the river decision. */
  action: string;
  hero: [string, string];
  board: [string, string, string, string, string];
  /** Pot before the river bet, in dollars. */
  pot: number;
  /** The river bet you face, in dollars. */
  bet: number;
  /** The range we model for this opponent's river bet, in standard notation. */
  range: string;
  /** Exact combos added to `range` where notation can't name a suit (missed flush draws). */
  extraCombos: [string, string][];
  /** The modeled range in plain words, shown at the reveal. */
  rangeText: string;
  /** Hero equity vs the modeled range, percent, 1 decimal. Pinned by the engine test. */
  equityPct: number;
  /** Break-even equity, percent, 1 decimal: bet / (pot + 2 x bet). Pinned by the engine test. */
  requiredPct: number;
  correct: ChallengeAction;
  /** Short explanation shown at the reveal. */
  lesson: string;
}

export const CHALLENGE = {
  id: 'live-read-1',
  name: 'The 7-Day Live Read Challenge',
  /** Day 1 opens Monday Oct 19 2026, 7:00pm ET. Each day lasts 24 hours. */
  startsAt: '2026-10-19T23:00:00.000Z',
  dayMs: 24 * 60 * 60 * 1000,
  days: 7,
  /** Day 7 is worth double. */
  finalDayPoints: 2,
  /** Equity error charged for a skipped day in the tie-breaker. */
  skippedDayError: 100,
} as const;

export const SPOTS: ChallengeSpot[] = [
  {
    day: 1,
    title: 'The River Bluff-Catcher',
    hook: 'He shoves the river. You have second pair. Call or fold?',
    profile: 'Loose and aggressive. Calls wide before the flop and turns missed draws into big river bets.',
    action: 'You raise on the button with K♥Q♣, he calls in the big blind. Flop A♠Q♦7♣: he checks, you bet, he calls. Turn 4♥: check, check. River 2♠: he shoves.',
    hero: ['Kh', 'Qc'],
    board: ['As', 'Qd', '7c', '4h', '2s'],
    pot: 60,
    bet: 60,
    range: 'AJ+,A7s,77,44,22,53s,KJ,KTs,JTs,J9s,T9s,65s,86s',
    extraCombos: [],
    rangeText: 'Value: AJ or better, A7 suited, sets of 7s, 4s and 2s, and the wheel with 53 suited. Bluffs: missed straight draws, KJ, KT suited, JT suited, J9 suited, T9 suited, 65 suited and 86 suited.',
    equityPct: 45.5,
    requiredPct: 33.3,
    correct: 'call',
    lesson: 'A pot-size shove asks for 33%. Against this player your second pair beats every missed straight draw, which is 45.5% of his range. Call. Loose players who bluff missed draws get called down by any pair that beats a draw.',
  },
  {
    day: 2,
    title: 'The Overbet Scare',
    hook: 'He bets twice the pot on the river. You have second pair, top kicker.',
    profile: 'Solid regular. When he overbets the river it is the top of his range or a missed draw, rarely anything in between.',
    action: 'He raises from the cutoff, you call in the big blind with A♥J♦. Flop K♣J♣8♦: you check, he bets, you call. Turn 3♠: check, check. River 2♥: he bets $100 into $50.',
    hero: ['Ah', 'Jd'],
    board: ['Kc', 'Jc', '8d', '3s', '2h'],
    pot: 50,
    bet: 100,
    range: 'AK,KQ,KJs,K8s,88,33,22,QTs,T9s',
    extraCombos: [['Qc', '9c'], ['Ac', 'Tc'], ['Ac', 'Qc'], ['Tc', '9c'], ['6c', '5c'], ['7c', '6c']],
    rangeText: 'Value: AK, KQ, KJ suited, K8 suited, sets of 8s, 3s and 2s. Bluffs: missed club draws (Q♣9♣, A♣T♣, A♣Q♣, T♣9♣, 6♣5♣, 7♣6♣) and missed straight draws QT suited and T9 suited.',
    equityPct: 29.2,
    requiredPct: 40,
    correct: 'fold',
    lesson: 'A bet of twice the pot asks for 40%. Your hand only beats his bluffs, and they are 29.2% of his range. Fold. Big overbets give you a bad price, so you need a lot of bluffs in his range to call, and a solid player does not have enough.',
  },
  {
    day: 3,
    title: 'The Cheap Price',
    hook: 'He bets a quarter of the pot. All you have is ace high.',
    profile: 'Passive recreational player. Makes small river bets with weak pairs and with missed draws to "see where he is at."',
    action: 'You raise from middle position with A♥J♥, he calls on the button. Flop Q♠9♥6♣: you bet, he calls. Turn 3♦: check, check. River 2♠: you check, he bets $20 into $80.',
    hero: ['Ah', 'Jh'],
    board: ['Qs', '9h', '6c', '3d', '2s'],
    pot: 80,
    bet: 20,
    range: 'J9s,T9s,98s,97s,96s,K9s,88-77,55,44,KTs,KJs,JTs,T8s,87s',
    extraCombos: [],
    rangeText: 'Weak made hands: second pair (J9, T9, 98, 97, 96 and K9 suited), and pocket pairs 88, 77, 55 and 44. Missed draws: KT, KJ, JT, T8 and 87 suited.',
    equityPct: 30.5,
    requiredPct: 16.7,
    correct: 'call',
    lesson: 'A quarter-pot bet only asks for 16.7%. Ace high beats every missed draw in his range, and that is 30.5% of it. Call. Small bets give you a great price, so even weak hands become calls.',
  },
  {
    day: 4,
    title: 'The Strange Lead',
    hook: 'He has called every street. Now he leads the river for the full pot.',
    profile: 'Recreational player. Calls a lot, rarely bluffs, and bets big when he finally makes a hand.',
    action: 'You raise with Q♥Q♦, he calls. Flop J♣7♠4♦: you bet, he calls. Turn 2♥: you bet, he calls. River 9♣: he leads out for $70 into $70.',
    hero: ['Qh', 'Qd'],
    board: ['Jc', '7s', '4d', '2h', '9c'],
    pot: 70,
    bet: 70,
    range: 'J9,97s,JTs,T8s,J7s,74s,99,77,44,KJs,QJs,65s',
    extraCombos: [],
    rangeText: 'Two pair and better: J9, 97 suited, J7 suited, 74 suited, sets of 9s, 7s and 4s, and the straight with T8 suited. One pair: JT, KJ and QJ suited. One missed draw: 65 suited.',
    equityPct: 28.2,
    requiredPct: 33.3,
    correct: 'fold',
    lesson: 'A pot-size bet asks for 33.3%. Your overpair only beats his one-pair hands and the odd missed draw, 28.2% of his range. Fold. When a player who never bluffs suddenly leads big, believe him.',
  },
  {
    day: 5,
    title: 'The 3-Bet Pot',
    hook: 'You 3-bet AK and miss everything. He leads the river.',
    profile: 'Solid regular. He would 4-bet AA, KK, QQ and AK before the flop, so those hands are not in his range.',
    action: 'He raises from the cutoff, you 3-bet on the button with A♦K♣, he calls. Flop 9♠8♥5♦: you bet, he calls. Turn 4♣: check, check. River 2♠: he leads $25 into $50.',
    hero: ['Ad', 'Kc'],
    board: ['9s', '8h', '5d', '4c', '2s'],
    pot: 50,
    bet: 25,
    range: '99,88,55,44,JJ,TT,98s,76s,KQs,QJs,AQs,AJs,JTs',
    extraCombos: [],
    rangeText: 'Value: overpairs JJ and TT, sets of 9s, 8s, 5s and 4s, two pair with 98 suited, and the straight with 76 suited. Bluffs: missed broadway hands KQ, QJ, AQ, AJ and JT suited.',
    equityPct: 36.2,
    requiredPct: 25,
    correct: 'call',
    lesson: 'A half-pot bet asks for 25%. His range is capped: the hands that crush you would have 4-bet. Ace king high beats every missed broadway hand, 36.2% of his range. Call.',
  },
  {
    day: 6,
    title: 'The Line That Does Not Add Up',
    hook: 'He checked the turn. Now he bets the full pot on a blank river.',
    profile: 'Aggressive regular. Bets the turn with almost every strong hand, so a turn check usually means he gave up.',
    action: 'He raises, you call in the big blind with 8♠8♦. Flop T♣6♥3♦: he bets, you call. Turn K♥: check, check. River 2♠: you check, he bets $40 into $40.',
    hero: ['8s', '8d'],
    board: ['Tc', '6h', '3d', 'Kh', '2s'],
    pot: 40,
    bet: 40,
    range: '66,33,22,KT,K6s,AQ,AJ,QJs,54s,87s,A5s,A4s,97s,J9s',
    extraCombos: [],
    rangeText: 'Value: slow-played sets of 6s and 3s, 22 for a rivered set, two pair with KT and K6 suited, and 54 suited for a rivered straight. Bluffs: hands that gave up on the turn, AQ, AJ, QJ suited, 87 suited, A5 and A4 suited, 97 suited and J9 suited.',
    equityPct: 68.4,
    requiredPct: 33.3,
    correct: 'call',
    lesson: 'A pot-size bet asks for 33.3%. His turn check took most of his strong hands out of his range, so this river bet is mostly hands that gave up. Your 88 has 68.4%. Call. When the story does not add up, trust the story over the bet size.',
  },
  {
    day: 7,
    title: 'The Championship Final',
    hook: 'Final hand, double points. You have top two pair and he shoves.',
    profile: 'Tight regular. Check-raises the turn almost only with strong hands.',
    action: 'You raise with T♥9♥, he calls in the big blind. Flop T♦9♠4♣: he checks, you bet, he calls. Turn 8♥: he checks, you bet, he check-raises, you call. River 2♠: he shoves $90 into $60.',
    hero: ['Th', '9h'],
    board: ['Td', '9s', '4c', '8h', '2s'],
    pot: 60,
    bet: 90,
    range: 'QJ,J7s,76s,TT,99,44,88,T8s,98s,KJs,AJs',
    extraCombos: [],
    rangeText: 'Straights: QJ, J7 suited and 76 suited. Sets: TT, 99, 88 and 44. Weaker two pair: T8 suited and 98 suited. Semi-bluffs that missed: KJ and AJ suited.',
    equityPct: 27.3,
    requiredPct: 37.5,
    correct: 'fold',
    lesson: 'A 1.5x pot shove asks for 37.5%. Top two pair feels huge, but against a tight player who check-raised the 8 it only beats weaker two pair and missed draws, 27.3% of his range. Fold. The hand you hold matters less than the hands he can have.',
  },
];
