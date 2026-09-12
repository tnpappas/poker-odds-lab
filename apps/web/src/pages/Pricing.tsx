import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { clerkEnabled } from '../lib/auth';
import { useGameStore } from '../store/useGameStore';
import { api, type CheckoutPlan } from '../lib/api';
import { trackInitiateCheckout } from '../lib/fbpixel';
import { Eyebrow } from '../components/ui';
import { Spade } from '../components/icons';
import { BOOK_COVER_DATA_URI } from '../components/GuideDownload';

const INCLUDED = [
  'Hand Replay, the core loop: pause at every street, read the range, make the call',
  'Equity Visualizer: all 169 starting hands, colored by equity, live against any range',
  'Mental Math Blitz: 30-second pot odds and EV sprints',
  'Equity Calculator: your hand vs any range on any board',
  'Tournament Lab: push/fold and ICM for the spots that decide tournaments',
  'Adversary Lab: model a real opponent from six reads and train against them',
  'EV Dashboard with automatic leak detection',
  'The complete book, Playing Online Texas Hold\u2019em, all 19 chapters, yours to download and keep',
  'New Lab Notes delivered every week',
  'Weekly leak reports by email',
];

const TIERS: { plan: CheckoutPlan; label: string; price: string; period: string; note: string; highlight?: boolean }[] = [
  { plan: 'monthly', label: 'Monthly', price: '$7.99', period: '/mo', note: 'Cancel anytime', highlight: true },
  { plan: 'annual', label: 'Annual', price: '$49', period: '/yr', note: 'Save 49% \u2014 about $4.08/mo' },
];

/**
 * Public pricing page.
 *
 * Free tier: 3 replays/day, 2 blitz rounds/day, Visualizer and Calculator free.
 * Paid tiers: Monthly $7.99/mo or Annual $49/yr, billed through PayPal.
 */
export function Pricing() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-6 pb-28">
      <div className="text-center">
        <Eyebrow>Pricing</Eyebrow>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
          Train every day. Pay less than one solver month.
        </h1>
        <p className="text-ink-300 mt-4 text-[15px] leading-relaxed max-w-xl mx-auto">
          Try 3 hands free every day, no sign-up needed. When you want more, pick a plan.
          Cancel anytime.
        </p>
      </div>

      {/* Free tier summary */}
      <div className="felt-card rounded-2xl p-5 mt-7 text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="num font-display text-3xl font-semibold text-ink-100">Free</span>
          <span className="text-ink-500 text-sm">3 hands / day</span>
        </div>
        <p className="text-ink-300 text-sm mt-2">
          Replay, Blitz, Visualizer, and Calculator. No sign-up needed.
        </p>
        <Link to="/replay" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl border border-white/20 bg-black/30 text-ink-100 hover:border-brand-400/70 transition text-sm font-medium">
          <Spade size={14} /> Play a free hand
        </Link>
      </div>

      {/* Paid tiers */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="felt-card rounded-2xl p-6 sm:p-8 mt-4"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={BOOK_COVER_DATA_URI}
            alt="Playing Online Texas Hold\u2019em book cover"
            className="w-24 sm:w-28 rounded-lg shadow-2xl shrink-0 ring-1 ring-white/10"
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Unlimited access
            </h2>
            <p className="text-ink-300 mt-2 text-sm leading-relaxed">
              Every tool, unlimited hands, the complete book, and new Lab Notes every week.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-7">
          {TIERS.map((t) => (
            <div
              key={t.plan}
              className={`rounded-xl p-5 border text-center transition ${
                t.highlight
                  ? 'border-brand-400/60 bg-brand-500/[0.07]'
                  : 'border-felt-700 bg-felt-900/50'
              }`}
            >
              <div className="text-xs text-ink-500 uppercase tracking-wide">{t.label}</div>
              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="num font-display text-4xl font-semibold text-brass-300">{t.price}</span>
                <span className="text-ink-500 text-sm">{t.period}</span>
              </div>
              <p className="text-xs text-ink-400 mt-2">{t.note}</p>
              <div className="mt-5">
                <BuyButton plan={t.plan} label={t.highlight ? `Go ${t.label}` : `Go ${t.label}`} />
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-7 space-y-2.5">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-3 text-[14px] text-ink-200 leading-relaxed">
              <Spade size={13} className="mt-1.5 shrink-0 text-brand-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 border-t border-felt-700/50 pt-5">
          <BuyBlock />
        </div>

        <p className="text-xs text-ink-500 mt-5 text-center leading-relaxed">
          Covered by our{' '}
          <Link to="/refunds" className="text-brand-400 hover:text-brand-300">
            14-day money-back guarantee
          </Link>
          . Cancel anytime from your account or by emailing support.
        </p>
      </motion.div>

      <p className="text-xs text-ink-500 mt-8 text-center leading-relaxed max-w-lg mx-auto">
        Poker Logic Lab is decision-training software. Every hand is simulated, so there is no money
        at risk and nothing to win.
      </p>

      <p className="text-sm text-ink-500 mt-8 text-center">
        Questions first?{' '}
        <a href="mailto:support@pokerlogiclab.com" className="text-brand-400 hover:text-brand-300">
          Email support
        </a>{' '}
        and a human will answer.
      </p>
    </div>
  );
}

const BTN =
  'w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition disabled:opacity-60';

function BuyButton({ plan, label }: { plan: CheckoutPlan; label: string }) {
  if (!clerkEnabled) {
    return (
      <Link to="/replay" className={BTN}>
        <Spade size={14} /> Open the lab
      </Link>
    );
  }
  return (
    <>
      <SignedOut>
        <SignUpButton
          mode="modal"
          forceRedirectUrl={`/pricing?buy=${plan}`}
          signInForceRedirectUrl={`/pricing?buy=${plan}`}
        >
          <button className={BTN}>
            <Spade size={14} /> {label}
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <SignedInBuy plan={plan} label={label} />
      </SignedIn>
    </>
  );
}

function BuyBlock() {
  if (!clerkEnabled) {
    return (
      <Link to="/replay" className={`${BTN} max-w-xs mx-auto`}>
        <Spade size={16} /> Open the lab
      </Link>
    );
  }
  return (
    <>
      <SignedOut>
        <div className="text-center">
          <SignUpButton
            mode="modal"
            forceRedirectUrl="/pricing?buy=monthly"
            signInForceRedirectUrl="/pricing?buy=monthly"
          >
            <button className={`${BTN} max-w-xs mx-auto`}>
              <Spade size={16} /> Start unlimited
            </button>
          </SignUpButton>
          <p className="text-xs text-ink-500 mt-3 text-center">
            Create your account, then choose a plan.
          </p>
          <p className="text-sm text-ink-500 mt-3 text-center">
            Already a member?{' '}
            <SignInButton mode="modal" forceRedirectUrl="/pricing" signUpForceRedirectUrl="/pricing?buy=monthly">
              <button className="text-brand-400 hover:text-brand-300 font-medium">Sign in</button>
            </SignInButton>
          </p>
        </div>
      </SignedOut>
      <SignedIn>
        <SignedInBuy plan="monthly" label="Start unlimited" showAlreadyPro />
      </SignedIn>
    </>
  );
}

function SignedInBuy({
  plan,
  label,
  showAlreadyPro,
}: {
  plan: CheckoutPlan;
  label: string;
  showAlreadyPro?: boolean;
}) {
  const currentPlan = useGameStore((s) => s.plan);
  const planLoaded = useGameStore((s) => s.planLoaded);
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function buy(buyPlan: CheckoutPlan) {
    setError(null);
    setBusy(buyPlan);
    trackInitiateCheckout();
    const result = await api.startCheckout(buyPlan);
    if (!result.ok) {
      setBusy(null);
      setError(
        result.error ??
          'Could not start checkout. Please try again, or email support@pokerlogiclab.com.'
      );
    }
  }

  // Arriving from sign-up with ?buy=<plan>: auto-start checkout.
  useEffect(() => {
    if (started.current) return;
    const buyPlan = params.get('buy');
    if (!buyPlan || (buyPlan !== 'monthly' && buyPlan !== 'annual')) return;
    if (!planLoaded || currentPlan !== 'free') return;
    started.current = true;
    setParams({}, { replace: true });
    void buy(buyPlan as CheckoutPlan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planLoaded, currentPlan, params]);

  if (!planLoaded) {
    return (
      <div className="num text-ink-500 text-sm text-center animate-pulse py-3">
        Checking your access\u2026
      </div>
    );
  }

  if (currentPlan !== 'free') {
    if (!showAlreadyPro) return null;
    return (
      <div className="text-center">
        <p className="text-chip-green text-sm font-medium mb-4">You already have unlimited access.</p>
        <Link to="/replay" className={`${BTN} max-w-xs mx-auto`}>
          <Spade size={16} /> Open the lab
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button onClick={() => buy(plan)} disabled={busy !== null} className={`${BTN} max-w-xs mx-auto`}>
        <Spade size={14} /> {busy ? 'Opening secure checkout\u2026' : label}
      </button>
      {error && (
        <p className="text-sm text-oxblood-400 mt-3 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
