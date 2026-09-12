// Typed wrapper around the Meta Pixel (fbq), loaded only after consent.
//
// Nothing from Meta is loaded until the visitor accepts tracking in the
// cookie banner (see components/CookieConsent.tsx). The choice is kept in
// localStorage so it is asked once per browser. Every helper no-ops safely if
// the pixel never loaded (declined, ad blocker, local dev).
//
// Dataset / Pixel ID: 1383191933689906 (Poker Logic Lab)

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

let loaded = false;

/** Inject the Meta base pixel and fire the first PageView. Idempotent. */
function loadPixel(): void {
  if (loaded || typeof window === 'undefined') return;
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

/** Record the visitor's choice; loads the pixel immediately when granted. */
export function setConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage blocked: the banner will simply show again next visit.
  }
  if (choice === 'granted') loadPixel();
}

/** Call once at startup: loads the pixel only if consent was given earlier. */
export function initPixelIfConsented(): void {
  if (readChoice() === 'granted') loadPixel();
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
