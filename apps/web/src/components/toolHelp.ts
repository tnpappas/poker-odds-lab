/**
 * Beginner-friendly explanations for each tool, shared by the Guide page and
 * the in-page "How to use" button. Plain English, no jargon left undefined.
 *
 * Every label in `screen` and `numbers` matches text that is actually on the
 * tool's page, and every rule or threshold described here matches the code.
 * If you change a tool's UI or math, update its entry here in the same commit.
 */
import { Spade, Heart, Diamond, Club } from './icons';
import type { ComponentType } from 'react';

type SuitProps = { size?: number; className?: string };

export interface HelpItem {
  /** The label exactly as it appears on screen. */
  label: string;
  meaning: string;
}

export interface ToolHelp {
  path: string;
  title: string;
  Pip: ComponentType<SuitProps>;
  pipClass: string;
  /** One or two sentences: what this tool is for. */
  what: string;
  /** "On this screen": each visible area and what it is. */
  screen: HelpItem[];
  /** "How to use it": ordered steps. */
  steps: string[];
  /** "The numbers": what each number or color means. */
  numbers: HelpItem[];
  learn: string;
}

export const TOOL_HELP: ToolHelp[] = [
  {
    path: '/replay',
    title: 'Hand Replay',
    Pip: Spade,
    pipClass: 'text-ink-100',
    what: 'A poker hand plays out one street at a time. Your opponent bets on the flop and again on the turn, and each time you read what they might hold, then choose fold, call, or raise.',
    screen: [
      { label: 'vs (name) and Hand skill', meaning: 'The opponent style you are facing this hand, and your running point total for this hand.' },
      { label: 'Adversary', meaning: 'Your opponent’s two cards. They stay face down until you make your decision.' },
      { label: 'Board · Pot', meaning: 'The shared cards in the middle, and the total money in the pot including the bet you are facing.' },
      { label: 'You', meaning: 'Your two cards.' },
      { label: 'The Read', meaning: 'The decision panel. It tells you how much your opponent bet and on which street.' },
      { label: 'Range-read ON / OFF', meaning: 'ON: you paint your guess of their hands and earn bonus points for a good read. OFF: the app shows your odds against its own model of the opponent, so you can practice just the call or fold decision.' },
      { label: 'The hand grid', meaning: 'All 169 starting hands. Pairs run diagonally from AA to 22. An "s" means both cards are the same suit, an "o" means different suits.' },
      { label: 'Fold / Call / Raise', meaning: 'Your decision for this street.' },
    ],
    steps: [
      'Look at your cards, the board, the pot, and the bet you are facing.',
      'With Range-read ON, tap or drag across the grid to light up every hand you think your opponent could have. Tap a lit hand again to remove it.',
      'Watch "Equity vs YOUR read" update as you paint. Green means you have more than you need to call. Red means you have less.',
      'Choose Fold, Call, or Raise.',
      'Read the result: whether your play was best, how close your read was, what they really held, and the "Why" explanation.',
      'Press "Next street" for the turn decision, then "Deal next hand". Free accounts get 3 hands a day.',
      'Built an opponent in Adversary Lab? Press "Play vs him" there and every hand here is dealt against that player until you press "Use random adversaries".',
    ],
    numbers: [
      { label: 'Your read: X% of hands', meaning: 'How much of all possible starting hands you have painted. Smaller means you think they are strong and specific.' },
      { label: 'Equity vs YOUR read', meaning: 'Your chance of winning the pot if your painted read is correct.' },
      { label: 'Equity needed to call', meaning: 'The break-even point. Bet ÷ (pot before the bet + their bet + your call). Above it, calling makes money over time. Below it, calling loses money over time.' },
      { label: 'EV of call', meaning: 'How many chips a call wins or loses on average against their likely range. A plus number means calling is profitable.' },
      { label: 'EV of fold', meaning: 'Always 0. Folding never wins or loses more chips from this point.' },
      { label: '+ pts / read bonus', meaning: 'Points for picking the best play, plus a read bonus when your read lands close to the true number: +15 within 4 points, +10 within 8, +5 within 15.' },
      { label: '% still continuing', meaning: 'How much of their starting range is still betting on this street. Weak hands drop out each street. The red cell is the hand they actually held.' },
    ],
    learn: 'How to put an opponent on a range and turn that read into the mathematically correct fold, call, or raise, and why it is correct.',
  },
  {
    path: '/visualizer',
    title: 'Equity Visualizer',
    Pip: Diamond,
    pipClass: 'text-brand-400',
    what: 'A colored map of all 169 starting hands, showing how strong each one is. Pick any hand, then see how its strength changes against tighter or looser opponents.',
    screen: [
      { label: 'The big grid', meaning: 'Every starting hand. Pairs run diagonally from AA (top left) to 22 (bottom right). Hands above the diagonal end in "s" for suited (same suit). Hands below end in "o" for offsuit (different suits).' },
      { label: 'Colors and the 40% to 85%+ bar', meaning: 'Green hands win most often, yellow are middling, orange and red win least.' },
      { label: 'Selected hand', meaning: 'The hand you clicked, shown with an example of the two cards.' },
      { label: 'Adversary range slider', meaning: 'How loose your opponent is: the share of all starting hands they play. The name beside it (Nit, TAG reg, Solid reg, Loose-aggressive, Fish) is the usual nickname for that style.' },
      { label: 'Adversary’s range', meaning: 'The small grid at the bottom. Bright cells are hands that opponent plays. Faded cells are hands they fold.' },
    ],
    steps: [
      'Scan the big grid to get a feel for which hands are strong (green) and which are weak (red).',
      'Click any hand to select it.',
      'Read "Equity vs random": how that hand does against any two cards.',
      'Drag the Adversary range slider to match an opponent you know. Slide left for a tight player, right for a loose one.',
      'Compare "Your live equity vs this range" with "Equity vs random". The gap shows how much a tight opponent shrinks your edge.',
    ],
    numbers: [
      { label: 'Equity vs random', meaning: 'How often this hand wins against one opponent holding any two cards, with all five board cards dealt. Ties count as half a win.' },
      { label: 'Combos', meaning: 'How many ways you can be dealt this hand. Pairs have 6, suited hands 4, offsuit hands 12. There are 1,326 in total.' },
      { label: 'Solid reg · 20% (example)', meaning: 'Your opponent plays the top 20% of starting hands.' },
      { label: 'Your live equity vs this range', meaning: 'How often your selected hand wins against a hand from that opponent’s range. This is usually lower than "vs random", because opponents who play fewer hands play stronger ones.' },
      { label: '≈ adversary combos', meaning: 'How many of the 1,326 possible two-card hands are in that opponent’s range.' },
      { label: 'Refining equities…', meaning: 'Shown on your first visit while the exact numbers are calculated. It only happens once per browser.' },
    ],
    learn: 'Which starting hands are actually strong, and how their value changes depending on what your opponent could have.',
  },
  {
    path: '/blitz',
    title: 'Mental Math Blitz',
    Pip: Heart,
    pipClass: 'text-brand-400',
    what: 'A 30-second speed quiz. Quick poker math questions appear one after another, and you answer as many as you can before time or lives run out.',
    screen: [
      { label: 'Score', meaning: 'Your points this round.' },
      { label: 'Streak', meaning: 'Correct answers in a row.' },
      { label: 'Misses (three dots)', meaning: 'Wrong answers in a row. Three in a row ends the round. One right answer clears them.' },
      { label: 'Gold bar', meaning: 'The 30-second timer running down.' },
      { label: 'Question card', meaning: 'The spot to judge. It flashes green when you are right and red when you are wrong.' },
      { label: 'Left and right buttons', meaning: 'Right is always the yes side (Call, +EV, Over, Yes). Left is always the no side (Fold, −EV, Under, No).' },
    ],
    steps: [
      'Press "Start Blitz". Free accounts get 2 rounds a day.',
      'Read the question and tap the left or right button.',
      'Keep going until the timer runs out or you miss three in a row.',
      'Check your Score, Accuracy, and Best streak, then press "Play again".',
      'Opened from a Drill button on your Dashboard? A gold banner shows the leak you are working on, and most questions will target it.',
    ],
    numbers: [
      { label: 'Four question types', meaning: 'Pot odds (call or fold), EV (is calling profitable), outs (is your equity over or under a number), and bet size (how much equity a bet requires).' },
      { label: 'Price of common bets', meaning: 'To call a ⅓ pot bet you need 20% equity, ½ pot needs 25%, ⅔ pot needs about 29%, and a pot-size bet needs about 33%.' },
      { label: 'Rule of 2 and 4', meaning: 'Quick estimate for draws: on the flop, outs × 4 is roughly your equity by the river. On the turn, outs × 2.' },
      { label: 'Points', meaning: '+100 per right answer, doubled from a 5 streak, tripled from a 10 streak, and so on. −50 per wrong answer. Questions get closer to the line as your streak grows.' },
      { label: 'Accuracy', meaning: 'The share of this round’s answers you got right.' },
    ],
    learn: 'To do the key poker math fast enough to use it at a real table, without a calculator.',
  },
  {
    path: '/calculator',
    title: 'Equity Calculator',
    Pip: Club,
    pipClass: 'text-ink-100',
    what: 'Enter your cards, the board, and the hands you think your opponent has. It tells you your chance of winning and whether calling the bet is worth it.',
    screen: [
      { label: 'Your hand', meaning: 'Two slots for your cards. The highlighted slot is the one the next card you pick will fill.' },
      { label: 'Card picker', meaning: 'All 52 cards, one row per suit (clubs, diamonds, hearts, spades). Cards already in use cannot be picked twice.' },
      { label: 'Board (leave blank for preflop)', meaning: 'Up to five shared cards: 3 for the flop, 4 for the turn, 5 for the river.' },
      { label: 'Opponent range', meaning: 'The hands you think your opponent holds. Bright cells are included, faded cells are not.' },
      { label: 'Any two / Top 15% / Top 8% / Premiums / clear', meaning: 'Shortcuts that fill the range for you. "clear" empties it so you can paint your own.' },
      { label: 'Is the price right?', meaning: 'Enter the pot and the bet you face to see if calling is profitable.' },
    ],
    steps: [
      'Click the first "Your hand" slot, then click a card in the picker. Do the same for your second card.',
      'Add the board cards that are showing. Leave them empty if no cards are out yet.',
      'Choose a range shortcut, or press "clear" and drag across the grid to paint the hands you think they have.',
      'Read "Your equity" on the right.',
      'Type the pot and the bet into "Is the price right?" and read the green Call or red Fold verdict.',
    ],
    numbers: [
      { label: 'X% of hands', meaning: 'How much of all 1,326 possible starting hands your opponent range covers.' },
      { label: 'Your equity', meaning: 'How often you win against a hand from that range once the rest of the board is dealt. Ties count as half. It is simulated, so it can move by a few tenths between runs.' },
      { label: 'Pot', meaning: 'The money in the middle before your opponent bet.' },
      { label: 'Bet to call', meaning: 'The amount your opponent bet, which you must match.' },
      { label: 'Equity needed', meaning: 'Bet ÷ (pot + bet + your call). With the starting example: 50 ÷ (100 + 50 + 50) = 25%.' },
      { label: 'Call / Fold verdict', meaning: 'Green Call when your equity is at least what you need. Red Fold when it falls short. It judges only this bet, not future betting.' },
    ],
    learn: 'Whether calling a bet is a good deal in any specific spot.',
  },
  {
    path: '/icm',
    title: 'Tournament Lab',
    Pip: Spade,
    pipClass: 'text-ink-100',
    what: 'Two tournament tools. The Push / Fold Trainer drills all-in or fold decisions with a short stack. The ICM Calculator shows what your chips are really worth in prize money.',
    screen: [
      { label: 'Push / Fold Trainer tab', meaning: 'You are in the small blind and everyone before you has folded. Decide to shove all-in or fold.' },
      { label: 'Your stack', meaning: 'Your chips measured in big blinds (bb). 10 bb means you have ten times the big blind.' },
      { label: 'Players to act', meaning: 'How many players behind you could still call your shove. More players means more chances to run into a strong hand.' },
      { label: 'Blinds 0.5 / 1', meaning: 'The forced bets: the small blind is half a big blind.' },
      { label: 'ICM Calculator tab', meaning: 'Type every player’s chip stack (yours first) and the prize payouts.' },
      { label: 'Bubble factor: You vs', meaning: 'Pick an opponent to see how risky an all-in against them is for you.' },
    ],
    steps: [
      'On the Push / Fold Trainer tab, look at your hand, your stack, and the players to act.',
      'Press "Fold" or "Shove all-in".',
      'Read the verdict and the shove value, then press "Next spot".',
      'Switch to the ICM Calculator tab. Type the chip stacks with yours first, separated by commas, then the payouts for 1st, 2nd, 3rd and so on.',
      'Read each player’s prize equity, then choose an opponent under Bubble factor to see how much equity you need to call an all-in from them.',
    ],
    numbers: [
      { label: 'Correct / Off', meaning: 'Graded against a standard push/fold chart (Nash equilibrium) for that stack size and number of players. This chart counts chips only, not prize money.' },
      { label: 'Shoving is worth ≈ X bb', meaning: 'An estimate of what shoving wins or loses in big blinds against a typical calling range. It is a guide, and can occasionally disagree with the chart in close spots.' },
      { label: '$ equity (ICM)', meaning: 'Each player’s fair share of the prize pool, based on their chips and the payouts.' },
      { label: '(+/− vs chips)', meaning: 'Prize equity compared with a plain chip-count share. Big stacks are usually worth less than their chips, short stacks more.' },
      { label: 'Bubble factor', meaning: 'How much more losing chips hurts than winning the same chips helps. 1.0 means neutral. 1.5 means a loss hurts 1.5 times as much.' },
      { label: 'Equity to call off', meaning: 'Bubble factor ÷ (1 + bubble factor). A bubble factor of 1.5 means you need about 60% equity to call an all-in, not 50%.' },
    ],
    learn: 'When to shove or fold with a short stack, and why prize money makes some all-ins a mistake even with a decent hand.',
  },
  {
    path: '/adversary-lab',
    title: 'Adversary Lab',
    Pip: Heart,
    pipClass: 'text-brand-400',
    what: 'Build a model of a real opponent, like a regular from your home game, by setting a few sliders. You see the hands they likely play, the leaks to attack, and you can train against them in Hand Replay.',
    screen: [
      { label: 'Name box', meaning: 'Give the player a name so you can find them later.' },
      { label: 'How many hands does he play?', meaning: 'Known as VPIP: the share of hands where they put money in before the flop. This slider builds the Modeled range grid.' },
      { label: 'How often does he raise preflop?', meaning: 'Known as PFR: the share of hands they raise before the flop. It can never be higher than the first slider. A big gap between this and the first slider means their raises are strong.' },
      { label: 'Does he c-bet the flop?', meaning: 'How often they bet the flop after raising before the flop (continuation bet).' },
      { label: 'Does he fold to 3-bets?', meaning: 'How often they fold when someone re-raises their raise.' },
      { label: 'How aggressive overall?', meaning: 'Known as aggression factor: bets and raises divided by calls. 1 is passive, 3 or more is aggressive.' },
      { label: 'Does he go to showdown a lot?', meaning: 'Known as WTSD: how often they see the hand through to the end and show cards. High means they call down a lot, low means they give up easily.' },
      { label: 'Modeled range', meaning: 'The hands this player likely plays. Bright cells are in, faded cells are out.' },
      { label: 'Exploitative adjustments', meaning: 'Specific ways to beat this player, based on the sliders.' },
    ],
    steps: [
      'Type a name for the player.',
      'Move each slider to match how they play. A guess is fine, and you can refine it later.',
      'Watch the Modeled range update as you move the first slider.',
      'Read the Exploitative adjustments to see which leaks to attack.',
      'Press "Save adversary" to keep this player. Saved players appear under "Your adversaries". Click one to edit or delete it.',
      'Press "Play vs him" to open Hand Replay with every hand dealt against this player.',
    ],
    numbers: [
      { label: 'X% of hands', meaning: 'How much of all starting hands this player’s range covers.' },
      { label: 'When adjustments appear', meaning: 'Fold to 3-bets above 65%, c-bet above 75%, plays more than 40% of hands, hands played minus hands raised is more than 15 points (when playing at least 15%), showdown above 33% or below 22%, or aggression below 1.5. Anything else shows "fairly balanced".' },
      { label: '+X EV', meaning: 'A rough score for how big each edge is, useful for comparing adjustments with each other. It is a teaching estimate, not a measured win rate.' },
      { label: 'VPIP · PFR · AF', meaning: 'The short stat line under each saved player: hands played, preflop raise rate, and aggression.' },
    ],
    learn: 'How to adjust your strategy to exploit the real people you actually play against.',
  },
  {
    path: '/dashboard',
    title: 'EV Dashboard',
    Pip: Diamond,
    pipClass: 'text-brand-400',
    what: 'Your progress report. It tracks the quality of your decisions across the tools, finds your recurring mistakes (leaks), and turns them into practice drills.',
    screen: [
      { label: 'Start here cards', meaning: 'Shown before you have played. Three first steps: learn the basics, play a hand, and explore the equity grid.' },
      { label: 'Top row', meaning: 'Your headline numbers.' },
      { label: 'Your practice queue', meaning: 'Drills built from your leaks. "Drill" opens Blitz focused on that leak, or Hand Replay.' },
      { label: 'Leaks detected', meaning: 'Mistakes you repeat, with a High, Medium or Low label and a colored dot (red, gold, green).' },
      { label: 'EV by street', meaning: 'Your Hand Replay points split by street: green bars are gains, red bars are losses.' },
    ],
    steps: [
      'Play in the other tools. Every decision is recorded automatically.',
      'Come back here to see your numbers for the last 7 days.',
      'After about 6 Hand Replay decisions, check "Leaks detected".',
      'Press "Drill" on the top item in your practice queue. When you finish a Blitz drill it is graded, and the leak keeps being re-measured as you play.',
    ],
    numbers: [
      { label: 'Total skill points', meaning: 'All the points you have earned across every tool, all time. The same number shows as SP at the top of the site.' },
      { label: 'Decision accuracy', meaning: 'The share of your decisions in the last 7 days that matched the best play.' },
      { label: 'Hands played', meaning: 'Every decision logged in the last 7 days. Each Replay street, Blitz answer, and push/fold spot counts as one.' },
      { label: 'Avg read error', meaning: 'Appears after you paint ranges in Hand Replay. The average gap between your read and the true equity. Green under 8%, gold under 15%, red above.' },
      { label: 'Leak triggers', meaning: 'Calling too wide: over 25% of your calls should have been folds. Folding to aggression: over 20% of your folds should have been calls or raises. Missing value: folding hands with 65%+ equity.' },
      { label: 'EV by street', meaning: 'Skill points, not dollars. Hand Replay decisions happen on the flop and turn, so preflop and river stay at 0.' },
    ],
    learn: 'Exactly where your game is leaking, and a plan to fix it.',
  },
];

export const TOOL_HELP_BY_PATH: Record<string, ToolHelp> = Object.fromEntries(
  TOOL_HELP.map((t) => [t.path, t]),
);

export interface Concept {
  term: string;
  plain: string;
}

// The six ideas a beginner needs. Everything the app does builds on these.
export const CONCEPTS: Concept[] = [
  {
    term: 'Equity',
    plain: 'Your chance of winning the hand right now, written as a percentage. If you have 40% equity, you win about 4 times out of 10 from this point.',
  },
  {
    term: 'Outs',
    plain: 'The cards still in the deck that would improve your hand into a winner. More outs means a better chance to catch up.',
  },
  {
    term: 'Pot odds',
    plain: 'The price you are getting to keep playing. If you must pay $25 to win a $100 pot, you are getting a good price and only need to win about 20% of the time to break even.',
  },
  {
    term: 'Expected value (EV)',
    plain: 'Whether a decision makes money on average if you made it many times. A play can be correct (positive EV) even when it loses this one time. Good poker is about making +EV decisions, not about any single result.',
  },
  {
    term: 'Ranges',
    plain: 'You never know your opponent’s exact two cards, so instead you think about the whole set of hands they could have. That set is their range.',
  },
  {
    term: 'Reading opponents',
    plain: 'Narrowing an opponent’s range based on how they bet and act. This is the real skill, and it is the thing most trainers skip. This app is built around it.',
  },
];
