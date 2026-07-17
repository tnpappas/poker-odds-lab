import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useGameStore } from '../store/useGameStore';
import { Spade } from './icons';

/**
 * Shown when the browser returns from a successful Polar checkout
 * (URL contains ?checkout=success). Confirms the purchase and refreshes
 * entitlement, retrying a few times in case the webhook is still landing.
 */
export function CheckoutSuccess() {
  const [open, setOpen] = useState(false);
  const setPlan = useGameStore((s) => s.setPlan);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;

    setOpen(true);
    // Clean the query string so a refresh doesn't re-trigger this.
    params.delete('checkout');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));

    // Poll entitlement a few times; the Polar webhook may still be processing.
    let cancelled = false;
    const delays = [0, 2500, 5000, 9000];
    delays.forEach((d) => {
      setTimeout(async () => {
        if (cancelled) return;
        const me = await api.getMe();
        if (!cancelled && me?.plan) setPlan(me.plan);
      }, d);
    });
    return () => { cancelled = true; };
  }, [setPlan]);

  return (
    <AnimatePresence>
      {open && (
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
            <div className="eyebrow mb-2">Payment complete</div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">You’re in.</h2>
            <p className="text-ink-300 mt-3 text-[15px] leading-relaxed">
              Lifetime access is unlocked. Every tool in the lab is yours now, forever. Time to
              stop losing to better math.
            </p>
            <div className="flex flex-col gap-2 mt-7">
              <Link to="/replay" onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
                <Spade size={16} /> Play your first hand
              </Link>
              <button onClick={() => setOpen(false)} className="text-sm text-ink-500 hover:text-ink-300 mt-1">
                I’ll explore on my own
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
