import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PREFLOP_EQUITY_SEED,
  representativeCombo,
  vpipToRange,
  matrixToRange,
  comboCount,
  cellLabel,
  type Card,
} from '@pol/poker-engine';
import { HandGrid, equityColor } from '../../components/HandGrid';
import { CardRow } from '../../components/PlayingCard';
import { computePreflopTable, useLiveEquity } from '../../lib/useEquityWorker';

const CACHE_KEY = 'pol-preflop-table-v1';

function vpipLabel(vpip: number): string {
  if (vpip <= 0.1) return 'Nit (very tight)';
  if (vpip <= 0.18) return 'TAG reg';
  if (vpip <= 0.28) return 'Solid reg';
  if (vpip <= 0.4) return 'Loose-aggressive';
  return 'Fish (very loose)';
}

export function Visualizer() {
  const [table, setTable] = useState<Record<string, number>>(PREFLOP_EQUITY_SEED);
  const [computing, setComputing] = useState(true);
  const [selected, setSelected] = useState<string>('AKs');
  const [vpip, setVpip] = useState(0.2);
  const [rangeEquity, setRangeEquity] = useState<number | null>(null);

  // Load (or compute + cache) the full equity-vs-random table.
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      setTable(JSON.parse(cached));
      setComputing(false);
      return;
    }
    computePreflopTable(12000).then((t) => {
      setTable(t);
      setComputing(false);
      localStorage.setItem(CACHE_KEY, JSON.stringify(t));
    });
  }, []);

  const adversaryMatrix = useMemo(() => vpipToRange(vpip, 'CO'), [vpip]);
  const adversaryRange = useMemo(() => matrixToRange(adversaryMatrix), [adversaryMatrix]);
  const heroCards = useMemo<[Card, Card]>(() => representativeCombo(selected), [selected]);

  const runEquity = useLiveEquity((res) => setRangeEquity(res.equity));
  useEffect(() => {
    setRangeEquity(null);
    runEquity(heroCards, adversaryRange, [], 12000);
  }, [heroCards, adversaryRange, runEquity]);

  const combosInRange = adversaryMatrix.flat().reduce((acc, w, i) => {
    // estimate combos: weight * combos-of-that-cell
    const r = Math.floor(i / 13);
    const c = i % 13;
    return acc + w * comboCount(cellLabel(r, c));
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <header className="text-center my-6">
        <h1 className="text-2xl font-bold">Preflop Equity Visualizer</h1>
        <p className="text-ink-300 text-sm">Every starting hand, colored by its raw equity vs a random hand.</p>
      </header>

      <div className="grid md:grid-cols-[1.3fr_1fr] gap-6">
        {/* Grid */}
        <div className="rounded-2xl bg-felt-900 border border-felt-700 p-4">
          <div className="flex items-center justify-between mb-3 text-xs text-ink-500">
            <span>Click any hand</span>
            {computing && <span className="animate-pulse text-gold-400">Refining equities…</span>}
          </div>
          <HandGrid equityTable={table} selected={selected} onSelect={setSelected} />
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-ink-500">
            <span>40%</span>
            <div className="h-2 w-40 rounded-full" style={{ background: `linear-gradient(90deg, ${equityColor(0.4)}, ${equityColor(0.6)}, ${equityColor(0.85)})` }} />
            <span>85%+</span>
          </div>
        </div>

        {/* Detail */}
        <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-500 uppercase tracking-wide">Selected hand</div>
              <div className="text-3xl font-bold text-gold-400">{selected}</div>
            </div>
            <CardRow cards={heroCards} size="md" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <Metric label="Equity vs random" value={table[selected] != null ? `${(table[selected] * 100).toFixed(1)}%` : '—'}
              color={table[selected] != null ? equityColor(table[selected]) : undefined} />
            <Metric label="Combos" value={String(comboCount(selected))} />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-ink-300">Adversary range</span>
              <span className="text-gold-400 font-semibold">{vpipLabel(vpip)} · {(vpip * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0.05} max={0.6} step={0.01} value={vpip}
              onChange={(e) => setVpip(parseFloat(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[10px] text-ink-500 mt-1">
              <span>Tight 5%</span><span>Loose 60%</span>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-felt-950/60 p-4 text-center">
            <div className="text-xs text-ink-500">Your live equity vs this range</div>
            <motion.div key={rangeEquity ?? 'x'} initial={{ scale: 0.9, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold mt-1"
              style={{ color: rangeEquity != null ? equityColor(rangeEquity) : 'var(--color-ink-500)' }}>
              {rangeEquity != null ? `${(rangeEquity * 100).toFixed(1)}%` : '…'}
            </motion.div>
            <div className="text-xs text-ink-500 mt-1">≈ {Math.round(combosInRange)} adversary combos</div>
          </div>

          {/* Mini view of adversary's range */}
          <div className="mt-5">
            <div className="text-xs text-ink-500 mb-2">Adversary's range</div>
            <HandGrid weights={adversaryMatrix} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-felt-950/60 py-3 px-3 text-center">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-2xl font-bold" style={{ color: color ?? 'var(--color-ink-100)' }}>{value}</div>
    </div>
  );
}
