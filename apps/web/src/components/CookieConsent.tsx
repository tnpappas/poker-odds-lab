import { useState } from 'react';
import { Link } from 'react-router-dom';
import { consentChoice, isOptInRequiredRegion, setConsent } from '../lib/fbpixel';

/**
 * One-time tracking notice for ad measurement (Meta Pixel) and usage analytics
 * (Microsoft Clarity, Google Analytics). Two modes, chosen by region:
 *
 *  - Opt-in (EU/EEA/UK): nothing loads until "Accept"; "Decline" records the
 *    refusal and the site stays fully usable.
 *  - Opt-out (everywhere else): tracking is already running (see main.tsx) and
 *    this is a notice with a working "Opt out" that stops all three.
 *
 * The choice is remembered per browser.
 */
export function CookieConsent() {
  const [choice, setChoice] = useState(() => consentChoice());
  const [optIn] = useState(() => isOptInRequiredRegion());
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
          We use a Meta ad pixel to measure whether our ads work, and Microsoft Clarity and Google Analytics
          to see how the site and app get used.{' '}
          {optIn ? 'They load only if you accept.' : 'These are on by default. You can opt out at any time.'}{' '}
          Essential sign-in and payment cookies are always on.{' '}
          <Link to="/privacy" className="underline hover:text-ink-100">Privacy policy</Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => decide('declined')}
            className="px-3.5 py-1.5 rounded-lg border border-felt-700 text-ink-300 hover:text-ink-100 hover:bg-white/[0.04] transition"
          >
            {optIn ? 'Decline' : 'Opt out'}
          </button>
          <button
            type="button"
            onClick={() => decide('granted')}
            className="px-3.5 py-1.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-400 transition"
          >
            {optIn ? 'Accept' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
