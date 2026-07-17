import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LEAK_META, buildDrillQueue, type LeakType } from '@pol/poker-engine';
import { useGameStore, type Decision, type Street } from '../../store/useGameStore';

interface Leak {
  type: string;
  label: string;
  severity: number; // 0..1
  detail: string;
}

function detectLeaks(decisions: Decision[]): Leak[] {
  const replay = decisions.filter((d) => d.mode === 'replay').slice(0, 200);
  if (replay.length < 6) return [];
  const leaks: Leak[] = [];

  const calls = replay.filter((d) => d.userAction === 'call');
  const folds = replay.filter((d) => d.userAction === 'fold');

  const callTooWide = calls.filter((d) => d.correctAction === 'fold').length / Math.max(1, calls.length);
  if (callTooWide > 0.25) {
    leaks.push({
      type: 'calling_too_wide',
      label: 'Calling too wide',
      severity: Math.min(1, callTooWide / 0.4),
      detail: `${Math.round(callTooWide * 100)}% of your calls were below the price you needed.`,
    });
  }

  const foldTooMuch = folds.filter((d) => d.correctAction !== 'fold').length / Math.max(1, folds.length);
  if (foldTooMuch > 0.2) {
    leaks.push({
      type: 'folding_to_aggression',
      label: 'Folding to aggression',
      severity: Math.min(1, foldTooMuch / 0.35),
      detail: `${Math.round(foldTooMuch * 100)}% of your folds were actually +EV calls or raises.`,
    });
  }

  const missedValue = folds.filter((d) => d.actualEquity > 0.65).length / Math.max(1, replay.length);
  if (missedValue > 0.12) {
    leaks.push({
      type: 'missing_value',
      label: 'Missing value',
      severity: Math.min(1, missedValue / 0.25),
      detail: `You folded strong hands (65%+ equity) ${Math.round(missedValue * 100)}% of the time.`,
    });
  }

  return leaks.sort((a, b) => b.severity - a.severity);
}

const STREETS: Street[] = ['preflop', 'flop', 'turn', 'river'];

export function Dashboard() {
  const decisions = useGameStore((s) => s.decisions);
  const skillPoints = useGameStore((s) => s.skillPoints);
  const drills = useGameStore((s) => s.drills);
  const syncDrills = useGameStore((s) => s.syncDrills);

  const week = useMemo(() => decisions.filter((d) => d.ts > Date.now() - 7 * 864e5), [decisions]);
  const replay = week.filter((d) => d.mode === 'replay');

  const accuracy = week.length ? Math.round((week.filter((d) => d.correct).length / week.length) * 100) : 0;
  const leaks = useMemo(() => detectLeaks(decisions), [decisions]);
  useEffect(() => {
    syncDrills(leaks.map((l) => ({ leak: l.type as LeakType, severity: l.severity })));
  }, [leaks, syncDrills]);
  const queue = useMemo(() => buildDrillQueue(drills), [drills]);

  const reads = week.filter((d) => d.type === 'range_read' && d.userEquityEstimate != null);
  const readError = reads.length
    ? Math.round((reads.reduce((acc, d) => acc + Math.abs((d.userEquityEstimate as number) - d.actualEquity), 0) / reads.length) * 1000) / 10
    : null;

  const evByStreet = useMemo(() => {
    const m: Record<Street, number> = { preflop: 0, flop: 0, turn: 0, river: 0 };
    for (const d of replay) m[d.street] += d.evResult;
    return m;
  }, [replay]);
  const maxAbs = Math.max(1, ...STREETS.map((s) => Math.abs(evByStreet[s])));

  if (decisions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14">
        <div className="eyebrow mb-3">Start here</div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Welcome to the lab</h1>
        <p className="text-ink-300 mt-4 max-w-xl leading-relaxed">
          This dashboard fills in as you play. It tracks how good your decisions are and finds your leaks automatically.
          Brand new to poker? Do these three things in order.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <StartCard n="01" title="Learn the basics" desc="Five minutes on the core ideas: equity, pot odds, EV, and reading ranges." to="/guide" cta="How it works" />
          <StartCard n="02" title="Play a hand" desc="Make real call, fold, or raise decisions and get the reason behind each one." to="/replay" cta="Play a hand" primary />
          <StartCard n="03" title="See the numbers" desc="Explore the win odds for every starting hand on the visual grid." to="/visualizer" cta="Explore equity" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <header className="my-6 flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Your EV report, last 7 days</h1>
        <Link to="/guide" className="text-xs text-ink-500 hover:text-ink-300 shrink-0">New here? Read the guide</Link>
      </header>

      <div className={`grid ${readError != null ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-3 mb-6`}>
        <Big label="Total skill points" value={`${skillPoints >= 0 ? '+' : ''}${Math.round(skillPoints)}`} color={skillPoints >= 0 ? 'text-chip-green' : 'text-chip-red'} />
        <Big label="Decision accuracy" value={`${accuracy}%`} />
        <Big label="Hands played" value={String(week.length)} />
        {readError != null && <Big label="Avg read error" value={`${readError}%`} color={readError < 8 ? 'text-chip-green' : readError < 15 ? 'text-gold-400' : 'text-chip-red'} />}
      </div>

      {queue.length > 0 && (
        <div className="rounded-2xl bg-felt-900 border border-gold-500/40 p-5 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold">Your practice queue</h2>
            <span className="text-xs text-ink-500">{queue.length} due · fixes your top leaks</span>
          </div>
          <p className="text-xs text-ink-500 mb-4">Each leak we detect becomes a targeted drill. Clear it, and we re-measure to confirm it's closing.</p>
          <div className="space-y-3">
            {queue.map((card) => {
              const meta = LEAK_META[card.leak];
              const to = meta.trainer === 'blitz'
                ? `/blitz?focus=${meta.blitzKind}&drill=${card.leak}`
                : '/replay';
              return (
                <div key={card.id} className="flex items-center justify-between gap-3 rounded-xl bg-felt-950/60 p-3">
                  <div className="min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: sevColor(card.severity) }} />
                      {meta.label}
                      {card.reps > 0 && <span className="text-[10px] uppercase text-ink-500">· streak {card.reps}</span>}
                    </div>
                    <p className="text-xs text-ink-300 mt-0.5">{meta.why}</p>
                  </div>
                  <Link to={to} className="shrink-0 px-4 py-2 rounded-xl bg-gold-500 text-felt-950 text-sm font-bold hover:bg-gold-400 transition">
                    Drill →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Leaks */}
        <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5">
          <h2 className="font-bold mb-4">Leaks detected</h2>
          {leaks.length === 0 ? (
            <p className="text-ink-300 text-sm">No significant leaks yet. Keep playing for a deeper read (about 6 or more replay hands).</p>
          ) : (
            <div className="space-y-3">
              {leaks.map((l) => (
                <div key={l.type} className="rounded-xl bg-felt-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: sevColor(l.severity) }} /> {l.label}
                    </span>
                    <span className="text-xs uppercase text-ink-500">{l.severity > 0.66 ? 'High' : l.severity > 0.33 ? 'Medium' : 'Low'}</span>
                  </div>
                  <p className="text-xs text-ink-300 mt-1">{l.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EV by street */}
        <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5">
          <h2 className="font-bold mb-4">EV by street</h2>
          <div className="space-y-3">
            {STREETS.map((s) => {
              const v = evByStreet[s];
              const pct = (Math.abs(v) / maxAbs) * 100;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-16 text-sm capitalize text-ink-300">{s}</span>
                  <div className="flex-1 h-5 rounded-full bg-felt-950/60 relative overflow-hidden">
                    <div className={`h-full rounded-full ${v >= 0 ? 'bg-chip-green' : 'bg-chip-red'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`w-16 text-right text-sm font-semibold ${v >= 0 ? 'text-chip-green' : 'text-chip-red'}`}>
                    {v >= 0 ? '+' : ''}{Math.round(v)}
                  </span>
                </div>
              );
            })}
          </div>
          {replay.length === 0 && <p className="text-xs text-ink-500 mt-3">Play Hand Replay to populate EV by street.</p>}
        </div>
      </div>
    </div>
  );
}

function Big({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl bg-felt-900 border border-felt-700 py-4 text-center">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`num text-2xl font-bold ${color ?? 'text-ink-100'}`}>{value}</div>
    </div>
  );
}

function sevColor(sev: number): string {
  if (sev > 0.66) return 'var(--color-chip-red)';
  if (sev > 0.33) return 'var(--color-brass-400)';
  return 'var(--color-chip-green)';
}

/** First-run "start here" step card. */
function StartCard({ n, title, desc, to, cta, primary }: { n: string; title: string; desc: string; to: string; cta: string; primary?: boolean }) {
  return (
    <div className="felt-card rounded-2xl p-5 flex flex-col">
      <span className="num text-brand-400 text-sm">{n}</span>
      <h3 className="font-display text-lg font-semibold tracking-tight mt-2">{title}</h3>
      <p className="text-ink-300 text-sm mt-1 leading-relaxed">{desc}</p>
      <Link to={to}
        className={`mt-4 inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition ${
          primary ? 'bg-brand-500 text-white hover:bg-brand-400' : 'border border-felt-700 text-ink-100 hover:border-brand-400/60'
        }`}>
        {cta} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
