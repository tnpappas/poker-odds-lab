import type { Decision, Leak } from '../storage/types';

/**
 * Detect behavioral leaks from a player's recent decisions.
 * Mirrors the thresholds in docs/CLAUDE.md's leak detector spec.
 */
export function detectLeaks(decisions: Decision[]): Leak[] {
  const sample = decisions.filter((d) => d.decisionType !== 'blitz').slice(0, 200);
  if (sample.length < 6) return [];

  const calls = sample.filter((d) => d.userAction === 'call');
  const folds = sample.filter((d) => d.userAction === 'fold');
  const raises = sample.filter((d) => d.userAction === 'raise');
  const leaks: Leak[] = [];

  const callTooWide = calls.length ? calls.filter((d) => d.correctAction === 'fold').length / calls.length : 0;
  if (callTooWide > 0.25) {
    leaks.push({ leakType: 'calling_too_wide', severity: Math.min(1, callTooWide / 0.4), sampleSize: calls.length });
  }

  const foldTooMuch = folds.length ? folds.filter((d) => d.correctAction !== 'fold').length / folds.length : 0;
  if (foldTooMuch > 0.2) {
    leaks.push({ leakType: 'folding_to_aggression', severity: Math.min(1, foldTooMuch / 0.35), sampleSize: folds.length });
  }

  const missedValue = sample.filter((d) => d.userAction === 'fold' && (d.actualEquity ?? 0) > 0.65).length / sample.length;
  if (missedValue > 0.12) {
    leaks.push({ leakType: 'missing_value', severity: Math.min(1, missedValue / 0.25), sampleSize: sample.length });
  }

  const bluffTooMuch = raises.length ? raises.filter((d) => (d.actualEquity ?? 1) < 0.25).length / raises.length : 0;
  if (bluffTooMuch > 0.3) {
    leaks.push({ leakType: 'bluffing_too_much', severity: Math.min(1, bluffTooMuch / 0.5), sampleSize: raises.length });
  }

  return leaks.sort((a, b) => b.severity - a.severity);
}
