/**
 * One icon ideology for the whole app: 24x24 grid, 1.6 stroke, round joins,
 * currentColor. Feature glyphs are drawn from poker/table vocabulary rather
 * than pulled from a generic library — this is part of the brand.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ---- Feature glyphs ------------------------------------------------------ */

// Equity Visualizer — the 13x13 range grid, abstracted to a 3x3 lattice.
export const GridIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" />
  </Svg>
);

// Hand Replay — two overlapping cards, mid-deal.
export const CardsIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8.5" y="4" width="10" height="14" rx="2" transform="rotate(9 13.5 11)" />
    <rect x="4.5" y="6" width="10" height="14" rx="2" transform="rotate(-8 9.5 13)" />
  </Svg>
);

// Blitz — the bolt.
export const BoltIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 3 5.5 13.5H11l-.5 7.5 8-10.5H13z" />
  </Svg>
);

// Equity Calculator — chips + equals.
export const CalcIcon = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="8" cy="7.5" rx="4.5" ry="2.3" />
    <path d="M3.5 7.5v4c0 1.27 2 2.3 4.5 2.3s4.5-1.03 4.5-2.3v-4" />
    <path d="M16 13h5M16 17h5" />
  </Svg>
);

// Tournament Lab — trophy.
export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
    <path d="M7 5H4.5v1.5A3 3 0 0 0 7 9.4M17 5h2.5v1.5A3 3 0 0 1 17 9.4" />
    <path d="M12 13v3M9 20h6M10 20l.5-4h3l.5 4" />
  </Svg>
);

// EV Dashboard — rising trend over baseline.
export const TrendIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M7.5 15.5l3.5-4 3 2.5 4.5-6" />
    <path d="M18.5 8v3.5M18.5 8H15" />
  </Svg>
);

// Adversary Lab — a read on an opponent (target/eye over a profile).
export const AdversaryIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="3.2" />
    <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    <path d="M12 2.5v1.6M12 13.9v1.6M18.5 9h-1.6M7.1 9H5.5" />
  </Svg>
);

/* ---- Suit glyphs (filled, for brand + accents) -------------------------- */

type SuitProps = SVGProps<SVGSVGElement> & { size?: number };

export function Spade({ size = 24, ...rest }: SuitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M12 2.2c2.4 3.2 8.2 6.1 8.2 11a4.6 4.6 0 0 1-7.1 3.9c.2 1.9.9 3.2 2.2 4.4H8.7c1.3-1.2 2-2.5 2.2-4.4a4.6 4.6 0 0 1-7.1-3.9C3.8 8.3 9.6 5.4 12 2.2Z" />
    </svg>
  );
}

export function Heart({ size = 24, ...rest }: SuitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M12 21C6.6 16.7 3.5 13.6 3.5 9.8 3.5 7 5.6 5 8.2 5c1.6 0 3 .8 3.8 2 .8-1.2 2.2-2 3.8-2 2.6 0 4.7 2 4.7 4.8 0 3.8-3.1 6.9-8.5 11.2Z" />
    </svg>
  );
}

export function Diamond({ size = 24, ...rest }: SuitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M12 2.5 20 12l-8 9.5L4 12 12 2.5Z" />
    </svg>
  );
}

export function Club({ size = 24, ...rest }: SuitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M12 2.6a3.7 3.7 0 0 1 2.5 6.4 3.8 3.8 0 1 1 .7 7.2A3.7 3.7 0 0 1 12 15c-.1 2.2.6 3.6 2 4.9H10c1.4-1.3 2.1-2.7 2-4.9a3.7 3.7 0 0 1-3.2 1.2 3.8 3.8 0 1 1 .7-7.2A3.7 3.7 0 0 1 12 2.6Z" />
    </svg>
  );
}
