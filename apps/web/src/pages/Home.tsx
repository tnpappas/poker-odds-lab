import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { LOGO_DATA_URI } from '../brand';
import { Eyebrow } from '../components/ui';
import { Spade } from '../components/icons';

type Feature = {
  to: string;
  title: string;
  desc: string;
  span: string;
  featured?: boolean;
  tag?: string;
};

// Deliberately varied weights (large / medium) instead of six equal cards.
const FEATURES: Feature[] = [
  { to: '/replay', title: 'Hand Replay', span: 'md:col-span-4', featured: true, tag: 'The core loop',
    desc: 'Pause at every street, read the opponent’s range, and make the call. Scored on EV, never on luck.' },
  { to: '/visualizer', title: 'Equity Visualizer', span: 'md:col-span-2',
    desc: 'Every starting hand, colored by equity. Drag a range and watch the numbers move in real time.' },
  { to: '/blitz', title: 'Mental Math Blitz', span: 'md:col-span-2',
    desc: '30-second sprints of pot odds and EV. Build the instincts you need at the table.' },
  { to: '/calculator', title: 'Equity Calculator', span: 'md:col-span-2',
    desc: 'Your hand vs any range on any board. The fast answer, plus whether the price is right.' },
  { to: '/icm', title: 'Tournament Lab', span: 'md:col-span-2',
    desc: 'Push/fold and ICM training. The math that decides tournaments, without a pricey solver.' },
  { to: '/dashboard', title: 'EV Dashboard', span: 'md:col-span-3',
    desc: 'Track your decision quality over time and get your leaks diagnosed automatically.' },
  { to: '/adversary-lab', title: 'Adversary Lab', span: 'md:col-span-3', tag: 'Pro',
    desc: 'Build a model of a real opponent from six behavioral reads, then train against exactly how they play.' },
];

export function Home() {
  const reduce = useReducedMotion();

  return (
    <div>
      {/* ---- Full-bleed casino hero: big logo + headline over the table ---- */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <img
          src="https://d8j0ntlcm91z4.cloudfront.net/user_3ERX8BQAFxBlSpuY7HbvVMVJWZI/hf_20260717_173443_a6144895-86d8-4e17-97d2-e2f6482a5e4f.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center sm:object-right"
        />
        {/* Left-to-right darkening so the copy stays readable over the photo. */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, #050506 0%, rgba(5,5,6,0.94) 34%, rgba(5,5,6,0.6) 58%, rgba(5,5,6,0.15) 100%)' }}
        />
        {/* Fade the bottom into the page so the hero blends into the sections below. */}
        <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: 'linear-gradient(180deg, transparent, #060607)' }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-xl">
            {/* Big brand lockup so the site announces itself immediately. */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 mb-9">
              <img src={LOGO_DATA_URI} alt="Poker Logic Lab" width={88} height={88}
                className="h-[72px] w-[72px] sm:h-[88px] sm:w-[88px] shrink-0 drop-shadow-[0_6px_24px_rgba(196,31,42,0.35)]" />
              <span className="font-display text-3xl sm:text-4xl font-semibold leading-[0.95] tracking-tight">
                Poker <span className="accent">Logic</span> Lab
              </span>
            </motion.div>

            <Eyebrow>Decision training · No solver required</Eyebrow>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold leading-[1.02] tracking-tight">
              Stop losing to better math.
              <span className="block accent">Start winning with better reads.</span>
            </motion.h1>

            <p className="text-ink-300 mt-6 max-w-md text-[15px] leading-relaxed">
              The math is the engine. The real skill is reading live opponents under uncertainty,
              the part every other trainer skips.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/replay"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition shadow-[0_12px_34px_-12px_rgba(196,31,42,0.85)]">
                <Spade size={16} /> Play a hand
              </Link>
              <Link to="/visualizer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur-sm text-ink-100 hover:border-brand-400/70 transition">
                Explore equity
              </Link>
            </div>

            <div className="flex items-center gap-5 mt-8 text-ink-500 text-xs">
              <span className="num">169 <span className="font-sans">starting hands</span></span>
              <span className="text-felt-700">|</span>
              <span className="num">10,000 <span className="font-sans">sims / call</span></span>
              <span className="text-felt-700">|</span>
              <span className="num">&lt;100<span className="font-sans">ms on mobile</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Feature grid: varied weights, no icons, dealt-in ---- */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-24 -mt-4">
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
