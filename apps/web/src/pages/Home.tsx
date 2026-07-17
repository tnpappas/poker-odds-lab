import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { ComponentType } from 'react';
import { PREFLOP_EQUITY_SEED } from '@pol/poker-engine';
import { HandGrid } from '../components/HandGrid';
import { Eyebrow } from '../components/ui';
import {
  GridIcon,
  CardsIcon,
  BoltIcon,
  CalcIcon,
  TrophyIcon,
  TrendIcon,
  AdversaryIcon,
  Spade,
  Heart,
  Diamond,
  Club,
} from '../components/icons';

type Feature = {
  to: string;
  title: string;
  desc: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  span: string;
  featured?: boolean;
  tag?: string;
};

// Deliberately varied weights (large / medium) instead of six equal cards.
const FEATURES: Feature[] = [
  { to: '/replay', title: 'Hand Replay', Icon: CardsIcon, span: 'md:col-span-4', featured: true, tag: 'The core loop',
    desc: 'Pause at every street, read the opponent’s range, and make the call. Scored on EV — never on luck.' },
  { to: '/visualizer', title: 'Equity Visualizer', Icon: GridIcon, span: 'md:col-span-2',
    desc: 'Every starting hand, colored by equity. Drag a range and watch the numbers move in real time.' },
  { to: '/blitz', title: 'Mental Math Blitz', Icon: BoltIcon, span: 'md:col-span-2',
    desc: '30-second sprints of pot odds and EV. Build the instincts you need at the table.' },
  { to: '/calculator', title: 'Equity Calculator', Icon: CalcIcon, span: 'md:col-span-2',
    desc: 'Your hand vs any range on any board — the fast answer, plus whether the price is right.' },
  { to: '/icm', title: 'Tournament Lab', Icon: TrophyIcon, span: 'md:col-span-2',
    desc: 'Push/fold and ICM training — the math that decides tournaments, without a pricey solver.' },
  { to: '/dashboard', title: 'EV Dashboard', Icon: TrendIcon, span: 'md:col-span-3',
    desc: 'Track your decision quality over time and get your leaks diagnosed automatically.' },
  { to: '/adversary-lab', title: 'Adversary Lab', Icon: AdversaryIcon, span: 'md:col-span-3', tag: 'Pro',
    desc: 'Build a model of a real opponent from six behavioral reads — then train against exactly how they play.' },
];

export function Home() {
  const reduce = useReducedMotion();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
      {/* ---- Asymmetric hero: copy left, live equity grid bleeding off right ---- */}
      <section className="grid md:grid-cols-12 gap-8 items-center pt-10 sm:pt-16 pb-10">
        <div className="md:col-span-6 lg:col-span-5">
          <Eyebrow>Decision training · No solver required</Eyebrow>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.02] tracking-tight">
            Stop losing to
            <br className="hidden sm:block" /> better math.
            <span className="block accent">Start winning<br className="hidden sm:block" /> with better reads.</span>
          </motion.h1>

          <p className="text-ink-300 mt-6 max-w-md text-[15px] leading-relaxed">
            The math is the engine. The skill is reading real opponents under uncertainty —
            and that’s the part every other trainer skips.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/replay"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition shadow-[0_10px_30px_-12px_rgba(196,31,42,0.8)]">
              <Spade size={16} /> Play a hand
            </Link>
            <Link to="/visualizer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-felt-700 text-ink-100 hover:border-brand-400/70 hover:bg-felt-800 transition">
              Explore equity
            </Link>
          </div>

          <div className="flex items-center gap-5 mt-8 text-ink-500 text-xs">
            <span className="num">169 <span className="font-sans not-italic">starting hands</span></span>
            <span className="text-felt-700">|</span>
            <span className="num">10,000 <span className="font-sans">sims / call</span></span>
            <span className="text-felt-700">|</span>
            <span className="num">&lt;100<span className="font-sans">ms on mobile</span></span>
          </div>
        </div>

        {/* Live preflop-equity grid — the product itself, used as the hero graphic. */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="md:col-span-6 lg:col-span-7 relative md:-mr-10 lg:-mr-20">
          <div className="felt-card rounded-3xl p-4 sm:p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">Preflop equity vs. random</span>
              <span className="flex items-center gap-1.5 text-ink-500">
                <Spade size={12} className="text-ink-300" />
                <Heart size={12} className="text-oxblood-400" />
                <Diamond size={12} className="text-brass-400" />
                <Club size={12} className="text-chip-green" />
              </span>
            </div>
            <div className="max-w-[520px] mx-auto">
              <HandGrid equityTable={PREFLOP_EQUITY_SEED as Record<string, number>} />
            </div>
            <div className="flex items-center justify-between mt-3 text-[11px] text-ink-500">
              <span className="num flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--color-chip-red)' }} /> ~35%</span>
              <span className="eyebrow !tracking-[0.2em]">win probability</span>
              <span className="num flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--color-chip-green)' }} /> 85%+</span>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="inlay my-6" />

      {/* ---- Feature grid: varied weights, custom glyphs, dealt-in ---- */}
      <Eyebrow>The lab</Eyebrow>
      <section className="grid md:grid-cols-6 gap-4 mt-2">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.to}
            className={f.span}
            initial={reduce ? false : { opacity: 0, y: 18, rotate: -1.2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: reduce ? 0 : Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}>
            <Link
              to={f.to}
              className={`felt-card group relative flex flex-col rounded-2xl overflow-hidden h-full transition
                hover:-translate-y-0.5 hover:border-brass-400/40
                ${f.featured ? 'p-7 min-h-[190px]' : 'p-5 min-h-[150px]'}`}>
              {f.tag && (
                <span className="absolute top-4 right-4 eyebrow !text-[0.6rem] !tracking-[0.18em] text-ink-500 border border-felt-700 rounded-full px-2 py-0.5">
                  {f.tag}
                </span>
              )}
              <span className={`grid place-items-center rounded-xl mb-4 text-brass-400 shrink-0
                ${f.featured ? 'h-12 w-12' : 'h-10 w-10'}`}
                style={{ background: 'linear-gradient(180deg,#11302633,#07131300)', boxShadow: 'inset 0 0 0 1px rgba(211,172,87,0.18)' }}>
                <f.Icon size={f.featured ? 26 : 22} />
              </span>
              <h3 className={`font-display font-semibold tracking-tight ${f.featured ? 'text-2xl' : 'text-lg'}`}>
                {f.title}
              </h3>
              <p className={`text-ink-300 mt-2 leading-relaxed ${f.featured ? 'text-[15px] max-w-md' : 'text-sm'}`}>
                {f.desc}
              </p>
              <span className="mt-auto pt-4 text-brass-400/80 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Open <span aria-hidden>→</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
