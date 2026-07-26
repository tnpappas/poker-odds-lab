// Lightweight typed wrapper around the Meta Pixel (fbq).
//
// The base pixel (init + PageView) is loaded in index.html. These helpers just
// fire conversion events and no-op safely if fbq never loaded (ad blocker,
// local dev, etc.), so they're safe to call anywhere.
//
// Dataset / Pixel ID: 1383191933689906 (Poker Logic Lab)

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** One-time launch price. Keep in sync with the Paywall tier + server. */
export const PRICE_USD = 24.99;

/** Fired when the user starts checkout (clicks the Lifetime tier). */
export function trackInitiateCheckout(): void {
  window.fbq?.('track', 'InitiateCheckout', { value: PRICE_USD, currency: 'USD' });
}

/**
 * Fired on the checkout-success screen.
 *
 * Pass a stable `eventId` (e.g. the PayPal order id) so that when we add the
 * server-side Conversions API, the server can send the SAME id and Meta will
 * de-duplicate the browser + server Purchase events instead of double-counting.
 */
export function trackPurchase(eventId?: string): void {
  window.fbq?.(
    'track',
    'Purchase',
    { value: PRICE_USD, currency: 'USD' },
    eventId ? { eventID: eventId } : undefined,
  );
}
