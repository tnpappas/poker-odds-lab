// Computes the exact hero numbers for the homepage hand with the real engine.
// Run from repo root:  node_modules\.bin\tsx scripts\hero-video\hero-math.ts
import { calculateExactEquity, parseRangeString, rangeToMatrix, potOdds } from '../../packages/poker-engine/src/index.ts';
import type { Card, HandRange } from '../../packages/poker-engine/src/index.ts';

const HERO: [Card, Card] = ['As', 'Kh'];
const VILLAIN = '22+,A9s+,KTs+,QTs+,JTs,ATo+,KQo';
const STREETS: { name: string; board: Card[] }[] = [
  { name: 'preflop', board: [] },
  { name: 'flop', board: ['Qs', 'Th', '2c'] },
  { name: 'turn', board: ['Qs', 'Th', '2c', 'Jd'] },
  { name: 'river', board: ['Qs', 'Th', '2c', 'Jd', '7c'] },
];

const range: HandRange = parseRangeString(VILLAIN);

function exactVsRange(board: Card[]) {
  const blocked = new Set<string>([...HERO, ...board]);
  let num = 0, den = 0, combos = 0;
  for (const c of range) {
    if (c.weight <= 0) continue;
    if (blocked.has(c.cards[0]) || blocked.has(c.cards[1])) continue;
    const r = calculateExactEquity(HERO, c.cards, board);
    num += r.equity * c.weight;
    den += c.weight;
    combos++;
  }
  return { equity: num / den, combos };
}

for (const s of STREETS) {
  if (s.board.length === 0) { console.log('preflop: skipped exact (1.7M runouts per combo); use Monte Carlo below'); continue; }
  const t0 = Date.now();
  const r = exactVsRange(s.board);
  console.log(`${s.name.padEnd(8)} board=${s.board.join(' ')}  equity=${(r.equity * 100).toFixed(2)}%  combos=${r.combos}  (${Date.now() - t0} ms)`);
}
console.log('flop pot odds (pot 6, bet 4): need', (potOdds(6, 4) * 100).toFixed(1), '%');
const m = rangeToMatrix(range);
console.log('villain matrix:'); for (const row of m) console.log(row.map(v => v > 0 ? '#' : '.').join(''));
