import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  buildAdversaryRange,
  calculateExploitativeAdjustments,
  comboCount,
  cellLabel,
  type Card,
} from '@pol/poker-engine';
import { HandGrid } from '../../components/HandGrid';
import { Paywall } from '../../components/Paywall';
import { useGameStore, type SavedAdversary } from '../../store/useGameStore';

type Draft = Omit<SavedAdversary, 'id'>;

const DEFAULT: Draft = {
  name: '',
  vpip: 0.24,
  pfr: 0.18,
  cbetFlop: 0.6,
  cbetTurn: 0.45,
  foldTo3bet: 0.55,
  af: 2.5,
  wtsd: 0.28,
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function AdversaryLab() {
  const nav = useNavigate();
  const plan = useGameStore((s) => s.plan);
  const adversaries = useGameStore((s) => s.adversaries);
  const addAdversary = useGameStore((s) => s.addAdversary);
  const updateAdversary = useGameStore((s) => s.updateAdversary);
  const deleteAdversary = useGameStore((s) => s.deleteAdversary);
  const setActiveAdversary = useGameStore((s) => s.setActiveAdversary);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(DEFAULT);

  const matrix = useMemo(() => buildAdversaryRange(draft, 'CO'), [draft]);
  const rangePct = useMemo(() => {
    let combos = 0;
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) combos += matrix[r][c] * comboCount(cellLabel(r, c));
    return combos / 1326;
  }, [matrix]);
  const adjustments = useMemo(
    () => calculateExploitativeAdjustments(['As', 'Ks'] as [Card, Card], draft),
    [draft],
  );

  if (plan !== 'pro') {
    return <Paywall reason="Adversary Lab is a Pro feature — model the regulars at your table and learn to exploit them." onClose={() => nav('/')} />;
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const loadAdversary = (v: SavedAdversary) => {
    setEditingId(v.id);
    setDraft({ name: v.name, vpip: v.vpip, pfr: v.pfr, cbetFlop: v.cbetFlop, cbetTurn: v.cbetTurn, foldTo3bet: v.foldTo3bet, af: v.af, wtsd: v.wtsd, notes: v.notes });
  };
  const newAdversary = () => { setEditingId(null); setDraft(DEFAULT); };

  const save = () => {
    const name = draft.name.trim() || 'Unnamed adversary';
    if (editingId) updateAdversary(editingId, { ...draft, name });
    else {
      const id = addAdversary({ ...draft, name });
      setEditingId(id);
    }
  };

  const playVs = () => {
    let id = editingId;
    if (!id) id = addAdversary({ ...draft, name: draft.name.trim() || 'Unnamed adversary' });
    setActiveAdversary(id);
    nav('/replay');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <header className="my-6">
        <h1 className="text-2xl font-bold">Adversary Lab</h1>
        <p className="text-ink-300 text-sm">Answer six questions about a player. We'll model their range and show you how to beat them.</p>
      </header>

      <div className="grid md:grid-cols-[1fr_1.2fr] gap-6">
        {/* Editor */}
        <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5">
          <input value={draft.name} onChange={(e) => set({ name: e.target.value })}
            placeholder="Name this adversary (e.g. Phil from my home game)"
            className="w-full bg-felt-950 border border-felt-700 rounded-xl px-3 py-2 mb-4 text-ink-100 placeholder:text-ink-500 focus:border-gold-500 outline-none" />

          <Slider label="How many hands does he play?" lo="Nit" hi="Fish" min={0.05} max={0.6} step={0.01} value={draft.vpip} fmt={pct} onChange={(v) => set({ vpip: v, pfr: Math.min(draft.pfr, v) })} />
          <Slider label="How often does he raise preflop?" lo="Passive" hi="Aggressive" min={0.02} max={0.4} step={0.01} value={draft.pfr} fmt={pct} onChange={(v) => set({ pfr: Math.min(v, draft.vpip) })} />
          <Slider label="Does he c-bet the flop?" lo="Never" hi="Always" min={0.2} max={0.95} step={0.01} value={draft.cbetFlop} fmt={pct} onChange={(v) => set({ cbetFlop: v })} />
          <Slider label="Does he fold to 3-bets?" lo="Never" hi="Always" min={0.2} max={0.85} step={0.01} value={draft.foldTo3bet} fmt={pct} onChange={(v) => set({ foldTo3bet: v })} />
          <Slider label="How aggressive overall?" lo="Calls" hi="Raises" min={1} max={5} step={0.1} value={draft.af} fmt={(v) => v.toFixed(1)} onChange={(v) => set({ af: v })} />
          <Slider label="Does he go to showdown a lot?" lo="Folds" hi="Stations" min={0.18} max={0.45} step={0.01} value={draft.wtsd} fmt={pct} onChange={(v) => set({ wtsd: v })} />

          <div className="flex gap-2 mt-5">
            <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-gold-500 text-felt-950 font-bold hover:bg-gold-400 transition">
              {editingId ? 'Save changes' : 'Save adversary'}
            </button>
            <button onClick={playVs} className="flex-1 py-2.5 rounded-xl bg-chip-green font-bold hover:brightness-110 transition">
              Play vs him →
            </button>
          </div>
          {editingId && (
            <button onClick={() => { deleteAdversary(editingId); newAdversary(); }}
              className="w-full mt-2 py-2 rounded-xl border border-felt-700 text-chip-red text-sm hover:bg-felt-800 transition">
              Delete adversary
            </button>
          )}
        </div>

        {/* Live model */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Modeled range</h2>
              <span className="text-sm text-gold-400 font-semibold">{pct(rangePct)} of hands</span>
            </div>
            <HandGrid weights={matrix} compact />
          </div>

          <div className="rounded-2xl bg-felt-900 border border-felt-700 p-5">
            <h2 className="font-bold mb-3">Exploitative adjustments</h2>
            {adjustments.length === 0 ? (
              <p className="text-ink-300 text-sm">This player is fairly balanced — no glaring leaks to attack. Play solid, value-bet your good hands.</p>
            ) : (
              <div className="space-y-2">
                {adjustments.map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-xl bg-felt-950/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink-100">{a.adjustment}</span>
                      <span className="text-chip-green font-bold text-sm">+{a.evGain} EV</span>
                    </div>
                    <p className="text-xs text-ink-300 mt-1">{a.reason}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved adversaries */}
      {adversaries.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Your adversaries</h2>
            <button onClick={newAdversary} className="text-sm text-gold-400 hover:text-gold-500">+ New adversary</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {adversaries.map((v) => (
              <button key={v.id} onClick={() => loadAdversary(v)}
                className={`text-left rounded-xl border p-3 transition ${editingId === v.id ? 'border-gold-500 bg-gold-500/10' : 'border-felt-700 bg-felt-900 hover:bg-felt-800'}`}>
                <div className="font-semibold">{v.name}</div>
                <div className="text-xs text-ink-500 mt-1">VPIP {pct(v.vpip)} · PFR {pct(v.pfr)} · AF {v.af.toFixed(1)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label, lo, hi, min, max, step, value, fmt, onChange,
}: {
  label: string; lo: string; hi: string; min: number; max: number; step: number; value: number; fmt: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-ink-300">{label}</span>
        <span className="text-gold-400 font-semibold">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
      <div className="flex justify-between text-[10px] text-ink-500 mt-0.5"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}
