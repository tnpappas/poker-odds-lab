// Microsoft Clarity (session recordings + heatmaps).
//
// Same rule as the Meta Pixel (see shouldLoadTracking in lib/fbpixel.ts, which
// owns the stored consent choice): on by default outside the EU/EEA/UK, off
// there until the visitor accepts, and off everywhere after an opt-out.
// No-ops safely if it never loads.
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

/** Opt out: tell Clarity to drop its cookies and stop recording. */
export function stopClarity(): void {
  if (typeof window === 'undefined') return;
  const c = (window as unknown as { clarity?: (...args: unknown[]) => void }).clarity;
  try {
    c?.('consent', false);
    c?.('stop');
  } catch {
    // Never let an opt-out throw.
  }
}
