import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { Card, EquityResult, HandRange } from '@pol/poker-engine';

// A singleton worker shared across the app, with promise-based request IDs.
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./equity.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const { id, result, table, error } = e.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (error) p.reject(new Error(error));
      else p.resolve(result ?? table);
    };
  }
  return worker;
}

function request<T>(payload: object): Promise<T> {
  const id = nextId++;
  const w = getWorker();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, ...payload });
  });
}

export function computeEquity(
  hero: [Card, Card],
  range: HandRange | 'random',
  board: Card[],
  sims = 8000,
): Promise<EquityResult> {
  return request<EquityResult>({ type: 'equity', hero, range, board, sims });
}

export function computePreflopTable(sims = 10000): Promise<Record<string, number>> {
  return request<Record<string, number>>({ type: 'preflopTable', sims });
}

/**
 * Hook returning a debounced equity calculator. Cancels superseded requests so
 * dragging a slider only ever reflects the latest input.
 */
export function useLiveEquity(onResult: (eq: EquityResult) => void, debounceMs = 60) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(0);
  // Keep the latest callback in a ref so `run` stays referentially stable —
  // otherwise it changes every render and re-triggers effects in a loop.
  const cb = useRef(onResult);
  useLayoutEffect(() => { cb.current = onResult; });

  const run = useCallback(
    (hero: [Card, Card], range: HandRange | 'random', board: Card[], sims = 8000) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const token = ++latest.current;
        computeEquity(hero, range, board, sims).then((res) => {
          if (token === latest.current) cb.current(res);
        });
      }, debounceMs);
    },
    [debounceMs],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return run;
}
