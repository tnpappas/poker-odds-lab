import { motion } from 'framer-motion';
import type { Card } from '@pol/poker-engine';

const SUIT_GLYPH: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_COLOR: Record<string, string> = {
  s: '#1a1a1a',
  c: '#1a7d3a',
  h: '#e63946',
  d: '#2a6fd4',
};

export function PlayingCard({
  card,
  size = 'md',
  faceDown = false,
  delay = 0,
}: {
  card?: Card;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
  delay?: number;
}) {
  const dims =
    size === 'lg'
      ? 'w-16 h-24 text-2xl'
      : size === 'sm'
        ? 'w-9 h-13 text-sm'
        : 'w-12 h-18 text-lg';

  if (faceDown || !card) {
    return (
      <div
        className={`${dims} rounded-lg border border-felt-700 bg-gradient-to-br from-felt-700 to-felt-900 shadow-lg`}
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1a4536, #1a4536 4px, #123026 4px, #123026 8px)' }}
      />
    );
  }

  const rank = card[0] === 'T' ? '10' : card[0];
  const suit = card[1];

  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0, y: -8 }}
      animate={{ rotateY: 0, opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}
      className={`${dims} relative rounded-lg bg-white shadow-xl flex flex-col items-center justify-center font-bold select-none`}
      style={{ color: SUIT_COLOR[suit] }}
    >
      <span className="absolute top-0.5 left-1 leading-none">{rank}</span>
      <span className="text-[1.4em] leading-none">{SUIT_GLYPH[suit]}</span>
      <span className="absolute bottom-0.5 right-1 leading-none rotate-180">{rank}</span>
    </motion.div>
  );
}

export function CardRow({ cards, size = 'md' }: { cards: (Card | undefined)[]; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex gap-1.5">
      {cards.map((c, i) => (
        <PlayingCard key={i} card={c} size={size} delay={i * 0.06} faceDown={!c} />
      ))}
    </div>
  );
}
