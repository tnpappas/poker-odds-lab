// Leak -> drill loop: turn a detected weakness into a scheduled, repeatable
// practice item. Detection lives in the dashboard/leakDetector; this module owns
// the "what do I practice next, and when" half — a lightweight SM-2-style
// spaced-repetition scheduler plus the mapping from each leak to the drill that
// fixes it. This closed loop (detect -> drill -> re-measure) is the retention
// mechanic competitors don't package.

export type LeakType =
  | 'calling_too_wide'
  | 'folding_to_aggression'
  | 'missing_value'
  | 'overfolding_pot_odds'
  | 'weak_reads';

/** Which trainer a leak sends you to, and the Blitz scenario kind if applicable. */
export interface LeakMeta {
  label: string;
  why: string;
  /** Where the drill runs. */
  trainer: 'blitz' | 'replay';
  /** Blitz scenario kind to bias toward (when trainer === 'blitz'). */
  blitzKind?: 'pot_odds' | 'ev_call' | 'rule_2_4' | 'bet_sizing';
}

export const LEAK_META: Record<LeakType, LeakMeta> = {
  calling_too_wide: {
    label: 'Calling too wide',
    why: 'You call off with less equity than the price demands. Drill pot-odds discipline.',
    trainer: 'blitz',
    blitzKind: 'pot_odds',
  },
  overfolding_pot_odds: {
    label: 'Folding correct prices',
    why: 'You fold hands that were getting the right price. Drill the pot-odds threshold.',
    trainer: 'blitz',
    blitzKind: 'pot_odds',
  },
  folding_to_aggression: {
    label: 'Folding to aggression',
    why: 'You over-respect bets. Drill +EV/−EV calls so you defend enough.',
    trainer: 'blitz',
    blitzKind: 'ev_call',
  },
  missing_value: {
    label: 'Missing value',
    why: 'You under-bet or check strong hands. Drill bet-sizing for value.',
    trainer: 'blitz',
    blitzKind: 'bet_sizing',
  },
  weak_reads: {
    label: 'Inaccurate reads',
    why: 'Your painted ranges miss the true range. Drill live hands with the range-guess mechanic.',
    trainer: 'replay',
  },
};

export interface DrillCard {
  id: string;
  leak: LeakType;
  /** SM-2 ease factor. */
  ease: number;
  /** Current interval in days. */
  intervalDays: number;
  /** Epoch ms when this card is next due. */
  dueTs: number;
  /** Successful reviews in a row. */
  reps: number;
  /** Times failed. */
  lapses: number;
  /** Detected severity 0..1, used to prioritize the queue. */
  severity: number;
}

const DAY = 86_400_000;
const MIN_EASE = 1.3;

function makeId(leak: LeakType): string {
  // One card per leak, so re-detecting the same leak updates it rather than piling up.
  return `drill_${leak}`;
}

export function newDrillCard(leak: LeakType, severity = 0.5, now = Date.now()): DrillCard {
  return {
    id: makeId(leak),
    leak,
    ease: 2.5,
    intervalDays: 0,
    dueTs: now, // due immediately
    reps: 0,
    lapses: 0,
    severity: Math.max(0, Math.min(1, severity)),
  };
}

/**
 * Grade a completed drill and schedule the next review.
 * quality: 0 = failed, 1 = shaky, 2 = good, 3 = easy.
 */
export function reviewDrill(card: DrillCard, quality: 0 | 1 | 2 | 3, now = Date.now()): DrillCard {
  const next: DrillCard = { ...card };
  if (quality < 2) {
    next.reps = 0;
    next.lapses += 1;
    next.intervalDays = 0;
    next.dueTs = now + 10 * 60_000; // re-drill in ~10 minutes
    next.ease = Math.max(MIN_EASE, card.ease - 0.2);
    return next;
  }
  next.reps = card.reps + 1;
  next.ease = Math.max(MIN_EASE, card.ease + (quality === 3 ? 0.15 : 0) - (quality === 2 ? 0 : 0.15));
  next.intervalDays = next.reps === 1 ? 1 : next.reps === 2 ? 3 : Math.round(card.intervalDays * next.ease);
  next.dueTs = now + next.intervalDays * DAY;
  // Learning it down reduces its effective severity for prioritization.
  next.severity = Math.max(0, card.severity - 0.15 * (quality - 1));
  return next;
}

/** Is this card due for review now? */
export function isDue(card: DrillCard, now = Date.now()): boolean {
  return card.dueTs <= now;
}

/**
 * Reconcile freshly-detected leaks with existing drill cards: keep progress on
 * leaks that persist, add cards for new leaks, and retire cards whose leak is no
 * longer detected (it's fixed).
 */
export function syncDrillCards(
  detected: { leak: LeakType; severity: number }[],
  existing: DrillCard[],
  now = Date.now(),
): DrillCard[] {
  const byLeak = new Map(existing.map((c) => [c.leak, c]));
  const out: DrillCard[] = [];
  for (const d of detected) {
    const prev = byLeak.get(d.leak);
    if (prev) out.push({ ...prev, severity: Math.max(prev.severity, d.severity) });
    else out.push(newDrillCard(d.leak, d.severity, now));
  }
  return out;
}

/**
 * Ordered practice queue: due cards first, most severe first, then soonest due.
 * Non-due cards are excluded — nothing to practice until they come back around.
 */
export function buildDrillQueue(cards: DrillCard[], now = Date.now()): DrillCard[] {
  return cards
    .filter((c) => isDue(c, now))
    .sort((a, b) => b.severity - a.severity || a.dueTs - b.dueTs);
}
