import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { api, type Plan } from '../lib/api';
import { clerkEnabled } from '../lib/auth';
import { trackPurchase } from '../lib/fbpixel';
import { useGameStore } from '../store/useGameStore';
import { Spade } from './icons';
import { BOOK_URL } from './GuideDownload';

const SUPPORT_EMAIL = 'support@pokerlogiclab.com';

/**
 * Shown when the browser returns from a checkout.
 *   - PayPal: URL contains ?checkout=paypal&token=<orderId>. We capture the
 *     order server-side, which is what actually collects the money, then
 *     confirm entitlement.
 *   - Polar (legacy/fallback): URL contains ?checkout=success. The webhook
 *     grants access, so we just poll entitlement until it lands.
 *
 * Two rules this screen must never break:
 *   1. Never claim "you're in" until the SERVER says the plan is no longer
 *      free. The old version announced success the moment the browser came
 *      back from PayPal, so a failed capture looked identical to a paid one.
 *   2. Never fire the capture before Clerk has loaded. Without a session token
 *      the API answers 401 and the payment is never collected at all.
 */
export function CheckoutSuccess() {
  // Hooks cannot be conditional and useAuth() requires a ClerkProvider, so the
  // Clerk-aware variant lives in its own component.
  return clerkEnabled ? <ClerkCheckoutSuccess /> : <CheckoutFlow authReady getToken={noToken} />;
}

const noToken = async (): Promise<string | null> => null;

function ClerkCheckoutSuccess() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const token = useCallback(() => getToken().catch(() => null), [getToken]);
  return <CheckoutFlow authReady={isLoaded && !!isSignedIn} getToken={token} />;
}

type Phase = 'idle' | 'working' | 'success' | 'pending' | 'failed';

interface Return {
  provider: 'paypal' | 'polar';
  orderId: string | null;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function CheckoutFlow({
  authReady,
  getToken,
}: {
  authReady: boolean;
  getToken: () => Promise<string | null>;
}) {
  const setPlan = useGameStore((s) => s.setPlan);
  const [phase, setPhase] = useState<Phase>('idle');
  const [ret, setRet] = useState<Return | null>(null);
  const started = useRef(false);

  // Read the return params once, then scrub them so a refresh can't re-run this.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout !== 'success' && checkout !== 'paypal') return;

    // PayPal appends subscription_id=I-..., ba_token=BA-... and token=... to
    // the return URL. Only subscription_id identifies the subscription; the
    // billing-agreement token is a different object and must not be used.
    const subId = params.get('subscription_id');
    setRet({ provider: checkout === 'paypal' ? 'paypal' : 'polar', orderId: subId });
    setPhase('working');

    params.delete('checkout');
    params.delete('token');
    params.delete('ba_token');
    params.delete('subscription_id');
    params.delete('PayerID');
    params.delete('plan');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, []);

  // Capture the payment (PayPal) and then confirm entitlement with the server.
  useEffect(() => {
    if (!ret || !authReady || started.current) return;
    started.current = true;
    let cancelled = false;

    (async () => {
      let capturePending = false;

      if (ret.provider === 'paypal' && ret.orderId) {
        // A transient failure here means real money never moves, so retry.
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await wait(1500 * attempt);
          if (cancelled) return;
          const outcome = await api.captureCheckout(ret.orderId, await getToken());
          if (outcome.ok) break;
          if (outcome.reason === 'pending') {
            capturePending = true;
            break;
          }
        }
      }

      // The server is the only authority on entitlement. Poll a few times: the
      // webhook may still be settling.
      let plan: Plan = 'free';
      for (const delay of [0, 2000, 3000, 5000, 8000]) {
        if (delay) await wait(delay);
        if (cancelled) return;
        const me = await api.getMe(await getToken());
        if (me?.plan && me.plan !== 'free') {
          plan = me.plan;
          break;
        }
      }
      if (cancelled) return;

      if (plan !== 'free') {
        setPlan(plan);
        // Only report a purchase to Meta once it is real.
        trackPurchase(ret.orderId ?? undefined);
        setPhase('success');
      } else {
        setPhase(capturePending ? 'pending' : 'failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ret, authReady, getToken, setPlan]);

  const close = () => setPhase('idle');

  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="felt-card rounded-2xl max-w-md w-full p-8 text-center">
            <span className="grid place-items-center h-14 w-14 mx-auto rounded-full mb-5"
              style={{ background: 'radial-gradient(circle at 35% 30%, #db3b44, #9e1620)' }}>
              <Spade size={26} className="text-white" />
            </span>

            {phase === 'working' && <Working />}
            {phase === 'success' && <Success onClose={close} />}
            {phase === 'pending' && <Pending onClose={close} />}
            {phase === 'failed' && <Failed onClose={close} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Working() {
  return (
    <>
      <div className="eyebrow mb-2">Confirming payment</div>
      <h2 className="font-display text-3xl font-semibold tracking-tight">One moment.</h2>
      <p className="text-ink-300 mt-3 text-[15px] leading-relaxed">
        We&rsquo;re completing your payment and unlocking your account. Please keep this window open,
        it usually takes a few seconds.
      </p>
      <p className="num text-ink-500 text-sm mt-6 animate-pulse">Working…</p>
    </>
  );
}

function Success({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="eyebrow mb-2">Payment complete</div>
      <h2 className="font-display text-3xl font-semibold tracking-tight">You&rsquo;re in.</h2>
      <p className="text-ink-300 mt-3 text-[15px] leading-relaxed">
        Unlimited access is unlocked. Every tool in the lab is yours, and your
        complete guide is ready below. Time to stop losing to better math.
      </p>
      <div className="flex flex-col gap-2 mt-7">
        <Link to="/replay" onClick={onClose}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
          <Spade size={16} /> Play your first hand
        </Link>
        <a href={BOOK_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-brass-400/50 text-brass-200 font-semibold hover:border-brass-400 hover:text-brass-100 transition">
          Download your guide
        </a>
        <button onClick={onClose} className="text-sm text-ink-500 hover:text-ink-300 mt-1">
          I&rsquo;ll explore on my own
        </button>
      </div>
    </>
  );
}

function Pending({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="eyebrow mb-2">Payment received</div>
      <h2 className="font-display text-3xl font-semibold tracking-tight">Almost there.</h2>
      <p className="text-ink-300 mt-3 text-[15px] leading-relaxed">
        Your payment went through and your account is being unlocked. This can take a minute.
        Refresh the page shortly and the tools will be open. If they aren&rsquo;t, email{' '}
        <a className="text-brass-200 hover:text-brass-100" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{' '}
        and we&rsquo;ll sort it out right away.
      </p>
      <button onClick={onClose} className="mt-7 text-sm text-ink-500 hover:text-ink-300">Close</button>
    </>
  );
}

function Failed({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="eyebrow mb-2">Payment not completed</div>
      <h2 className="font-display text-3xl font-semibold tracking-tight">That didn&rsquo;t go through.</h2>
      <p className="text-ink-300 mt-3 text-[15px] leading-relaxed">
        We couldn&rsquo;t finish your purchase, so you have not been charged. Please try again, and
        if it happens twice email{' '}
        <a className="text-brass-200 hover:text-brass-100" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{' '}
        and we&rsquo;ll get you in by hand.
      </p>
      <div className="flex flex-col gap-2 mt-7">
        <button onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
          Try again
        </button>
        <button onClick={onClose} className="text-sm text-ink-500 hover:text-ink-300 mt-1">Close</button>
      </div>
    </>
  );
}
