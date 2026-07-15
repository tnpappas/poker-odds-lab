import { useState } from 'react';
import { RANKS, SUITS, type Card } from '@pol/poker-engine';
import { PlayingCard } from './PlayingCard';

const SUIT_GLYPH: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_COLOR: Record<string, string> = { s: '#eef2f0', c: '#2a9d8f', h: '#e63946', d: '#4b8bf5' };
const DISPLAY_RANKS = [...RANKS].reverse(); // A..2

/**
 * A row of card slots you can fill from a 52-card palette. Cards already used
 * anywhere in `used` are disabled so you can't pick the same card twice.
 */
export function CardSlots({
  cards,
  onChange,
  used,
  size = 'md',
  label,
}: {
  cards: (Card | null)[];
  onChange: (next: (Card | null)[]) => void;
  used: Set<Card>;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const setSlot = (card: Card | null) => {
    if (active == null) return;
    const next = cards.slice();
    next[active] = card;
    onChange(next);
    if (card) setActive(active + 1 < cards.length ? active + 1 : null);
  };

  return (
    <div>
      {label && <div className="text-xs text-ink-500 mb-1">{label}</div>}
      <div className="flex gap-1.5 flex-wrap">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => setActive(active === i ? null : i)}
            className={`rounded-lg transition ${active === i ? 'ring-2 ring-gold-400' : ''}`}
          >
            {c ? (
              <PlayingCard card={c} size={size} />
            ) : (
              <span
                className={`flex items-center justify-center rounded-lg border border-dashed border-felt-700 text-ink-500 ${
                  size === 'lg' ? 'w-16 h-24 text-2xl' : size === 'sm' ? 'w-9 h-13 text-sm' : 'w-12 h-18 text-lg'
                }`}
              >
                +
              </span>
            )}
          </button>
        ))}
        {cards.some((c) => c) && (
          <button onClick={() => onChange(cards.map(() => null))} className="text-xs text-ink-500 hover:text-ink-300 self-center ml-1">
            clear
          </button>
        )}
      </div>

      {active != null && (
        <div className="mt-3 rounded-xl bg-felt-950/70 border border-felt-700 p-2">
          {SUITS.map((s) => (
            <div key={s} className="flex items-center gap-1 mb-1 last:mb-0">
              <span className="w-4 text-center" style={{ color: SUIT_COLOR[s] }}>{SUIT_GLYPH[s]}</span>
              <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 flex-1">
                {DISPLAY_RANKS.map((r) => {
                  const card = `${r}${s}` as Card;
                  const isUsed = used.has(card) && cards[active] !== card;
                  return (
                    <button
                      key={card}
                      disabled={isUsed}
                      onClick={() => setSlot(card)}
                      className={`text-[11px] py-1 rounded font-semibold ${
                        isUsed ? 'opacity-25 cursor-not-allowed bg-felt-900' : 'bg-felt-800 hover:bg-felt-700'
                      }`}
                      style={{ color: isUsed ? '#6b7d75' : SUIT_COLOR[s] }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
