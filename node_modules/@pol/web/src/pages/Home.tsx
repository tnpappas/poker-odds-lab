import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  { to: '/visualizer', emoji: '🎛️', title: 'Equity Visualizer', desc: 'Every starting hand, colored by equity. Drag an adversary range and watch your numbers move in real time.' },
  { to: '/replay', emoji: '🃏', title: 'Hand Replay', desc: 'Pause at every street, read the adversary, and make the call. Scored on EV — not luck.' },
  { to: '/blitz', emoji: '⚡', title: 'Mental Math Blitz', desc: '30-second sprints of pot odds and EV. Build the instincts you need at the table.' },
  { to: '/calculator', emoji: '🧮', title: 'Equity Calculator', desc: 'Your hand vs any range on any board — the fast answer, plus whether the price is right.' },
  { to: '/icm', emoji: '🏆', title: 'Tournament Lab', desc: 'Push/fold and ICM training — the math that decides tournaments, without a pricey solver.' },
  { to: '/dashboard', emoji: '📈', title: 'EV Dashboard', desc: 'Track your decision quality over time and get your leaks diagnosed automatically.' },
];

export function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <section className="text-center pt-12 pb-8">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Stop losing to better math.
          <span className="block text-gold-400">Start winning with better reads.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-ink-300 mt-4 max-w-xl mx-auto">
          A poker <em>decision-training</em> app. The math is the engine — the skill is reading real opponents under uncertainty.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="flex gap-3 justify-center mt-7">
          <Link to="/replay" className="px-6 py-3 rounded-xl bg-gold-500 text-felt-950 font-bold hover:bg-gold-400 transition">Play a hand</Link>
          <Link to="/visualizer" className="px-6 py-3 rounded-xl border border-felt-700 hover:border-gold-500 transition">Explore equity</Link>
        </motion.div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4 mt-6">
        {FEATURES.map((f, i) => (
          <motion.div key={f.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <Link to={f.to} className="block rounded-2xl bg-felt-900 border border-felt-700 p-5 hover:border-gold-500/60 hover:bg-felt-800 transition h-full">
              <div className="text-3xl mb-2">{f.emoji}</div>
              <div className="font-bold text-lg">{f.title}</div>
              <p className="text-ink-300 text-sm mt-1">{f.desc}</p>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
