import { Link } from 'react-router-dom';
import { Spade } from '../components/icons';
import { LOGO_WORDMARK_DATA_URI } from '../brand';

/**
 * Catch-all 404. Without this route react-router renders its own developer
 * error screen, which reads like a broken site to a customer who followed a
 * stale link. Always leave them a way home and a way to buy.
 */
export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 text-center">
      <img src={LOGO_WORDMARK_DATA_URI} alt="Poker Logic Lab" className="h-11 mb-8" />
      <p className="eyebrow">Error 404</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
        That page is not in the deck.
      </h1>
      <p className="text-ink-300 mt-4 text-[15px] leading-relaxed max-w-md">
        The link may be old, or we may have moved the page. Nothing is wrong with your account.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition"
        >
          <Spade size={16} /> Back to home
        </Link>
        <Link
          to="/pricing"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-felt-700 text-ink-100 font-semibold hover:bg-white/[0.04] transition"
        >
          See what is included
        </Link>
      </div>
      <p className="text-sm text-ink-500 mt-8">
        Still stuck?{' '}
        <a href="mailto:support@pokerlogiclab.com" className="text-brand-400 hover:text-brand-300">
          Email support
        </a>
        .
      </p>
    </div>
  );
}
