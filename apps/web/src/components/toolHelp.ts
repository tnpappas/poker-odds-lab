/**
 * Beginner-friendly explanations for each tool, shared by the Guide page and
 * the in-app "How to use" button. Plain English, no jargon left undefined.
 */
import { Spade, Heart, Diamond, Club } from './icons';
import type { ComponentType } from 'react';

type SuitProps = { size?: number; className?: string };

export interface ToolHelp {
  path: string;
  title: string;
  Pip: ComponentType<SuitProps>;
  pipClass: string;
  what: string;
  steps: string[];
  learn: string;
}

export const TOOL_HELP: ToolHelp[] = [
  {
    path: '/replay',
    title: 'Hand Replay',
    Pip: Spade,
    pipClass: 'text-ink-100',
    what: 'A poker hand plays out one step at a time. At each big decision it pauses and asks you what you would do: call, fold, or raise.',
    steps: [
      'Watch the hand deal out. When it pauses, look at the pot size, your cards, and how much you have to pay to stay in.',
      'Pick call, fold, or raise.',
      'The app then shows the right answer and, more importantly, why, in plain language.',
      'You earn points for good decisions, not for winning the pot, so you are rewarded for thinking correctly even when the cards do not cooperate.',
    ],
    learn: 'How to make the mathematically correct call or fold in real situations, and why it is correct.',
  },
  {
    path: '/visualizer',
    title: 'Equity Visualizer',
    Pip: Diamond,
    pipClass: 'text-brand-400',
    what: 'A colored grid of all 169 starting hands. Green hands are strong, red hands are weak. It shows your chance of winning with each one.',
    steps: [
      'Look at the grid. Pairs run down the diagonal, and the color tells you how strong each hand is.',
      'Click any hand to see its exact win percentage.',
      'Drag the range slider to change how many hands your opponent is holding and watch your numbers update instantly.',
    ],
    learn: 'Which starting hands are actually strong, and how their value changes depending on what your opponent could have.',
  },
  {
    path: '/blitz',
    title: 'Mental Math Blitz',
    Pip: Heart,
    pipClass: 'text-brand-400',
    what: 'A fast 30-second quiz game. Quick poker math questions flash on screen and you answer as many as you can.',
    steps: [
      'A question appears, for example "the price says you need 25% to call, you have 40%, is it a call?"',
      'Tap the answer before the timer runs out.',
      'Keep a streak going for bonus points. Miss three in a row and the round ends.',
    ],
    learn: 'To do the key poker math fast enough to use it at a real table, without a calculator.',
  },
  {
    path: '/calculator',
    title: 'Equity Calculator',
    Pip: Club,
    pipClass: 'text-ink-100',
    what: 'A quick answer machine. Enter your cards, the board, and what you think your opponent has, and it tells you your chance of winning.',
    steps: [
      'Pick your two cards.',
      'Add the community cards on the board (as many as are showing).',
      'Set your opponent’s likely hands, then read your win percentage and whether the price you are being offered is worth it.',
    ],
    learn: 'Whether calling a bet is a good deal in any specific spot.',
  },
  {
    path: '/icm',
    title: 'Tournament Lab',
    Pip: Spade,
    pipClass: 'text-ink-100',
    what: 'Tournaments have their own math because your chips are worth real prize money. This trainer teaches the push-or-fold decisions that decide them.',
    steps: [
      'You are given a tournament spot with a short chip stack.',
      'Decide whether to go all-in or fold based on your cards and position.',
      'The app shows the correct play using tournament prize math, not just raw card strength.',
    ],
    learn: 'When to shove all-in or fold near the money, where most tournament mistakes happen.',
  },
  {
    path: '/adversary-lab',
    title: 'Adversary Lab',
    Pip: Heart,
    pipClass: 'text-brand-400',
    what: 'A place to build a model of a specific opponent, for example a regular from your home game, by answering a few questions about how they play.',
    steps: [
      'Name your opponent and answer six simple sliders (how many hands they play, how aggressive they are, and so on).',
      'The app turns that into a realistic set of hands they tend to hold.',
      'Train against that exact style and see how your best plays change to beat them.',
    ],
    learn: 'How to adjust your strategy to exploit the real people you actually play against.',
  },
  {
    path: '/dashboard',
    title: 'EV Dashboard',
    Pip: Diamond,
    pipClass: 'text-brand-400',
    what: 'Your progress report. It tracks the quality of your decisions over time and points out your recurring mistakes, called leaks.',
    steps: [
      'Play sessions in the other tools. Every decision is recorded automatically.',
      'Open the dashboard to see your accuracy, your points, and where you are losing value.',
      'Follow the suggested drills that target your specific weak spots.',
    ],
    learn: 'Exactly where your game is leaking money, and a plan to fix it.',
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
