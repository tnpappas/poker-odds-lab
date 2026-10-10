import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { trackLead } from '../lib/fbpixel';
import { Spade } from './icons';

/** The two free chapters (Pot Odds and Outs, Playing the Flop). Hosted in GHL media storage. */
export const FREE_CHAPTERS_URL =
  'https://assets.cdn.filesafe.space/uZ27QI1WPmHwzgqdmss8/media/6a9c980c9a2eb1d780ab192e.pdf';

/**
 * Email capture for the free chapters. The address is saved to GoHighLevel by
 * the API (tag "free-chapters"); the download is handed over right here, so
 * delivery never depends on an email arriving.
 */
export function FreeChapters({ source, className = '' }: { source: string; className?: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await api.freeChapters(email.trim(), source);
    setBusy(false);
    if (res.ok) {
      setDone(true);
      trackLead();
    } else {
      setError(res.error);
    }
  }

  return (
    <section className={`felt-card rounded-2xl p-6 sm:p-8 ${className}`}>
      <h2 className="font-display text-2xl font-semibold tracking-tight">Get 2 chapters free</h2>
      <p className="text-ink-300 mt-2 text-[15px] leading-relaxed max-w-xl">
        Pot Odds and Outs, and Playing the Flop, from our book
        <span className="text-ink-100"> Playing Online Texas Hold’em</span>. The two chapters that
        decide most hands, in plain English.
      </p>

      {done ? (
        <div className="mt-5">
          <p className="text-brass-200 text-sm font-medium">Your chapters are ready.</p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <a href={FREE_CHAPTERS_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
              <Spade size={16} /> Download the 2 chapters (PDF)
            </a>
            <Link to="/replay" className="text-sm text-brand-400 hover:text-brand-300 font-medium">
              Then try the math on a free hand →
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5">
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" aria-label="Email address" autoComplete="email"
              className="flex-1 rounded-xl bg-felt-900 border border-felt-700 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-400" />
            <button disabled={busy}
              className="px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition disabled:opacity-50">
              {busy ? 'Sending…' : 'Get the free chapters'}
            </button>
          </div>
          <p className="text-xs text-ink-500 mt-3">
            Free. By signing up you agree to get Poker Logic Lab emails. Unsubscribe anytime.
          </p>
          {error && <p className="text-sm text-red-400 mt-3" role="alert">{error}</p>}
        </form>
      )}
    </section>
  );
}
