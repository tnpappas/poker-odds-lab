import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  icmEquities,
  bubbleFactor,
  shoveEV,
  nashShoveRange,
  shouldShove,
  allHandLabels,
  representativeCombo,
  type Card,
} from '@pol/poker-engine';
import { CardRow } from '../../components/PlayingCard';
import { useGameStore } from '../../store/useGameStore';

type Tab = 'push' | 'icm';

export function IcmTrainer() {
  const [tab, setTab] = useState<Tab>('push');
  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <header className="text-center my-6">
        <h1 className="text-2xl font-bold">Tournament Lab</h1>
        <p className="text-ink-300 text-sm">Learn the math that actually decides tournaments — push/fold and ICM — without a $130/mo solver.</p>
      </header>

      <div className="flex gap-2 justify-center mb-6">
        <TabBtn active={tab === 'push'} onClick={() => setTab('push')}>Push / Fold Trainer</TabBtn>
        <TabBtn active={tab === 'icm'} onClick={() => setTab('icm')}>ICM Calculator</TabBtn>
      </div>

      {tab === 'push' ? <PushFold /> : <IcmCalc />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${active ? 'border-gold-500 text-gold-400 bg-gold-500/10' : 'border-felt-700 text-ink-300 hover:text-ink-100'}`}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Push / Fold trainer
// ─────────────────────────────────────────────────────────────────────────────

const STACKS = [5, 8, 10, 12, 15, 20];
const LABELS = allHandLabels();

interface Spot {
  label: string;
  cards: [Card, Card];
  stackBB: number;
  playersToAct: number;
  correctShove: boolean;
}

function dealSpot(): Spot {
  const label = LABELS[Math.floor(Math.random() * LABELS.length)];
  const stackBB = STACKS[Math.floor(Math.random() * STACKS.length)];
  const playersToAct = 1 + Math.floor(Math.random() * 3);
  return {
    label,
    cards: representativeCombo(label),
    stackBB,
    playersToAct,
    correctShove: shouldShove(label, stackBB, playersToAct),
  };
}

function PushFold() {
  const [spot, setSpot] = useState<Spot>(() => dealSpot());
  const [result, setResult] = useState<null | { correct: boolean; chose: 'shove' | 'fold'; ev: number }>(null);
  const [streak, setStreak] = useState(0);
  const logDecision = useGameStore((s) => s.logDecision);

  const decide = (chose: 'shove' | 'fold') => {
    if (result) return;
    const correct = (chose === 'shove') === spot.correctShove;
    // Illustrative EV of shoving vs a tighter calling range.
    const callRange = nashShoveRange(Math.max(3, spot.stackBB * 0.6), spot.playersToAct);
    const { ev } = shoveEV(spot.cards, spot.stackBB, callRange, 0.38, 1.5, 4000);
    setResult({ correct, chose, ev });
    setStreak((s) => (correct ? s + 1 : 0));
    logDecision({
      mode: 'blitz',
      street: 'preflop',
      type: 'ev_call',
      userAction: chose === 'shove' ? 'raise' : 'fold',
      correctAction: spot.correctShove ? 'raise' : 'fold',
      correct,
      actualEquity: 0,
      evResult: correct ? 8 : -8,
      potSize: 0,
      betSize: spot.stackBB,
    });
  };

  const next = () => {
    setResult(null);
    setSpot(dealSpot());
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-3 text-sm text-ink-300">
        <span>Open-shove or fold from the small blind.</span>
        <span>Streak <span className="font-bold text-chip-green">{streak}🔥</span></span>
      </div>

      <div className="rounded-3xl bg-gradient-to-b from-felt-800 to-felt-950 border border-felt-700 p-6 shadow-2xl text-center">
        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          <Mini label="Your stack" value={`${spot.stackBB} bb`} />
          <Mini label="Players to act" value={String(spot.playersToAct)} />
          <Mini label="Blinds" value="0.5 / 1" />
        </div>
        <div className="flex flex-col items-center gap-2 mb-2">
          <span className="text-xs text-ink-500 uppercase tracking-wide">Your hand</span>
          <CardRow cards={spot.cards} size="lg" />
          <span className="text-gold-400 font-bold text-lg">{spot.label}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="act" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => decide('fold')} className="py-6 rounded-xl bg-felt-700 font-bold text-lg hover:brightness-110 active:scale-95 transition">Fold</button>
            <button onClick={() => decide('shove')} className="py-6 rounded-xl bg-chip-red font-bold text-lg hover:brightness-110 active:scale-95 transition">Shove all-in</button>
          </motion.div>
        ) : (
          <motion.div key="res" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-2xl bg-felt-900 border border-felt-700 p-5 text-center">
            <div className={`text-xl font-bold ${result.correct ? 'text-chip-green' : 'text-chip-red'}`}>
              {result.correct ? '✓ Correct' : '✗ Off — the Nash play was to ' + (spot.correctShove ? 'shove' : 'fold')}
            </div>
            <p className="text-ink-300 text-sm mt-2">
              At {spot.stackBB}bb with {spot.playersToAct} to act, {spot.label} is a <span className="text-gold-400 font-semibold">{spot.correctShove ? 'shove' : 'fold'}</span>.
              Shoving is worth ≈ <span className={result.ev >= 0 ? 'text-chip-green' : 'text-chip-red'}>{result.ev >= 0 ? '+' : ''}{result.ev.toFixed(1)} bb</span> vs a typical calling range.
            </p>
            <button onClick={next} className="mt-4 px-6 py-3 rounded-xl bg-gold-500 text-felt-950 font-bold hover:bg-gold-400 transition">Next spot →</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICM calculator
// ─────────────────────────────────────────────────────────────────────────────

function IcmCalc() {
  const [stacksText, setStacksText] = useState('5000, 3000, 2000, 1000');
  const [payoutsText, setPayoutsText] = useState('50, 30, 20');
  const [opp, setOpp] = useState(1);

  const stacks = useMemo(() => parseNums(stacksText), [stacksText]);
  const payouts = useMemo(() => parseNums(payoutsText), [payoutsText]);
  const equities = useMemo(() => (stacks.length ? icmEquities(stacks, payouts) : []), [stacks, payouts]);
  const bf = useMemo(
    () => (stacks.length > 1 && opp !== 0 && opp < stacks.length ? bubbleFactor(stacks, payouts, 0, opp) : null),
    [stacks, payouts, opp],
  );
  const totalChips = stacks.reduce((s, x) => s + x, 0) || 1;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5 grid sm:grid-cols-2 gap-4">
        <label className="text-xs text-ink-500">Chip stacks (comma-separated) — you are player 1
          <input value={stacksText} onChange={(e) => setStacksText(e.target.value)}
            className="mt-1 w-full rounded-lg bg-felt-950 border border-felt-700 px-3 py-2 text-ink-100 text-sm" />
        </label>
        <label className="text-xs text-ink-500">Payouts (1st, 2nd, …)
          <input value={payoutsText} onChange={(e) => setPayoutsText(e.target.value)}
            className="mt-1 w-full rounded-lg bg-felt-950 border border-felt-700 px-3 py-2 text-ink-100 text-sm" />
        </label>
      </div>

      <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5">
        <h2 className="font-bold mb-3">$ equity (ICM)</h2>
        <div className="space-y-2">
          {equities.map((eq, i) => {
            const chipShare = (stacks[i] / totalChips) * payouts.reduce((s, x) => s + x, 0);
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`w-20 ${i === 0 ? 'text-gold-400 font-semibold' : 'text-ink-300'}`}>{i === 0 ? 'You' : `Player ${i + 1}`}</span>
                <div className="flex-1 h-5 rounded-full bg-felt-950/60 overflow-hidden">
                  <div className="h-full bg-gold-500/70" style={{ width: `${(eq / (payouts.reduce((s, x) => s + x, 0) || 1)) * 100}%` }} />
                </div>
                <span className="w-28 text-right font-semibold">{eq.toFixed(2)}
                  <span className="text-ink-500 text-xs"> ({eq >= chipShare ? '+' : ''}{(eq - chipShare).toFixed(1)} vs chips)</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-ink-500 mt-3">ICM pays less than your raw chip share for big stacks and more for short stacks — that gap is the "ICM tax" that makes marginal all-ins losing.</p>
      </div>

      <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Bubble factor: You vs</h2>
          <select value={opp} onChange={(e) => setOpp(+e.target.value)}
            className="rounded-lg bg-felt-950 border border-felt-700 px-2 py-1 text-sm text-ink-100">
            {stacks.slice(1).map((_, i) => (
              <option key={i + 1} value={i + 1}>Player {i + 2}</option>
            ))}
          </select>
        </div>
        {bf ? (
          <div className="text-center">
            <div className="text-5xl font-bold text-gold-400">{isFinite(bf.factor) ? bf.factor.toFixed(2) : '∞'}</div>
            <p className="text-sm text-ink-300 mt-2">
              Losing chips here hurts <span className="text-chip-red font-semibold">{isFinite(bf.factor) ? bf.factor.toFixed(2) : 'infinitely'}×</span> as much as winning them helps.
              You need roughly <span className="text-ink-100 font-semibold">{isFinite(bf.factor) ? Math.round((bf.factor / (1 + bf.factor)) * 100) : 100}%+</span> equity to call off — not 50%.
            </p>
          </div>
        ) : (
          <p className="text-ink-300 text-sm">Enter at least two stacks to compute a bubble factor.</p>
        )}
      </div>
    </div>
  );
}

function parseNums(s: string): number[] {
  return s.split(/[,\s]+/).map((x) => parseFloat(x)).filter((x) => !isNaN(x) && x > 0);
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-felt-950/60 py-2">
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="text-lg font-bold text-ink-100">{value}</div>
    </div>
  );
}
