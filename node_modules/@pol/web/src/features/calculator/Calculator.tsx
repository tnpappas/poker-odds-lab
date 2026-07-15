import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  matrixToRange,
  rangeToMatrix,
  parseRangeString,
  vpipToRange,
  potOdds,
  comboCount,
  cellLabel,
  emptyMatrix,
  type Card,
} from '@pol/poker-engine';
import { HandGrid, equityColor } from '../../components/HandGrid';
import { CardSlots } from '../../components/CardPicker';
import { useLiveEquity } from '../../lib/useEquityWorker';

const PRESETS: { label: string; range: string }[] = [
  { label: 'Any two', range: '22+,A2+,K2+,Q2+,J2+,T2+,92+,82+,72+,62+,52+,42+,32+' },
  { label: 'Top 15%', range: '55+,A9s+,KTs+,QTs+,JTs,ATo+,KJo+' },
  { label: 'Top 8%', range: '77+,ATs+,KQs,AJo+,KQo' },
  { label: 'Premiums', range: 'TT+,AQs+,AKo' },
];

export function Calculator() {
  const [hero, setHero] = useState<(Card | null)[]>([null, null]);
  const [board, setBoard] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [matrix, setMatrix] = useState<number[][]>(() => vpipToRange(0.15, 'CO'));
  const [equity, setEquity] = useState<number | null>(null);
  const [computing, setComputing] = useState(false);
  const [pot, setPot] = useState(100);
  const [bet, setBet] = useState(50);

  const used = useMemo(() => {
    const s = new Set<Card>();
    for (const c of hero) if (c) s.add(c);
    for (const c of board) if (c) s.add(c);
    return s;
  }, [hero, board]);

  const heroSet = hero[0] && hero[1] ? ([hero[0], hero[1]] as [Card, Card]) : null;
  const boardCards = board.filter((c): c is Card => !!c);
  const range = useMemo(() => matrixToRange(matrix), [matrix]);

  const rangePct = useMemo(() => {
    let combos = 0;
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) combos += (matrix[r]?.[c] ?? 0) * comboCount(cellLabel(r, c));
    return combos / 1326;
  }, [matrix]);

  const runEquity = useLiveEquity((res) => {
    setEquity(res.equity);
    setComputing(false);
  });

  useEffect(() => {
    if (!heroSet || range.length === 0) {
      setEquity(null);
      return;
    }
    // Guard: hero cards can't also be board cards (CardSlots already prevents dupes).
    setComputing(true);
    runEquity(heroSet, range, boardCards, 20000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero[0], hero[1], board.join(','), matrix, runEquity]);

  const required = potOdds(pot, bet);
  const profitable = equity != null && equity >= required;

  const applyPreset = (r: string) => {
    try {
      setMatrix(rangeToMatrix(parseRangeString(r)));
    } catch {
      /* ignore malformed preset */
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <header className="text-center my-6">
        <h1 className="text-2xl font-bold">Equity Calculator</h1>
        <p className="text-ink-300 text-sm">Your hand vs a range on any board — the fast answer, plus whether the price is right.</p>
      </header>

      <div className="grid md:grid-cols-[1fr_1fr] gap-6">
        {/* Inputs */}
        <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5 space-y-5">
          <CardSlots label="Your hand" cards={hero} onChange={setHero} used={used} size="lg" />
          <CardSlots label="Board (leave blank for preflop)" cards={board} onChange={setBoard} used={used} size="md" />

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-ink-300">Opponent range</span>
              <span className="text-gold-400 font-semibold">{(rangePct * 100).toFixed(0)}% of hands</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p.range)}
                  className="text-xs px-2.5 py-1 rounded-full border border-felt-700 hover:border-gold-500 hover:text-gold-400 transition">
                  {p.label}
                </button>
              ))}
              <button onClick={() => setMatrix(emptyMatrix())} className="text-xs px-2.5 py-1 rounded-full border border-felt-700 text-ink-500 hover:text-ink-300">
                clear
              </button>
            </div>
            <HandGrid weights={matrix} editable compact onPaint={(r, c, v) =>
              setMatrix((m) => { const n = m.map((row) => row.slice()); n[r][c] = v; return n; })
            } />
            <div className="text-[11px] text-ink-500 mt-2 text-center">Tap presets or drag to paint the range</div>
          </div>
        </div>

        {/* Result */}
        <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5 flex flex-col">
          <div className="rounded-xl bg-felt-950/60 p-6 text-center">
            <div className="text-xs text-ink-500 uppercase tracking-wide">Your equity</div>
            <motion.div key={equity ?? 'x'} initial={{ scale: 0.9, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold mt-1"
              style={{ color: equity != null ? equityColor(equity) : 'var(--color-ink-500)' }}>
              {equity != null ? `${(equity * 100).toFixed(1)}%` : heroSet ? (computing ? '…' : '—') : '—'}
            </motion.div>
            <div className="text-xs text-ink-500 mt-2">
              {!heroSet ? 'Pick your two cards to start' : range.length === 0 ? 'Paint an opponent range' : computing ? 'Simulating…' : `vs ${(rangePct * 100).toFixed(0)}% range${boardCards.length ? ` on ${boardCards.length}-card board` : ' preflop'}`}
            </div>
          </div>

          {/* Pot-odds helper */}
          <div className="mt-5 rounded-xl bg-felt-950/60 p-4">
            <div className="text-sm font-semibold mb-3">Is the price right?</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="text-xs text-ink-500">Pot
                <input type="number" value={pot} min={0} onChange={(e) => setPot(Math.max(0, +e.target.value))}
                  className="mt-1 w-full rounded-lg bg-felt-900 border border-felt-700 px-2 py-1.5 text-ink-100 text-base" />
              </label>
              <label className="text-xs text-ink-500">Bet to call
                <input type="number" value={bet} min={0} onChange={(e) => setBet(Math.max(0, +e.target.value))}
                  className="mt-1 w-full rounded-lg bg-felt-900 border border-felt-700 px-2 py-1.5 text-ink-100 text-base" />
              </label>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-300">Equity needed</span>
              <span className="font-bold text-ink-100">{(required * 100).toFixed(1)}%</span>
            </div>
            {equity != null && (
              <div className={`mt-2 rounded-lg px-3 py-2 text-sm font-semibold text-center ${profitable ? 'bg-chip-green/20 text-chip-green' : 'bg-chip-red/20 text-chip-red'}`}>
                {profitable
                  ? `Call — you have ${(equity * 100).toFixed(1)}% vs ${(required * 100).toFixed(1)}% needed`
                  : `Fold — ${(equity * 100).toFixed(1)}% falls short of ${(required * 100).toFixed(1)}%`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
