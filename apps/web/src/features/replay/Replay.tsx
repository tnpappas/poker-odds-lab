import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  evaluate7Cards,
  emptyMatrix,
  matrixToRange,
  comboToLabel,
  labelToCell,
  comboCount,
  cellLabel,
  type Card,
} from '@pol/poker-engine';
import { CardRow } from '../../components/PlayingCard';
import { HandGrid } from '../../components/HandGrid';
import { useGameStore } from '../../store/useGameStore';
import { useLiveEquity } from '../../lib/useEquityWorker';
import { generateHand, judge, type GeneratedHand, type DecisionNode } from './handGenerator';
import { Paywall } from '../../components/Paywall';
import type { Action } from '../../store/useGameStore';

type Phase = 'loading' | 'decide' | 'result' | 'done';

interface LastDecision {
  action: Action;
  correct: Action;
  skill: number;
  readBonus: number;
  readEquity: number | null;
}

export function Replay() {
  const [hand, setHand] = useState<GeneratedHand | null>(null);
  const [nodeIdx, setNodeIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [last, setLast] = useState<LastDecision | null>(null);
  const [handSkill, setHandSkill] = useState(0);
  const [paywall, setPaywall] = useState(false);

  // Range-read mechanic state.
  const [readMode, setReadMode] = useState(true);
  const [userMatrix, setUserMatrix] = useState<number[][]>(() => emptyMatrix());
  const [readEquity, setReadEquity] = useState<number | null>(null);

  // First-time explainer for the range-read grid (shown once, then remembered).
  const [showReadHint, setShowReadHint] = useState(() => {
    try {
      return localStorage.getItem('pll_read_hint_seen') !== '1';
    } catch {
      return true;
    }
  });
  const dismissReadHint = () => {
    setShowReadHint(false);
    try {
      localStorage.setItem('pll_read_hint_seen', '1');
    } catch {
      /* ignore */
    }
  };

  const logDecision = useGameStore((s) => s.logDecision);
  const incrementUsage = useGameStore((s) => s.incrementUsage);
  const remaining = useGameStore((s) => s.remaining);
  const adversaries = useGameStore((s) => s.adversaries);
  const activeAdversaryId = useGameStore((s) => s.activeAdversaryId);
  const setActiveAdversary = useGameStore((s) => s.setActiveAdversary);
  const activeAdversary = adversaries.find((v) => v.id === activeAdversaryId) ?? null;

  const resetRead = useCallback(() => {
    setUserMatrix(emptyMatrix());
    setReadEquity(null);
  }, []);

  const deal = useCallback(async () => {
    if (remaining('replay') <= 0) {
      setPaywall(true);
      return;
    }
    setPhase('loading');
    setNodeIdx(0);
    setLast(null);
    setHandSkill(0);
    resetRead();
    incrementUsage('replay');
    const { activeAdversaryId: avId, adversaries: vs } = useGameStore.getState();
    const av = vs.find((v) => v.id === avId);
    const h = await generateHand(av ? { adversary: { name: av.name, vpip: av.vpip } } : {});
    setHand(h);
    setPhase('decide');
  }, [remaining, incrementUsage, resetRead]);

  useEffect(() => {
    void deal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live equity vs the user's painted range.
  const runRead = useLiveEquity((res) => setReadEquity(res.equity));
  const node = hand?.nodes[nodeIdx];
  useEffect(() => {
    if (!hand || !node || phase !== 'decide' || !readMode) return;
    const range = matrixToRange(userMatrix);
    if (range.length === 0) {
      setReadEquity(null);
      return;
    }
    const board = node.street === 'flop' ? hand.board.slice(0, 3) : hand.board.slice(0, 4);
    runRead(hand.heroCards, range, board, 6000);
  }, [userMatrix, hand, node, phase, readMode, runRead]);

  const paint = (r: number, c: number, v: number) =>
    setUserMatrix((m) => {
      const next = m.map((row) => row.slice());
      next[r][c] = v;
      return next;
    });

  const readPct = useMemo(() => {
    let combos = 0;
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) combos += userMatrix[r][c] * comboCount(cellLabel(r, c));
    return combos / 1326;
  }, [userMatrix]);

  const act = (action: Action) => {
    if (!hand || !node || phase !== 'decide') return;
    const { correct, skill } = judge(node, action);

    let readBonus = 0;
    if (readMode && readEquity != null) {
      const diff = Math.abs(readEquity - node.rangeEquity);
      readBonus = diff < 0.04 ? 15 : diff < 0.08 ? 10 : diff < 0.15 ? 5 : 0;
    }
    const total = skill + readBonus;

    setLast({ action, correct, skill, readBonus, readEquity });
    setHandSkill((s) => s + total);
    logDecision({
      mode: 'replay',
      street: node.street,
      type: readMode && readEquity != null ? 'range_read' : 'ev_call',
      userAction: action,
      correctAction: correct,
      correct: action === correct,
      userEquityEstimate: readEquity ?? undefined,
      actualEquity: node.rangeEquity,
      evResult: total,
      potSize: node.pot,
      betSize: node.betSize,
    });
    setPhase('result');
  };

  const next = () => {
    if (!hand) return;
    if (nodeIdx + 1 < hand.nodes.length) {
      setNodeIdx((i) => i + 1);
      setLast(null);
      resetRead();
      setPhase('decide');
    } else {
      setPhase('done');
    }
  };

  if (paywall) return <Paywall reason="You've used all 15 free replays today." onClose={() => setPaywall(false)} />;

  if (phase === 'loading' || !hand || !node) {
    return <div className="text-center text-ink-300 py-24 animate-pulse">Dealing a hand…</div>;
  }

  const boardCount = node.street === 'flop' ? 3 : 4;
  const visibleBoard: (Card | undefined)[] = [
    ...hand.board.slice(0, phase === 'done' ? 5 : boardCount),
    ...new Array(5).fill(undefined),
  ].slice(0, 5);

  const adversaryLabel = comboToLabel(hand.adversaryCards);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      {activeAdversary && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-gold-500/10 border border-gold-500/40 px-4 py-2 text-sm">
          <span>Training vs <span className="text-gold-400 font-semibold">{activeAdversary.name}</span> · VPIP {Math.round(activeAdversary.vpip * 100)}%</span>
          <button onClick={() => setActiveAdversary(null)} className="text-ink-500 hover:text-ink-300">Use random adversaries</button>
        </div>
      )}
      {/* Table felt */}
      <div className="rounded-3xl bg-gradient-to-b from-felt-800 to-felt-950 border border-felt-700 p-5 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between text-sm text-ink-300 mb-4">
          <span>vs <span className="text-gold-400 font-semibold">{hand.adversaryName}</span></span>
          <span>Hand skill: <span className={handSkill >= 0 ? 'text-chip-green' : 'text-chip-red'}>{handSkill >= 0 ? '+' : ''}{handSkill}</span></span>
        </div>

        <div className="flex flex-col items-center gap-1 mb-6">
          <span className="text-xs text-ink-500 uppercase tracking-wide">Adversary</span>
          <CardRow cards={phase === 'done' || phase === 'result' ? hand.adversaryCards : [undefined, undefined]} size="md" />
        </div>

        <div className="flex flex-col items-center gap-2 my-6">
          <div className="text-xs text-ink-500 uppercase tracking-wide">Board · Pot ${node.pot}</div>
          <CardRow cards={visibleBoard} size="lg" />
        </div>

        <div className="flex flex-col items-center gap-1 mt-6">
          <span className="text-xs text-ink-500 uppercase tracking-wide">You</span>
          <CardRow cards={hand.heroCards} size="lg" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'decide' && (
          <motion.div key="decide" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5 rounded-2xl bg-felt-900 border border-felt-700 p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-lg font-semibold">The Read</div>
              <button onClick={() => setReadMode((v) => !v)}
                className={`text-xs px-2 py-1 rounded-full border transition ${readMode ? 'border-gold-500 text-gold-400 bg-gold-500/10' : 'border-felt-700 text-ink-500'}`}>
                Range-read {readMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <p className="text-ink-300 text-sm mb-4">
              Adversary bets <span className="text-ink-100 font-semibold">${node.betSize}</span> on the {node.street}.
            </p>

            {readMode && showReadHint && (
              <div className="mb-4 rounded-xl border border-gold-500/40 bg-gold-500/10 p-3 text-xs leading-relaxed text-ink-300">
                <div className="flex items-start justify-between gap-3">
                  <p>
                    <span className="text-gold-400 font-semibold">New here? </span>
                    The grid below is every hand your opponent could be holding. Tap or drag to paint the ones you think
                    they have, and we’ll show your odds against that exact read. Then decide call, fold, or raise.{' '}
                    <Link to="/guide" className="text-gold-400 underline hover:text-gold-300">See how it works</Link>.
                  </p>
                  <button onClick={dismissReadHint} aria-label="Dismiss" className="shrink-0 text-ink-500 hover:text-ink-300">✕</button>
                </div>
              </div>
            )}

            {readMode ? (
              <div className="grid sm:grid-cols-[1fr_1.1fr] gap-4 mb-5">
                <div>
                  <div className="text-xs text-ink-500 mb-2">
                    Drag to paint the hands you think adversary has:{' '}
                    <Link to="/guide" className="text-gold-400/80 underline hover:text-gold-400">what’s this?</Link>
                  </div>
                  <HandGrid weights={userMatrix} editable onPaint={paint} compact />
                  <div className="text-xs text-ink-500 mt-2 text-center">Your read: <span className="text-gold-400 font-semibold">{(readPct * 100).toFixed(0)}% of hands</span></div>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <Stat label="Equity vs YOUR read" value={readEquity != null ? `${(readEquity * 100).toFixed(1)}%` : readPct > 0 ? '…' : 'paint a range'}
                    good={readEquity != null ? readEquity >= node.requiredEquity : undefined} />
                  <Stat label="Equity needed to call" value={`${(node.requiredEquity * 100).toFixed(1)}%`} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-5 text-center">
                <Stat label="Your equity vs range" value={`${(node.rangeEquity * 100).toFixed(1)}%`} good={node.rangeEquity >= node.requiredEquity} />
                <Stat label="Equity needed to call" value={`${(node.requiredEquity * 100).toFixed(1)}%`} />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <ActionBtn label="Fold" color="bg-felt-700" onClick={() => act('fold')} />
              <ActionBtn label="Call" color="bg-chip-green" onClick={() => act('call')} />
              <ActionBtn label="Raise" color="bg-chip-red" onClick={() => act('raise')} />
            </div>
          </motion.div>
        )}

        {phase === 'result' && last && (
          <ResultPanel hand={hand} node={node} last={last} adversaryLabel={adversaryLabel}
            adversaryInRange={userMatrix[labelToCell(adversaryLabel)[0]][labelToCell(adversaryLabel)[1]] > 0}
            onNext={next} isLast={nodeIdx + 1 >= hand.nodes.length} />
        )}

        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-2xl bg-felt-900 border border-felt-700 p-6 text-center">
            <div className="text-sm text-ink-500 uppercase tracking-wide">Hand complete</div>
            <div className={`text-4xl font-bold my-2 ${handSkill >= 0 ? 'text-chip-green' : 'text-chip-red'}`}>
              {handSkill >= 0 ? '+' : ''}{handSkill} skill points
            </div>
            <p className="text-ink-300 text-sm mb-5">
              Adversary showed down <span className="text-gold-400">{evaluate7Cards([...hand.adversaryCards, ...hand.board]).description}</span>.
            </p>
            <button onClick={deal} className="px-6 py-3 rounded-xl bg-gold-500 text-felt-950 font-bold hover:bg-gold-400 transition">
              Deal next hand →
            </button>
            <div className="text-xs text-ink-500 mt-3">{remaining('replay') === Infinity ? 'Unlimited (Pro)' : `${remaining('replay')} free replays left today`}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-xl bg-felt-950/60 py-3 px-2 text-center">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-xl font-bold ${good === undefined ? 'text-ink-100' : good ? 'text-chip-green' : 'text-chip-red'}`}>{value}</div>
    </div>
  );
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${color} py-4 rounded-xl font-bold text-lg hover:brightness-110 active:scale-95 transition shadow-lg`}>
      {label}
    </button>
  );
}

function readVerdict(readEquity: number | null, trueEquity: number): string {
  if (readEquity == null) return 'No read made — paint a range next time to sharpen your instincts.';
  const diff = Math.abs(readEquity - trueEquity) * 100;
  if (diff < 4) return `Nearly perfect read — off by just ${diff.toFixed(1)}%.`;
  if (diff < 8) return `Close read — off by ${diff.toFixed(1)}%.`;
  if (diff < 15) return `Decent read — off by ${diff.toFixed(1)}%.`;
  return `Read was off by ${diff.toFixed(1)}% — recalibrate against this adversary type.`;
}

function ResultPanel({
  hand, node, last, adversaryLabel, adversaryInRange, onNext, isLast,
}: {
  hand: GeneratedHand;
  node: DecisionNode;
  last: LastDecision;
  adversaryLabel: string;
  adversaryInRange: boolean;
  onNext: () => void;
  isLast: boolean;
}) {
  const correct = last.action === last.correct;
  return (
    <motion.div key={`result-${node.street}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="mt-5 rounded-2xl bg-felt-900 border border-felt-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-lg font-bold ${correct ? 'text-chip-green' : 'text-chip-red'}`}>
          {correct ? '✓ Good decision' : '✗ Better line available'}
        </span>
        <span className={`font-bold ${last.skill + last.readBonus >= 0 ? 'text-chip-green' : 'text-chip-red'}`}>
          {last.skill + last.readBonus >= 0 ? '+' : ''}{last.skill + last.readBonus} pts
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
        <Stat label="EV of call" value={`${node.evOfCall >= 0 ? '+' : ''}${node.evOfCall.toFixed(1)}`} good={node.evOfCall > 0} />
        <Stat label="EV of fold" value="0.0" />
        <Stat label="Best play" value={last.correct.toUpperCase()} />
      </div>

      {/* Range-read feedback */}
      {last.readEquity != null && (
        <div className="rounded-xl bg-felt-950/60 p-3 text-sm mb-3">
          <div className="flex items-center justify-between">
            <span className="text-ink-300">Your read: <span className="text-ink-100 font-semibold">{(last.readEquity * 100).toFixed(1)}%</span> · true range equity: <span className="text-ink-100 font-semibold">{(node.rangeEquity * 100).toFixed(1)}%</span></span>
            {last.readBonus > 0 && <span className="text-gold-400 font-bold">+{last.readBonus} read</span>}
          </div>
          <div className="text-xs text-gold-400 mt-1">{readVerdict(last.readEquity, node.rangeEquity)}</div>
          <div className="text-xs text-ink-500 mt-1">
            Adversary actually had <span className="text-ink-300">{adversaryLabel}</span> — {adversaryInRange ? 'inside' : 'outside'} the range you painted.
          </div>
        </div>
      )}

      {/* Adversary's range, tightened for this street */}
      <div className="rounded-xl bg-felt-950/60 p-3 mb-3">
        <div className="flex items-center justify-between text-xs text-ink-500 mb-2">
          <span>Adversary's likely range on the {node.street}</span>
          <span className="text-gold-400 font-semibold">{Math.round(node.rangeSurvival * 100)}% still continuing</span>
        </div>
        <HandGrid weights={node.adversaryRangeMatrix} highlight={adversaryLabel} compact />
        <div className="text-[11px] text-ink-500 mt-2">Their range shrinks each street — only hands that keep betting or calling remain. The red cell is what they actually had.</div>
      </div>

      <p className="text-sm text-ink-300 mb-2">
        Adversary had <span className="text-gold-400 font-semibold">{evaluate7Cards([...hand.adversaryCards, ...hand.board.slice(0, node.street === 'flop' ? 3 : 4)]).description}</span>.
        Your exact equity vs that hand was <span className="text-ink-100 font-semibold">{(node.exactEquity * 100).toFixed(1)}%</span>.
      </p>
      <div className="rounded-xl bg-felt-950/60 p-3 text-sm text-ink-300 mb-4">
        <span className="text-gold-400 font-semibold">Why: </span>{node.explanation}
      </div>
      <button onClick={onNext} className="w-full py-3 rounded-xl bg-gold-500 text-felt-950 font-bold hover:bg-gold-400 transition">
        {isLast ? 'See result →' : 'Next street →'}
      </button>
    </motion.div>
  );
}
