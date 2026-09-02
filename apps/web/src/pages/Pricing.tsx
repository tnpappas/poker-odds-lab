import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { clerkEnabled } from '../lib/auth';
import { useGameStore } from '../store/useGameStore';
import { api } from '../lib/api';
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
  'The complete book, Playing Online Texas Hold’em, all 19 chapters, yours to download and keep',
];

/**
 * Public pricing page.
 *
 * This is the only place a logged-out visitor is asked to buy, so it has to
 * carry the whole pitch: price, what is included, how payment works, and the
 * refund promise. Purchases are tied to an account (entitlement lives on the
 * user record and PayPal orders carry the user id), so the button creates the
 * account first, then returns here with ?buy=1 and starts checkout
 * automatically. The visitor sees one continuous flow, not a dead end.
 */
export function Pricing() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-6 pb-28">
      <div className="text-center">
        <Eyebrow>Lifetime access</Eyebrow>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
          Pay once. Keep the whole lab.
        </h1>
        <p className="text-ink-300 mt-4 text-[15px] leading-relaxed max-w-xl mx-auto">
          Every trainer in the lab and the complete book, for a single payment. No subscription,
          no renewal, nothing to cancel.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="felt-card rounded-2xl p-6 sm:p-9 mt-9"
      >
        <div className="flex flex-col sm:flex-row items-center gap-7">
          <img
            src={BOOK_COVER_DATA_URI}
            alt="Playing Online Texas Hold’em book cover"
            className="w-28 sm:w-32 rounded-lg shadow-2xl shrink-0 ring-1 ring-white/10"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-baseline justify-center sm:justify-start gap-2">
              <span className="num font-display text-5xl font-semibold text-brass-300">$24.99</span>
              <span className="text-ink-500 text-sm">once</span>
            </div>
            <p className="text-ink-300 mt-3 text-sm leading-relaxed">
              Less than one month of a solver subscription. Yours forever.
            </p>
          </div>
        </div>

        <ul className="mt-8 space-y-2.5">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-3 text-[15px] text-ink-200 leading-relaxed">
              <Spade size={13} className="mt-1.5 shrink-0 text-brand-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9">
          <BuyBlock />
        </div>

        <p className="text-xs text-ink-500 mt-5 text-center leading-relaxed">
          Pay by debit or credit card, or with PayPal. A PayPal account is not required.
        </p>
        <p className="text-xs text-ink-500 mt-2 text-center leading-relaxed">
          Covered by our <Link to="/refunds" className="text-brand-400 hover:text-brand-300">14-day money-back guarantee</Link>.
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
  'w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition disabled:opacity-60';

function BuyBlock() {
  // Local/dev with no Clerk key: nothing is gated, so just send them in.
  if (!clerkEnabled) {
    return (
      <Link to="/replay" className={BTN}>
        <Spade size={16} /> Open the lab
      </Link>
    );
  }
  return (
    <>
      <SignedOut>
        <SignUpButton mode="modal" forceRedirectUrl="/pricing?buy=1" signInForceRedirectUrl="/pricing?buy=1">
          <button className={BTN}>
            <Spade size={16} /> Get lifetime access
          </button>
        </SignUpButton>
        <p className="text-xs text-ink-500 mt-3 text-center">
          We create your account first so your purchase is saved to it, then take you straight to payment.
        </p>
        <p className="text-sm text-ink-500 mt-4 text-center">
          Already bought it?{' '}
          <SignInButton mode="modal" forceRedirectUrl="/pricing" signUpForceRedirectUrl="/pricing?buy=1">
            <button className="text-brand-400 hover:text-brand-300 font-medium">Sign in</button>
          </SignInButton>
        </p>
      </SignedOut>
      <SignedIn>
        <SignedInBuy />
      </SignedIn>
    </>
  );
}

function SignedInBuy() {
  const plan = useGameStore((s) => s.plan);
  const planLoaded = useGameStore((s) => s.planLoaded);
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function buy() {
    setError(null);
    setBusy(true);
    trackInitiateCheckout();
    const result = await api.startCheckout('lifetime');
    // On success the browser is redirected to PayPal, so we only land here on failure.
    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? 'Could not start checkout. Please try again, or email support@pokerlogiclab.com.');
    }
  }

  // Arriving back from sign-up with ?buy=1: continue straight into checkout so
  // creating the account feels like one step of buying, not a detour.
  useEffect(() => {
    if (started.current) return;
    if (params.get('buy') !== '1') return;
    if (!planLoaded || plan !== 'free') return;
    started.current = true;
    setParams({}, { replace: true });
    void buy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planLoaded, plan, params]);

  if (!planLoaded) {
    return <div className="num text-ink-500 text-sm text-center animate-pulse py-3">Checking your access…</div>;
  }

  if (plan !== 'free') {
    return (
      <div className="text-center">
        <p className="text-chip-green text-sm font-medium mb-4">You already have lifetime access.</p>
        <Link to="/replay" className={BTN}>
          <Spade size={16} /> Open the lab
        </Link>
      </div>
    );
  }

  return (
    <>
      <button onClick={buy} disabled={busy} className={BTN}>
        <Spade size={16} /> {busy ? 'Opening secure checkout…' : 'Get lifetime access for $24.99'}
      </button>
      {error && (
        <p className="text-sm text-oxblood-400 mt-3 text-center" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
