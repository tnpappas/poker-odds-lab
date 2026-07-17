/** Small domain primitives so the design language lives in one place. */
import type { ReactNode } from 'react';
import { LOGO_DATA_URI } from '../brand';

/** The wordmark: the real Poker Logic Lab spade-flask-brain mark + logotype. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src={LOGO_DATA_URI} alt="Poker Logic Lab" width={34} height={34} className="h-[34px] w-[34px] shrink-0" />
      {!compact && (
        <span className="font-sans text-[1.02rem] font-semibold tracking-tight leading-none text-ink-100">
          Poker Logic Lab
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
  tone?: 'default' | 'pos' | 'neg' | 'brand' | 'brass';
  size?: 'sm' | 'md' | 'lg';
}) {
  const color =
    tone === 'pos'
      ? 'text-chip-green'
      : tone === 'neg'
        ? 'text-chip-red'
        : tone === 'brand'
          ? 'text-brand-400'
          : tone === 'brass'
            ? 'text-brass-300'
            : 'text-ink-100';
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
