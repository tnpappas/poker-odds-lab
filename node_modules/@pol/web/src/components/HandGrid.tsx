import { useEffect, useRef } from 'react';
import { GRID_RANKS, cellLabel } from '@pol/poker-engine';

/** Color a 0..1 equity value from red (low) to green (high). */
export function equityColor(equity: number): string {
  // 40% -> red (hue 0), 85% -> green (hue ~130)
  const clamped = Math.max(0.3, Math.min(0.9, equity));
  const hue = ((clamped - 0.3) / 0.6) * 130;
  return `hsl(${hue}, 65%, ${38 + clamped * 8}%)`;
}

interface HandGridProps {
  /** equity table keyed by label (e.g. 'AKs') — drives cell color. */
  equityTable?: Record<string, number>;
  /** selection/weight matrix [13][13] 0..1 — drives a highlight overlay. */
  weights?: number[][];
  selected?: string | null;
  onSelect?: (label: string) => void;
  /** Enable drag-to-paint. Calls onPaint(row, col, value) for each cell touched. */
  editable?: boolean;
  onPaint?: (row: number, col: number, value: number) => void;
  compact?: boolean;
  /** highlight a specific label (e.g. the adversary's actual hand on reveal). */
  highlight?: string | null;
}

export function HandGrid({ equityTable, weights, selected, onSelect, editable, onPaint, compact, highlight }: HandGridProps) {
  const cell = compact ? 'text-[8px]' : 'text-[10px] sm:text-xs';
  const painting = useRef(false);
  const paintVal = useRef(1);

  useEffect(() => {
    if (!editable) return;
    const stop = () => { painting.current = false; };
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [editable]);

  return (
    <div className={`grid grid-cols-[repeat(13,minmax(0,1fr))] gap-[2px] aspect-square w-full ${editable ? 'touch-none select-none' : ''}`}>
      {GRID_RANKS.map((_, r) =>
        GRID_RANKS.map((__, c) => {
          const label = cellLabel(r, c);
          const eq = equityTable?.[label];
          const w = weights?.[r]?.[c] ?? null;
          const isSelected = selected === label;
          const isHighlight = highlight === label;
          const bg = eq != null ? equityColor(eq) : w != null && w > 0 ? 'var(--color-felt-700)' : 'var(--color-felt-900)';
          const inRange = w != null && w > 0;
          return (
            <button
              key={`${r}-${c}`}
              onPointerDown={(e) => {
                if (editable) {
                  e.preventDefault();
                  painting.current = true;
                  paintVal.current = (weights?.[r]?.[c] ?? 0) > 0 ? 0 : 1;
                  onPaint?.(r, c, paintVal.current);
                }
              }}
              onPointerEnter={() => {
                if (editable && painting.current) onPaint?.(r, c, paintVal.current);
              }}
              onClick={() => { if (!editable) onSelect?.(label); }}
              title={eq != null ? `${label}: ${(eq * 100).toFixed(1)}%` : label}
              className={`${cell} flex items-center justify-center rounded-[3px] font-semibold leading-none transition-all
                ${isSelected ? 'ring-2 ring-gold-400 z-10 scale-110' : ''}
                ${isHighlight ? 'ring-2 ring-chip-red z-10 animate-pulse' : ''}
                ${onSelect || editable ? 'cursor-pointer hover:ring-1 hover:ring-ink-300' : ''}`}
              style={{
                background: bg,
                opacity: w != null && !inRange ? 0.32 : 1,
                color: eq != null ? 'rgba(0,0,0,0.78)' : inRange ? 'var(--color-gold-400)' : 'var(--color-ink-500)',
                aspectRatio: '1',
              }}
            >
              {label.replace('s', '').replace('o', '')}
              {label.length === 3 && <span className="opacity-50 ml-px">{label[2]}</span>}
            </button>
          );
        }),
      )}
    </div>
  );
}
