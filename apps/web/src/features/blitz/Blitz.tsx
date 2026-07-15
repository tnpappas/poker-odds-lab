import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { generateBlitzScenario, type BlitzScenario, type BlitzFocus } from './scenarios';
import type { LeakType } from '@pol/poker-engine';
import { Paywall } from '../../components/Paywall';

type Phase = 'idle' | 'playing' | 'over';
const GAME_SECONDS = 30;

export function Blitz() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [scenario, setScenario] = useState<BlitzScenario | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [hits, setHits] = useState(0);
  const [total, setTotal] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [flash, setFlash] = useState<null | 'right' | 'wrong'>(null);
  const [paywall, setPaywall] = useState(false);

  const startRef = useRef(0);
  const logDecision = useGameStore((s) => s.logDecision);
  const incrementUsage = useGameStore((s) => s.incrementUsage);
  const remaining = useGameStore((s) => s.remaining);
  const gradeDrill = useGameStore((s) => s.gradeDrill);
  const [sp] = useSearchParams();
  const focus = (sp.get('focus') as BlitzFocus | null) ?? undefined;
  const drillLeak = sp.get('drill') as LeakType | null;

  const endGame = useCallback(() => {
    setPhase('over');
  }, []);

  // Countdown timer.
  useEffect(() => {
    if (phase !== 'playing') return;
    startRef.current = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = Math.max(0, GAME_SECONDS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(id);
        endGame();
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, endGame]);

  // When a focused drill session ends, grade it so the leak-> drill loop can
  // reschedule (spaced repetition) and re-measure whether the leak is closing.
  useEffect(() => {
    if (phase !== 'over' || !drillLeak) return;
    const acc = total ? hits / total : 0;
    const q: 0 | 1 | 2 | 3 = acc >= 0.8 ? 3 : acc >= 0.65 ? 2 : acc >= 0.4 ? 1 : 0;
    gradeDrill(drillLeak, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = () => {
    if (remaining('blitz') <= 0) {
      setPaywall(true);
      return;
    }
    incrementUsage('blitz');
    setScore(0); setStreak(0); setBest(0); setHits(0); setTotal(0); setMisses(0);
    setTimeLeft(GAME_SECONDS);
    setScenario(generateBlitzScenario(0, focus));
    setPhase('playing');
  };

  const answer = (choseRight: boolean) => {
    if (!scenario || phase !== 'playing') return;
    const correct = choseRight === scenario.answerRight;
    const newStreak = correct ? streak + 1 : 0;
    const speedBonus = 0; // (could reward fast answers; kept simple)
    const pts = correct ? 100 * Math.max(1, Math.floor(newStreak / 5) + 1) + speedBonus : -50;

    setScore((s) => Math.max(0, s + pts));
    setStreak(newStreak);
    setBest((b) => Math.max(b, newStreak));
    setTotal((t) => t + 1);
    if (correct) setHits((h) => h + 1);
    setMisses((m) => (correct ? 0 : m + 1));
    setFlash(correct ? 'right' : 'wrong');
    setTimeout(() => setFlash(null), 180);

    logDecision({
      mode: 'blitz',
      street: 'flop',
      type: 'blitz',
      userAction: choseRight ? 'call' : 'fold',
      correctAction: scenario.answerRight ? 'call' : 'fold',
      correct,
      actualEquity: 0,
      evResult: correct ? 5 : -5,
      potSize: 0,
      betSize: 0,
    });

    if (!correct && misses + 1 >= 3) {
      endGame();
      return;
    }
    const difficulty = Math.min(1, newStreak / 20);
    setScenario(generateBlitzScenario(difficulty, focus));
  };

  if (paywall) return <Paywall reason="You've used all 5 free Blitz rounds today." onClose={() => setPaywall(false)} />;

  const accuracy = total ? Math.round((hits / total) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto px-4 pb-16">
      <header className="text-center my-6">
        <h1 className="text-2xl font-bold">Mental Math Blitz</h1>
        <p className="text-ink-300 text-sm">30 seconds. Tap fast. Miss 3 in a row and it's over.</p>
      </header>

      {drillLeak && (
        <div className="mb-4 text-center text-sm rounded-xl bg-gold-500/10 border border-gold-500/40 px-4 py-2 text-gold-400">
          Focused drill — sharpening your “{drillLeak.replace(/_/g, ' ')}” leak
        </div>
      )}

      {phase === 'idle' && (
        <div className="rounded-2xl bg-felt-900 border border-felt-700 p-8 text-center">
          <p className="text-ink-300 mb-6">Rapid-fire pot odds, EV and outs. <span className="text-gold-400">Right</span> = call/yes/over, <span className="text-gold-400">Left</span> = fold/no/under.</p>
          <button onClick={start} className="px-8 py-4 rounded-xl bg-gold-500 text-felt-950 font-bold text-lg hover:bg-gold-400 transition">
            Start Blitz
          </button>
          <div className="text-xs text-ink-500 mt-3">{remaining('blitz') === Infinity ? 'Unlimited (Pro)' : `${remaining('blitz')} free rounds left today`}</div>
        </div>
      )}

      {phase === 'playing' && scenario && (
        <div>
          {/* HUD */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <div>Score <span className="font-bold text-gold-400">{score}</span></div>
            <div>Streak <span className="font-bold text-chip-green">{streak}🔥</span></div>
            <div>Misses <span className="font-bold text-chip-red">{'●'.repeat(misses)}{'○'.repeat(Math.max(0, 3 - misses))}</span></div>
          </div>
          <div className="h-2 rounded-full bg-felt-800 overflow-hidden mb-5">
            <div className="h-full bg-gold-500 transition-all duration-100" style={{ width: `${(timeLeft / GAME_SECONDS) * 100}%` }} />
          </div>

          <motion.div
            animate={flash ? { backgroundColor: flash === 'right' ? '#2a9d8f33' : '#e6394633' } : { backgroundColor: 'rgba(13,31,23,1)' }}
            className="rounded-2xl border border-felt-700 p-8 text-center mb-4 min-h-[140px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={scenario.prompt + scenario.sub} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="text-xl font-bold">{scenario.prompt}</div>
                <div className="text-ink-300 mt-1">{scenario.sub}</div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => answer(false)} className="py-6 rounded-xl bg-felt-700 font-bold text-lg hover:brightness-110 active:scale-95 transition">
              ← {scenario.leftLabel}
            </button>
            <button onClick={() => answer(true)} className="py-6 rounded-xl bg-chip-green font-bold text-lg hover:brightness-110 active:scale-95 transition">
              {scenario.rightLabel} →
            </button>
          </div>
        </div>
      )}

      {phase === 'over' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-felt-900 border border-felt-700 p-8 text-center">
          <div className="text-sm text-ink-500 uppercase tracking-wide">Time / Lives up</div>
          <div className="text-5xl font-bold text-gold-400 my-2">{score}</div>
          <div className="grid grid-cols-2 gap-3 my-5 text-center">
            <div className="rounded-xl bg-felt-950/60 py-3"><div className="text-xs text-ink-500">Accuracy</div><div className="text-2xl font-bold">{accuracy}%</div></div>
            <div className="rounded-xl bg-felt-950/60 py-3"><div className="text-xs text-ink-500">Best streak</div><div className="text-2xl font-bold">{best}</div></div>
          </div>
          <button onClick={start} className="px-8 py-3 rounded-xl bg-gold-500 text-felt-950 font-bold hover:bg-gold-400 transition">
            Play again
          </button>
          <div className="text-xs text-ink-500 mt-3">{remaining('blitz') === Infinity ? 'Unlimited (Pro)' : `${remaining('blitz')} free rounds left today`}</div>
        </motion.div>
      )}
    </div>
  );
}
