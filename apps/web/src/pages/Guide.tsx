import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Eyebrow } from '../components/ui';
import { Spade } from '../components/icons';
import { CONCEPTS, TOOL_HELP } from '../components/toolHelp';

export function Guide() {
  const reduce = useReducedMotion();

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 pb-24 pt-10">
      {/* Intro */}
      <Eyebrow>New to poker? Start here</Eyebrow>
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.03]">
        How it works
      </motion.h1>
      <p className="text-ink-300 mt-5 max-w-2xl leading-relaxed">
        Poker looks like luck, but good players win because they make better decisions with the same cards.
        Every decision comes down to a little math and a read on your opponent. This app teaches both,
        in plain language, so you can start from zero. Here is everything you need to understand what the
        tools are doing.
      </p>

      {/* Core concepts */}
      <div className="inlay my-10" />
      <Eyebrow>Poker math in plain English</Eyebrow>
      <p className="text-ink-300 mt-2 mb-6 max-w-2xl text-sm leading-relaxed">
        Six ideas cover almost everything. Learn these and the rest of the app will make sense.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {CONCEPTS.map((c) => (
          <div key={c.term} className="felt-card rounded-2xl p-5">
            <h3 className="font-display text-xl font-semibold tracking-tight">{c.term}</h3>
            <p className="text-ink-300 mt-2 text-sm leading-relaxed">{c.plain}</p>
          </div>
        ))}
      </div>

      {/* Tools */}
      <div className="inlay my-10" />
      <Eyebrow>The tools, and how to use them</Eyebrow>
      <p className="text-ink-300 mt-2 mb-6 max-w-2xl text-sm leading-relaxed">
        Each tool trains one part of your game. Here is what every one does and how to use it.
      </p>
      <div className="space-y-4">
        {TOOL_HELP.map((t) => (
          <div key={t.path} className="felt-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <t.Pip size={22} className={t.pipClass} />
              <h3 className="font-display text-2xl font-semibold tracking-tight">{t.title}</h3>
            </div>
            <p className="text-ink-100/90 text-[15px] leading-relaxed">{t.what}</p>

            <div className="mt-4">
              <span className="eyebrow">How to use it</span>
              <ol className="mt-2 space-y-2">
                {t.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink-300 leading-relaxed">
                    <span className="num text-brand-400 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="mt-4 text-sm text-ink-500">
              <span className="text-ink-300 font-medium">What you learn: </span>
              {t.learn}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="inlay my-10" />
      <div className="felt-card rounded-2xl p-8 text-center">
        <h3 className="font-display text-2xl font-semibold tracking-tight">Ready to train?</h3>
        <p className="text-ink-300 mt-2 text-sm max-w-md mx-auto leading-relaxed">
          Unlock every tool once and keep it forever. Start with a single hand and let the app teach you as you go.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link to="/replay"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
            <Spade size={16} /> Play a hand
          </Link>
          <Link to="/visualizer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-felt-700 text-ink-100 hover:border-brand-400/70 transition">
            Explore equity
          </Link>
        </div>
      </div>
    </div>
  );
}
