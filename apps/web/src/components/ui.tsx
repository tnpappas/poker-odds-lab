/** Small domain primitives so the design language lives in one place. */
import type { ReactNode } from 'react';
import { Spade } from './icons';

/** The wordmark: brass-ringed spade + Fraunces logotype. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid place-items-center h-8 w-8 rounded-full shrink-0"
        style={{
          background: 'radial-gradient(circle at 34% 28%, #14342550, #071913)',
          boxShadow: 'inset 0 0 0 1.5px rgba(211,172,87,0.55), 0 2px 8px rgba(0,0,0,0.5)',
        }}>
        <Spade size={16} className="text-brass-400" />
      </span>
      {!compact && (
        <span className="font-display text-[1.05rem] font-semibold tracking-tight leading-none">
          Poker <span className="foil">Logic</span> Lab
        </span>
      )}
    </span>
  );
}

/** A labeled tabular-mono number readout — the app's core data unit. */
export function StatReadout({
  label,
  value,
  tone = 'default',
  size = 'md',
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'pos' | 'neg' | 'brass';
  size?: 'sm' | 'md' | 'lg';
}) {
  const color =
    tone === 'pos' ? 'text-chip-green' : tone === 'neg' ? 'text-chip-red' : tone === 'brass' ? 'text-brass-300' : 'text-ink-100';
  const vSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span className={`num font-semibold ${vSize} ${color}`}>{value}</span>
    </div>
  );
}

/** Section eyebrow (uppercase mono kicker). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow mb-3">{children}</div>;
}
