// Google Analytics 4 (traffic and page views).
//
// Same rule as the Meta Pixel and Microsoft Clarity (see shouldLoadTracking in
// lib/fbpixel.ts, which owns the stored consent choice): on by default outside
// the EU/EEA/UK, off there until the visitor accepts, and off everywhere after
// an opt-out. No-ops safely if it never loads.
//
// Page views on in-app navigation are picked up by GA4 enhanced measurement
// (browser history events), so no per-route call is needed here.
//
// Measurement ID: G-G5VPEE0P12 (Poker Logic Lab)

const GA_MEASUREMENT_ID = 'G-G5VPEE0P12';

/** Google's documented kill switch: when true, this property sends nothing. */
const DISABLE_KEY = `ga-disable-${GA_MEASUREMENT_ID}`;

let loaded = false;

/** Inject the Google tag. Idempotent. */
export function loadGoogleAnalytics(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>)[DISABLE_KEY] = false;
  if (loaded) return;
  loaded = true;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  const dataLayer = (w.dataLayer = w.dataLayer ?? []);
  // gtag must push the raw arguments object, not an array, or Google ignores it.
  function gtag(..._args: unknown[]): void {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  }
  w.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

/** Opt out: flip Google's kill switch so nothing more is sent. */
export function stopGoogleAnalytics(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>)[DISABLE_KEY] = true;
}
