/// <reference lib="webworker" />
import {
  calculateEquity,
  computePreflopEquityTable,
  type Card,
  type HandRange,
} from '@pol/poker-engine';

type Req =
  | { id: number; type: 'preflopTable'; sims?: number }
  | { id: number; type: 'equity'; hero: [Card, Card]; range: HandRange | 'random'; board: Card[]; sims?: number };

self.onmessage = (e: MessageEvent<Req>) => {
  const msg = e.data;
  try {
    if (msg.type === 'preflopTable') {
      const table = computePreflopEquityTable(msg.sims ?? 10000);
      (self as unknown as Worker).postMessage({ id: msg.id, table });
    } else if (msg.type === 'equity') {
      const res = calculateEquity(msg.hero, msg.range, msg.board, msg.sims ?? 8000);
      (self as unknown as Worker).postMessage({ id: msg.id, result: res });
    }
  } catch (err) {
    (self as unknown as Worker).postMessage({ id: msg.id, error: String(err) });
  }
};
