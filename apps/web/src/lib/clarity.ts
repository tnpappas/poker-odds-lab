// Microsoft Clarity (session recordings + heatmaps), loaded only after consent.
//
// Same rule as the Meta Pixel: nothing from Clarity is loaded until the visitor
// accepts tracking in the cookie banner. Called from lib/fbpixel.ts, which owns
// the stored consent choice. No-ops safely if it never loads.
//
// Project ID: yha4qfsr0s (Poker Logic Lab)

const CLARITY_PROJECT_ID = 'yha4qfsr0s';

let loaded = false;

/** Inject the Clarity tag. Idempotent. */
export function loadClarity(): void {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  const w = window as unknown as Record<string, unknown>;
  if (typeof w.clarity !== 'function') {
    const queue: unknown[][] = [];
    const stub = ((...args: unknown[]) => {
      queue.push(args);
    }) as ((...args: unknown[]) => void) & { q?: unknown[][] };
    stub.q = queue;
    w.clarity = stub;
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  document.head.appendChild(s);
}
