import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { useReducedMotion } from 'framer-motion';
import { parseRangeString, rangeToMatrix } from '@pol/poker-engine';
import type { Card } from '@pol/poker-engine';
import { PlayingCard } from './PlayingCard';

/**
 * Homepage hero overlay: Poker Logic Lab analyzing one hand, street by street.
 *
 * Every number here is REAL and comes from the poker engine, so a poker-literate
 * visitor can check it. Equities were computed with scripts/hero-video/hero-math.ts
 * (exact enumeration vs. the villain range on the flop/turn/river, 2M-sample
 * Monte Carlo preflop) and are hard-coded so the hero costs zero CPU on load.
 *
 *   Hero A♠K♥ vs villain range 22+, A9s+, KTs+, QTs+, JTs, ATo+, KQo
 *   preflop            55.9%
 *   flop  Q♠ T♥ 2♣     39.6%   villain bets 4 into 6 -> hero needs 28.6% -> CALL
 *   turn  J♦           92.0%   nut straight -> RAISE
 *   river 7♣           96.1%   -> RAISE
 *
 * If the hand or range changes, re-run hero-math.ts and update the table below.
 */

const HERO: [Card, Card] = ['As', 'Kh'];
const VILLAIN_RANGE = '22+,A9s+,KTs+,QTs+,JTs,ATo+,KQo';
const VILLAIN_LABEL = '22+ A9s+ KTs+ QTs+ JTs ATo+ KQo';
const BOARD: Card[] = ['Qs', 'Th', '2c', 'Jd', '7c'];

type Decision = 'FOLD' | 'CALL' | 'RAISE';
type Street = {
  name: string;
  boardCount: number; // how many board cards are face up
  equity: number; // percent, from the engine
  decision: Decision;
  note: string;
  potOdds?: { pot: number; bet: number; need: number };
};

const STREETS: Street[] = [
  { name: 'Preflop', boardCount: 0, equity: 55.9, decision: 'RAISE', note: 'Ahead of the range. Build the pot.' },
  {
    name: 'Flop',
    boardCount: 3,
    equity: 39.6,
    decision: 'CALL',
    note: 'Gutshot + two overcards. 39.6% beats the 28.6% you need.',
    potOdds: { pot: 6, bet: 4, need: 28.6 },
  },
  { name: 'Turn', boardCount: 4, equity: 92.0, decision: 'RAISE', note: 'Broadway. Only a chop can stop you now.' },
  { name: 'River', boardCount: 5, equity: 96.1, decision: 'RAISE', note: 'Value bet. The math said so on every street.' },
];

// Seconds each street is on screen; the last one lingers before the loop restarts.
const STREET_SECONDS = [3.4, 4.6, 3.6, 4.4];

// 13x13 villain range from the engine (rows/cols A..2, upper-right = suited).
const RANGE_MATRIX = rangeToMatrix(parseRangeString(VILLAIN_RANGE));
const LABEL = 'font-mono uppercase tracking-[0.2em] text-[10px] text-brass-400';
const HUD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0) 40%), rgba(20,20,22,0.78)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px -22px rgba(0,0,0,0.9)',
  backdropFilter: 'blur(3px)',
  WebkitBackdropFilter: 'blur(3px)',
};
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

/** Tweens a number toward `target` over ~900 ms so the readout "recalculates". */
function useTween(target: number, instant: boolean) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (instant) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const begin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const e = 1 - Math.pow(1 - t, 3);
      const v = begin + (target - begin) * e;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, instant]);
  return value;
}

function DecisionTree({ active }: { active: Decision }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`${LABEL} text-ink-300`}>Decision</span>
      <span className="h-px w-5 bg-brass-400/40" />
      <div className="flex gap-1.5">
        {(['FOLD', 'CALL', 'RAISE'] as Decision[]).map((d) => {
          const on = d === active;
          return (
            <span
              key={d}
              className={`num rounded-md px-2 py-0.5 text-[11px] tracking-[0.12em] border transition-all duration-500 ${
                on
                  ? 'border-brand-400/80 bg-brand-500/25 text-ink-100 shadow-[0_0_18px_-4px_rgba(217,59,68,0.9)]'
                  : 'border-white/10 text-ink-500'
              }`}
            >
              {d}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function RangeGrid() {
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: 'repeat(13, 7px)' }} aria-hidden="true">
      {RANGE_MATRIX.flatMap((row, r) =>
        row.map((w, c) => (
          <span
            key={`${r}-${c}`}
            title={`${RANKS[r]}${RANKS[c]}`}
            className="block h-[7px] w-[7px] rounded-[1px]"
            style={{
              background:
                w > 0
                  ? r === c
                    ? 'rgba(217,59,68,0.85)'
                    : 'rgba(217,59,68,0.55)'
                  : 'rgba(243,240,234,0.07)',
            }}
          />
        )),
      )}
    </div>
  );
}

export function HeroHandAnalysis() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(reduce ? STREETS.length - 1 : 0);
  const [cycle, setCycle] = useState(0);

  // Street scheduler: advances through STREETS, then restarts (key change re-deals the cards).
  useEffect(() => {
    if (reduce) return;
    let i = 0;
    let timer = 0;
    const step = () => {
      timer = window.setTimeout(() => {
        i += 1;
        if (i >= STREETS.length) {
          i = 0;
          setCycle((c) => c + 1);
        }
        setIdx(i);
        step();
      }, STREET_SECONDS[i] * 1000);
    };
    step();
    return () => window.clearTimeout(timer);
  }, [reduce]);

  const street = STREETS[idx];
  const equity = useTween(street.equity, !!reduce);
  const need = street.potOdds?.need;
  const good = need == null ? true : street.equity >= need;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 z-[5]"
    >
      {/* ---------- Desktop / tablet: full analysis panel over the right half ---------- */}
      <div className="hidden lg:block absolute right-[4%] top-1/2 -translate-y-1/2 w-[38%] xl:w-[42%] max-w-[520px]">
        {/* Board + hole cards, sitting "on the felt" */}
        <div key={cycle} className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {BOARD.map((c, i) => (
              <PlayingCard key={c} card={c} size="sm" faceDown={i >= street.boardCount} delay={0.08 * i} />
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex gap-1 -rotate-6 origin-bottom">
              <PlayingCard card={HERO[0]} size="md" delay={0.05} />
            </div>
            <div className="flex gap-1 rotate-6 origin-bottom -ml-3">
              <PlayingCard card={HERO[1]} size="md" delay={0.15} />
            </div>
          </div>
        </div>

        {/* HUD */}
        <div className="mt-4 rounded-2xl p-4" style={HUD_STYLE}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`${LABEL} mb-1`}>{street.name} · A♠K♥ vs range</div>
              <div className="flex items-baseline gap-2">
                <span className="num text-ink-100 text-3xl font-semibold leading-none">
                  {equity.toFixed(1)}
                  <span className="text-ink-300 text-lg">%</span>
                </span>
                <span className="text-ink-300 text-[11px] uppercase tracking-[0.18em]">equity</span>
              </div>
              {/* Equity bar */}
              <div className="mt-2 h-1.5 w-44 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${equity}%`,
                    background: 'linear-gradient(90deg, var(--color-chip-red), var(--color-brass-400), var(--color-chip-green))',
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`${LABEL} text-ink-500`}>Villain range</span>
              <RangeGrid />
              <span className="num text-[10px] text-ink-500 mt-0.5">{VILLAIN_LABEL}</span>
            </div>
          </div>

          <div className="inlay my-3" />

          <div className="flex items-center justify-between gap-3">
            <DecisionTree active={street.decision} />
            {street.potOdds && (
              <div className="num text-[11px] text-ink-300 text-right leading-tight">
                bet {street.potOdds.bet} into {street.potOdds.pot}
                <br />
                need <span className={good ? 'text-chip-green' : 'text-chip-red'}>{street.potOdds.need}%</span>
              </div>
            )}
          </div>
          <p className="mt-2.5 text-[12px] leading-snug text-ink-300">{street.note}</p>
        </div>
      </div>

      {/* ---------- Phone: compact readout pinned bottom-right ---------- */}
      <div className="lg:hidden absolute right-4 bottom-6 flex flex-col items-end gap-2">
        <div key={cycle} className="flex gap-1">
          {BOARD.map((c, i) => (
            <PlayingCard key={c} card={c} size="sm" faceDown={i >= street.boardCount} delay={0.06 * i} />
          ))}
        </div>
        <div className="rounded-xl px-3 py-2 flex items-center gap-3" style={HUD_STYLE}>
          <div>
            <div className={`${LABEL} text-[9px]`}>{street.name} · A♠K♥</div>
            <div className="num text-ink-100 text-xl font-semibold leading-none">
              {equity.toFixed(1)}
              <span className="text-ink-300 text-xs">%</span>
            </div>
          </div>
          <span className="num rounded-md px-2 py-0.5 text-[10px] tracking-[0.12em] border border-brand-400/80 bg-brand-500/25 text-ink-100">
            {street.decision}
          </span>
        </div>
      </div>
    </div>
  );
}
