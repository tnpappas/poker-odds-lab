import { Link } from 'react-router-dom';
import type { ComponentType } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LOGO_WORDMARK_DATA_URI } from '../brand';
import { Eyebrow } from '../components/ui';
import { Spade, Heart, Diamond, Club } from '../components/icons';

type SuitProps = { size?: number; className?: string };

type Feature = {
  to: string;
  title: string;
  desc: string;
  span: string;
  Pip: ComponentType<SuitProps>;
  pipClass: string;
  featured?: boolean;
  tag?: string;
};

// Simple poker suit pips (not generic clip-art) mark each card.
const FEATURES: Feature[] = [
  { to: '/replay', title: 'Hand Replay', span: 'md:col-span-4', featured: true, tag: 'The core loop',
    Pip: Spade, pipClass: 'text-ink-100',
    desc: 'Pause at every street, read the opponent’s range, and make the call. Scored on EV, never on luck.' },
  { to: '/visualizer', title: 'Equity Visualizer', span: 'md:col-span-2', Pip: Diamond, pipClass: 'text-brand-400',
    desc: 'Every starting hand, colored by equity. Drag a range and watch the numbers move in real time.' },
  { to: '/blitz', title: 'Mental Math Blitz', span: 'md:col-span-2', Pip: Heart, pipClass: 'text-brand-400',
    desc: '30-second sprints of pot odds and EV. Build the instincts you need at the table.' },
  { to: '/calculator', title: 'Equity Calculator', span: 'md:col-span-2', Pip: Club, pipClass: 'text-ink-100',
    desc: 'Your hand vs any range on any board. The fast answer, plus whether the price is right.' },
  { to: '/icm', title: 'Tournament Lab', span: 'md:col-span-2', Pip: Spade, pipClass: 'text-ink-100',
    desc: 'Push/fold and ICM training. The math that decides tournaments, without a pricey solver.' },
  { to: '/dashboard', title: 'EV Dashboard', span: 'md:col-span-3', Pip: Diamond, pipClass: 'text-brand-400',
    desc: 'Track your decision quality over time and get your leaks diagnosed automatically.' },
  { to: '/adversary-lab', title: 'Adversary Lab', span: 'md:col-span-3', Pip: Heart, pipClass: 'text-brand-400',
    desc: 'Build a model of a real opponent from six behavioral reads, then train against exactly how they play.' },
];

export function Home() {
  const reduce = useReducedMotion();

  return (
    <div>
      {/* ---- Full-bleed casino hero: real logo + headline over the table ---- */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <img
          src="https://d8j0ntlcm91z4.cloudfront.net/user_3ERX8BQAFxBlSpuY7HbvVMVJWZI/hf_20260717_173443_a6144895-86d8-4e17-97d2-e2f6482a5e4f.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center sm:object-right"
          style={{ filter: 'brightness(1.32) contrast(1.05) saturate(1.08)' }}
        />
        {/* Lighter left scrim so the photo is clearly visible while copy stays legible. */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(6,6,7,0.85) 0%, rgba(6,6,7,0.46) 44%, rgba(6,6,7,0.08) 74%, transparent 100%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-36" style={{ background: 'linear-gradient(180deg, transparent, #060607)' }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-xl" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.55)' }}>
            {/* The real logo, large, so the brand lands immediately. */}
            <motion.img
              src={LOGO_WORDMARK_DATA_URI}
              alt="Poker Logic Lab"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-14 sm:h-16 w-auto mb-9 drop-shadow-[0_6px_26px_rgba(0,0,0,0.7)]"
            />

            <Eyebrow>Decision training · No solver required</Eyebrow>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold leading-[1.02] tracking-tight">
              Stop losing to better math.
              <span className="block accent">Start winning with better reads.</span>
            </motion.h1>

            <p className="text-ink-100/85 mt-6 max-w-md text-[15px] leading-relaxed">
              The math is the engine. The real skill is reading live opponents under uncertainty,
              the part every other trainer skips.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/replay"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition shadow-[0_12px_34px_-10px_rgba(196,31,42,0.9)]">
                <Spade size={16} /> Play a hand
              </Link>
              <Link to="/visualizer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 bg-black/30 backdrop-blur-sm text-ink-100 hover:border-brand-400/70 transition">
                Explore equity
              </Link>
            </div>

            <Link to="/guide"
              className="inline-block mt-5 text-sm text-ink-100/80 hover:text-ink-100 underline underline-offset-4 decoration-brand-400/50">
              New to poker? See how it works →
            </Link>

            <div className="flex items-center gap-5 mt-8 text-ink-300 text-xs">
              <span className="num">169 <span className="font-sans">starting hands</span></span>
              <span className="text-white/25">|</span>
              <span className="num">10,000 <span className="font-sans">sims / call</span></span>
              <span className="text-white/25">|</span>
              <span className="num">&lt;100<span className="font-sans">ms on mobile</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Feature grid: varied weights, suit pips, dealt-in ---- */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-24 -mt-2">
        <div className="inlay mb-8" />
        <Eyebrow>The lab</Eyebrow>
        <section className="grid md:grid-cols-6 gap-4 mt-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.to}
              className={f.span}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: reduce ? 0 : Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}>
              <Link
                to={f.to}
                className={`felt-card group relative flex flex-col rounded-2xl overflow-hidden h-full transition
                  hover:-translate-y-0.5 hover:border-brand-400/40
                  ${f.featured ? 'p-7 min-h-[180px]' : 'p-5 min-h-[150px]'}`}>
                {f.tag && (
                  <span className="absolute top-4 right-4 eyebrow !text-[0.6rem] !tracking-[0.18em] text-ink-500 border border-felt-700 rounded-full px-2 py-0.5">
                    {f.tag}
                  </span>
                )}
                <f.Pip size={f.featured ? 26 : 22} className={`${f.pipClass} mb-4 opacity-90`} />
                <h3 className={`font-display font-semibold tracking-tight ${f.featured ? 'text-2xl' : 'text-lg'}`}>
                  {f.title}
                </h3>
                <p className={`text-ink-300 mt-2 leading-relaxed ${f.featured ? 'text-[15px] max-w-md' : 'text-sm'}`}>
                  {f.desc}
                </p>
                <span className="mt-auto pt-5 text-brand-400 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open <span aria-hidden>→</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </section>
      </div>
    </div>
  );
}
