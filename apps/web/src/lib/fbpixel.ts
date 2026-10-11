// Typed wrapper around the Meta Pixel (fbq), plus the tracking consent rule.
// The same rule gates Microsoft Clarity (see lib/clarity.ts) and Google
// Analytics (see lib/ga.ts).
//
// The rule (see shouldLoadTracking below):
//   - EU/EEA/UK/Switzerland: nothing loads until the visitor accepts.
//   - Everywhere else: tracking is on by default and the banner is an opt-out.
//   - An explicit choice always wins, everywhere.
// The choice is kept in localStorage so it is asked once per browser (see
// components/CookieConsent.tsx). Every helper no-ops safely if the pixel never
// loaded (declined, ad blocker, local dev).
//
// Dataset / Pixel ID: 1383191933689906 (Poker Logic Lab)

import { loadClarity, stopClarity } from './clarity';
import { loadGoogleAnalytics, stopGoogleAnalytics } from './ga';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const PIXEL_ID = '1383191933689906';
const CONSENT_KEY = 'pol-tracking-consent';

export type ConsentChoice = 'granted' | 'declined';

/** Prices by plan. Keep in sync with Pricing.tsx and the PayPal plans. */
export const PRICE_USD = { monthly: 7.99, annual: 49 } as const;
export type PricedPlan = keyof typeof PRICE_USD;

function readChoice(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

/** The visitor's stored choice, or null if they have not been asked yet. */
export function consentChoice(): ConsentChoice | null {
  return readChoice();
}

/**
 * Regions where prior opt-in is legally required before any tracking tag may
 * load (EU/EEA, UK, Switzerland). Detected from the browser's IANA timezone,
 * which needs no network call and no third-party geo service. Deliberately
 * conservative: anything under Europe/* is strict, and so is "cannot tell"
 * (including the build-time prerender, which has no browser).
 */
export function isOptInRequiredRegion(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('Europe/')) return true;
    return ['Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Reykjavik'].includes(tz);
  } catch {
    return true;
  }
}

/** Should tracking (Meta Pixel, Clarity, Google Analytics) run right now? */
export function shouldLoadTracking(): boolean {
  const v = readChoice();
  if (v === 'declined') return false;
  if (v === 'granted') return true;
  return !isOptInRequiredRegion();
}

let loaded = false;

/** Inject the Meta base pixel and fire the first PageView. Idempotent. */
function loadPixel(): void {
  if (typeof window === 'undefined') return;
  if (loaded) {
    // Re-accepting after an opt-out in the same session.
    window.fbq?.('consent', 'grant');
    return;
  }
  loaded = true;
  if (!window.fbq) {
    const queue: unknown[][] = [];
    const fbq = ((...args: unknown[]) => {
      queue.push(args);
    }) as ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string; push?: unknown };
    fbq.queue = queue;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = fbq;
    window.fbq = fbq;
    window._fbq = fbq;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

/** Record the visitor's choice; starts tracking when granted, stops it when declined. */
export function setConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage blocked: the banner will simply show again next visit.
  }
  if (choice === 'granted') {
    loadPixel();
    loadClarity();
    loadGoogleAnalytics();
  } else {
    // Tracking may already be running (opt-out regions): revoke and stop.
    try {
      window.fbq?.('consent', 'revoke');
    } catch {
      // Never let an opt-out throw.
    }
    stopClarity();
    stopGoogleAnalytics();
  }
}

/** Call once at startup: loads tracking if the consent rule allows it. */
export function initPixelIfConsented(): void {
  if (shouldLoadTracking()) {
    loadPixel();
    loadClarity();
    loadGoogleAnalytics();
  }
}

/** Fired when a visitor gives their email for the free chapters. */
export function trackLead(): void {
  window.fbq?.('track', 'Lead');
}

/** Fired when the user starts checkout for a plan. */
export function trackInitiateCheckout(plan: PricedPlan = 'monthly'): void {
  window.fbq?.('track', 'InitiateCheckout', { value: PRICE_USD[plan], currency: 'USD' });
}

/**
 * Fired on the checkout-success screen.
 *
 * Pass a stable eventId (the PayPal subscription id) so a future server-side
 * Conversions API call can send the same id and Meta de-duplicates the two.
 */
export function trackPurchase(eventId?: string, plan: PricedPlan = 'monthly'): void {
  window.fbq?.(
    'track',
    'Purchase',
    { value: PRICE_USD[plan], currency: 'USD' },
    eventId ? { eventID: eventId } : undefined,
  );
}
