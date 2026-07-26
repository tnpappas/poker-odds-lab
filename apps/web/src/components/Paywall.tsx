import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { api, apiEnabled, type CheckoutPlan } from '../lib/api';
import { trackInitiateCheckout } from '../lib/fbpixel';

const TIERS: { name: string; price: string; note: string; plan: CheckoutPlan; highlight?: boolean }[] = [
  { name: 'Lifetime', price: '$24.99', note: 'one-time — pay once, unlock everything forever', plan: 'lifetime', highlight: true },
];

export function Paywall({ reason, onClose }: { reason: string; onClose: () => void }) {
  const setPlan = useGameStore((s) => s.setPlan);
  const [busy, setBusy] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(plan: CheckoutPlan) {
    setError(null);
    if (!apiEnabled) {
      // Local-only mode (no backend): fall back to a demo unlock for testing.
      setPlan('pro');
      onClose();
      return;
    }
    setBusy(plan);
    // Meta Pixel: user is starting a real checkout.
    trackInitiateCheckout();
    const result = await api.startCheckout(plan);
    if (!result.ok) {
      setBusy(null);
      setError(result.error ?? 'Could not start checkout.');
    }
    // On success the browser is redirected to Polar checkout.
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-lg mx-auto mt-10 px-4">
      <div className="rounded-3xl bg-gradient-to-b from-felt-800 to-felt-950 border border-gold-500/40 p-8 text-center shadow-2xl">
        <div className="text-gold-400 text-sm uppercase tracking-widest mb-2">Unlock everything</div>
        <h2 className="text-2xl font-bold mb-1">You're in the zone — keep going.</h2>
        <p className="text-ink-300 text-sm mb-6">{reason}</p>

        <div className="space-y-3 mb-6">
          {TIERS.map((t) => (
            <button key={t.name} onClick={() => choose(t.plan)} disabled={busy !== null}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border text-left transition disabled:opacity-60 ${t.highlight ? 'border-gold-500 bg-gold-500/10 hover:bg-gold-500/20' : 'border-felt-700 bg-felt-900 hover:bg-felt-800'}`}>
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-ink-500">{t.note}</div>
              </div>
              <div className="text-xl font-bold text-gold-400">{busy === t.plan ? '…' : t.price}</div>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        {!apiEnabled && (
          <p className="text-xs text-ink-500 mb-3">
            Running in local-only mode — selecting a plan unlocks Pro for testing. Connect the API to enable real checkout.
          </p>
        )}

        <button onClick={onClose} className="mt-1 text-sm text-ink-500 hover:text-ink-300">
          Maybe later
        </button>
      </div>
    </motion.div>
  );
}
