import { useState } from 'react';
import { Link } from 'react-router-dom';
import { consentChoice, setConsent } from '../lib/fbpixel';

/**
 * One-time tracking consent banner. Ad measurement (Meta Pixel) only loads
 * after "Accept"; "Decline" keeps the site fully usable with no ad tracking.
 * The choice is remembered per browser.
 */
export function CookieConsent() {
  const [choice, setChoice] = useState(() => consentChoice());
  if (choice) return null;

  const decide = (c: 'granted' | 'declined') => {
    setConsent(c);
    setChoice(c);
  };

  return (
    <div
      role="dialog"
      aria-label="Tracking consent"
      className="fixed inset-x-0 bottom-14 lg:bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-3xl mx-auto rounded-xl border border-felt-800/80 bg-ink-950/95 backdrop-blur-md shadow-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-ink-300">
        <p className="flex-1">
          We use a Meta ad pixel to measure whether our ads work. It loads only if you accept. Essential
          sign-in and payment cookies are always on.{' '}
          <Link to="/privacy" className="underline hover:text-ink-100">Privacy policy</Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => decide('declined')}
            className="px-3.5 py-1.5 rounded-lg border border-felt-700 text-ink-300 hover:text-ink-100 hover:bg-white/[0.04] transition"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide('granted')}
            className="px-3.5 py-1.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-400 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
