import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { useReducedMotion } from 'framer-motion';
import { parseRangeString, rangeToMatrix } from '@pol/poker-engine';

/**
 * Homepage hero overlay: the math panel that sits on top of the looping table video.
 *
 * The VIDEO shows the cards (A♠K♥ vs a Q♠ T♥ 2♣ flop already out; the turn J♦ and
 * river 7♣ are dealt on camera). This overlay shows only the analysis, and it is
 * driven by the video's playhead so the numbers change at the moment each card lands.
 *
 * Every number is REAL and comes from the poker engine. They were computed with
 * scripts/hero-video/hero-math.ts (exact enumeration vs. the villain range) and are
 * hard-coded so the hero costs zero CPU on load:
 *
 *   Hero A♠K♥ vs villain range 22+, A9s+, KTs+, QTs+, JTs, ATo+, KQo
 *   flop  Q♠ T♥ 2♣     39.6%   villain bets 4 into 6 -> hero needs 28.6% -> CALL
 *   turn  J♦           92.0%   nut straight -> RAISE
 *   river 7♣           96.1%   -> RAISE
 *
 * If the hand, range, or video timing changes, re-run hero-math.ts and update
 * STREETS / the `at` timestamps below.
 */

const VILLAIN_RANGE = '22+,A9s+,KTs+,QTs+,JTs,ATo+,KQo';
const VILLAIN_LABEL = '22+ A9s+ KTs+ QTs+ JTs ATo+ KQo';

type Decision = 'FOLD' | 'CALL' | 'RAISE';
type Street = {
  name: string;
  board: string;
  at: number; // video time (seconds) at which this street's card has landed
  equity: number; // percent, from the engine
  decision: Decision;
  note: string;
  potOdds?: { pot: number; bet: number; need: number };
};

// `at` values are set to the moments the turn and river cards land in table-loop.webm.
export const STREETS: Street[] = [
  {
    name: 'Flop',
    board: 'Q♠ T♥ 2♣',
    at: 0,
    equity: 39.6,
    decision: 'CALL',
    note: 'Gutshot plus two overcards. 39.6% beats the 28.6% the price demands.',
    potOdds: { pot: 6, bet: 4, need: 28.6 },
  },
  { name: 'Turn', board: 'Q♠ T♥ 2♣ J♦', at: 3.5, equity: 92.0, decision: 'RAISE', note: 'Broadway. Only a chop can stop you now.' },
  { name: 'River', board: 'Q♠ T♥ 2♣ J♦ 7♣', at: 7.35, equity: 96.1, decision: 'RAISE', note: 'Value bet. The math said so on every street.' },
];

// The overlay fades out over the last part of the loop while the table resets.
const FADE_OUT_AT = 9.25;

// 13x13 villain range from the engine (rows/cols A..2, upper-right = suited).
const RANGE_MATRIX = rangeToMatrix(parseRangeString(VILLAIN_RANGE));
const LABEL = 'font-mono uppercase tracking-[0.2em] text-[10px] text-brass-400';
// Holographic HUD: no opaque card behind the data, so the felt and cards stay visible.
// Thin bone-white frame, faint brass glow, text carries its own shadow for legibility.
const HUD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(243,240,234,0.05), rgba(243,240,234,0.015) 60%, rgba(0,0,0,0))',
  border: '1px solid rgba(243,240,234,0.22)',
  boxShadow: '0 0 0 1px rgba(211,172,87,0.10), 0 0 28px -6px rgba(211,172,87,0.35), inset 0 0 40px -30px rgba(243,240,234,0.35)',
  textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 14px rgba(0,0,0,0.85)',
};
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

/** Tweens a number toward `target` over ~900 ms so the readout "recalculates". */
function useTween(target: number, instant: boolean) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (instant) {
      setValue(target);
      from.current = target;
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
      from.current = v;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, instant]);
  return value;
}

/** Follows the hero video's playhead: returns the current street index and whether we are in the fade-out. */
function useVideoStreet(video: React.RefObject<HTMLVideoElement | null>, frozen: boolean) {
  const [idx, setIdx] = useState(frozen ? STREETS.length - 1 : 0);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (frozen) return;
    let raf = 0;
    const tick = () => {
      const v = video.current;
      if (v) {
        const t = v.currentTime;
        let i = 0;
        for (let k = 0; k < STREETS.length; k++) if (t >= STREETS[k].at) i = k;
        setIdx(i);
        setHidden(t >= FADE_OUT_AT);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [video, frozen]);
  return { idx, hidden };
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
                  : 'border-white/20 text-ink-300/70'
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
                w > 0 ? (r === c ? 'rgba(232,83,91,0.95)' : 'rgba(217,59,68,0.65)') : 'rgba(243,240,234,0.10)',
            }}
          />
        )),
      )}
    </div>
  );
}

export function HeroHandAnalysis({ video }: { video: React.RefObject<HTMLVideoElement | null> }) {
  const reduce = !!useReducedMotion();
  const { idx, hidden } = useVideoStreet(video, reduce);
  const street = STREETS[idx];
  const equity = useTween(street.equity, reduce);
  const need = street.potOdds?.need;
  const good = need == null ? true : street.equity >= need;

  const fade: React.CSSProperties = {
    opacity: hidden ? 0 : 1,
    transition: 'opacity 600ms ease',
  };

  return (
    <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0 z-[5]">
      {/* ---------- Desktop: analysis panel, top-right, clear of the headline ---------- */}
      <div
        className="hidden lg:block absolute right-[4%] top-[9%] w-[34%] xl:w-[36%] max-w-[440px] rounded-2xl p-4"
        style={{ ...HUD_STYLE, ...fade }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`${LABEL} mb-1`}>{street.name} · A♠K♥ vs range</div>
            <div className="num text-[11px] text-ink-300 mb-2">board {street.board}</div>
            <div className="flex items-baseline gap-2">
              <span className="num text-ink-100 text-3xl font-semibold leading-none">
                {equity.toFixed(1)}
                <span className="text-ink-300 text-lg">%</span>
              </span>
              <span className="text-ink-300 text-[11px] uppercase tracking-[0.18em]">equity</span>
            </div>
            <div className="mt-2 h-1.5 w-40 rounded-full bg-white/15 overflow-hidden" style={{ boxShadow: '0 0 10px rgba(211,172,87,0.35)' }}>
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

      {/* ---------- Tablet / phone: compact readout pinned bottom-right ---------- */}
      <div
        className="lg:hidden absolute right-4 bottom-6 rounded-xl px-3 py-2 flex items-center gap-3"
        style={{ ...HUD_STYLE, ...fade }}
      >
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
  );
}
