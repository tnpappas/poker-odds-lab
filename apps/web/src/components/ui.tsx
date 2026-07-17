/** Small domain primitives so the design language lives in one place. */
import type { ReactNode } from 'react';
import { LOGO_WORDMARK_DATA_URI } from '../brand';

/** The real Poker Logic Lab horizontal lockup (dark-mode). */
export function BrandMark() {
  return <img src={LOGO_WORDMARK_DATA_URI} alt="Poker Logic Lab" className="h-7 sm:h-8 w-auto" />;
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
