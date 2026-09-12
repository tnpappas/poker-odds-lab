import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { api, apiEnabled, type CheckoutPlan } from '../lib/api';
import { trackInitiateCheckout } from '../lib/fbpixel';

const TIERS: { name: string; price: string; note: string; plan: CheckoutPlan; highlight?: boolean }[] = [
  { name: 'Monthly', price: '$7.99/mo', note: 'cancel anytime', plan: 'monthly', highlight: true },
  { name: 'Annual', price: '$49/yr', note: 'save 49% \u2014 about $4.08/mo', plan: 'annual' },
];

export function Paywall({ reason, onClose }: { reason: string; onClose: () => void }) {
  const setPlan = useGameStore((s) => s.setPlan);
  const [busy, setBusy] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(plan: CheckoutPlan) {
    setError(null);
    if (!apiEnabled) {
      if (import.meta.env.DEV) {
        setPlan('pro');
        onClose();
        return;
      }
      setError(
        'Checkout is temporarily unavailable. Please email support@pokerlogiclab.com and we will get you sorted right away.'
      );
      return;
    }
    setBusy(plan);
    trackInitiateCheckout(plan);
    const result = await api.startCheckout(plan);
    if (!result.ok) {
      setBusy(null);
      setError(result.error ?? 'Could not start checkout.');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg mx-auto mt-10 px-4"
    >
      <div className="rounded-3xl bg-gradient-to-b from-felt-800 to-felt-950 border border-gold-500/40 p-8 text-center shadow-2xl">
        <div className="text-gold-400 text-sm uppercase tracking-widest mb-2">Unlock everything</div>
        <h2 className="text-2xl font-bold mb-1">You&apos;re in the zone \u2014 keep going.</h2>
        <p className="text-ink-300 text-sm mb-6">{reason}</p>

        <div className="space-y-3 mb-6">
          {TIERS.map((t) => (
            <button
              key={t.name}
              onClick={() => choose(t.plan)}
              disabled={busy !== null}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border text-left transition disabled:opacity-60 ${
                t.highlight
                  ? 'border-gold-500 bg-gold-500/10 hover:bg-gold-500/20'
                  : 'border-felt-700 bg-felt-900 hover:bg-felt-800'
              }`}
            >
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-ink-500">{t.note}</div>
              </div>
              <div className="text-xl font-bold text-gold-400">
                {busy === t.plan ? '\u2026' : t.price}
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-ink-300 mb-4">
          Includes every tool in the lab, the complete book{' '}
          <span className="text-ink-100">
            Playing Online Texas Hold&rsquo;em
          </span>{' '}
          (all 19 chapters), and new Lab Notes every week.
        </p>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <div className="flex items-center justify-between mt-4">
          <Link to="/pricing" className="text-sm text-brand-400 hover:text-brand-300 font-medium">
            See what is included
          </Link>
          <button onClick={onClose} className="text-sm text-ink-500 hover:text-ink-300">
            Maybe later
          </button>
        </div>
      </div>
    </motion.div>
  );
}
