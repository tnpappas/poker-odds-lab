/**
 * Live Read Challenge scheduling and scoring. Pure functions of (answers, now)
 * so the rules are testable without a clock or a database.
 */
import { CHALLENGE, SPOTS, type ChallengeSpot, type ChallengeAction } from './spots';
import type { ChallengeAnswer } from '../storage/types';

export type DayStatus = 'upcoming' | 'open' | 'revealed';

export function dayWindow(day: number): { opensAt: number; closesAt: number } {
  const opensAt = Date.parse(CHALLENGE.startsAt) + (day - 1) * CHALLENGE.dayMs;
  return { opensAt, closesAt: opensAt + CHALLENGE.dayMs };
}

/** A day opens at 7pm ET and is revealed (answers close) 24 hours later. */
export function dayStatus(day: number, now: number): DayStatus {
  const { opensAt, closesAt } = dayWindow(day);
  if (now < opensAt) return 'upcoming';
  if (now < closesAt) return 'open';
  return 'revealed';
}

export const spotFor = (day: number): ChallengeSpot | undefined => SPOTS.find((s) => s.day === day);

const pointsFor = (day: number) => (day === CHALLENGE.days ? CHALLENGE.finalDayPoints : 1);

export interface LeaderboardRow {
  handle: string;
  email: string;
  points: number;
  correct: number;
  answered: number;
  /** Sum of |equity guess - true equity| over revealed days; a skipped revealed day counts as CHALLENGE.skippedDayError. */
  totalError: number;
  firstAnswerAt: string;
}

/** Score every entrant on the days revealed so far. Sorted: points, then lowest error, then earliest entry. */
export function leaderboard(answers: ChallengeAnswer[], now: number): LeaderboardRow[] {
  const revealed = SPOTS.filter((s) => dayStatus(s.day, now) === 'revealed');
  const byEmail = new Map<string, ChallengeAnswer[]>();
  for (const a of answers) {
    const list = byEmail.get(a.email) ?? [];
    list.push(a);
    byEmail.set(a.email, list);
  }

  const rows: LeaderboardRow[] = [];
  for (const [email, list] of byEmail) {
    const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    let points = 0;
    let correct = 0;
    let totalError = 0;
    for (const spot of revealed) {
      const a = list.find((x) => x.day === spot.day);
      if (!a) {
        totalError += CHALLENGE.skippedDayError;
        continue;
      }
      if (a.action === spot.correct) {
        points += pointsFor(spot.day);
        correct++;
      }
      totalError += Math.abs(a.equityGuess - spot.equityPct);
    }
    rows.push({
      handle: sorted[sorted.length - 1].handle,
      email,
      points,
      correct,
      answered: list.length,
      totalError: Math.round(totalError * 10) / 10,
      firstAnswerAt: sorted[0].createdAt,
    });
  }

  return rows.sort(
    (a, b) => b.points - a.points || a.totalError - b.totalError || a.firstAnswerAt.localeCompare(b.firstAnswerAt),
  );
}

/** What the public page sees: spots only once open, answers only once revealed, no emails. */
export function publicState(answers: ChallengeAnswer[], now: number) {
  const days = SPOTS.map((s) => {
    const status = dayStatus(s.day, now);
    const { opensAt, closesAt } = dayWindow(s.day);
    const base = { day: s.day, status, opensAt: new Date(opensAt).toISOString(), closesAt: new Date(closesAt).toISOString() };
    if (status === 'upcoming') return base;
    const spot = {
      title: s.title, hook: s.hook, profile: s.profile, action: s.action,
      hero: s.hero, board: s.board, pot: s.pot, bet: s.bet, points: pointsFor(s.day),
    };
    if (status === 'open') return { ...base, spot };
    const dayAnswers = answers.filter((a) => a.day === s.day);
    const calls = dayAnswers.filter((a) => a.action === 'call').length;
    return {
      ...base,
      spot,
      reveal: {
        correct: s.correct, equityPct: s.equityPct, requiredPct: s.requiredPct,
        rangeText: s.rangeText, range: s.range, lesson: s.lesson,
        entries: dayAnswers.length,
        callPct: dayAnswers.length ? Math.round((calls / dayAnswers.length) * 100) : null,
        correctPct: dayAnswers.length
          ? Math.round((dayAnswers.filter((a) => a.action === s.correct).length / dayAnswers.length) * 100)
          : null,
      },
    };
  });

  const board = leaderboard(answers, now)
    .slice(0, 25)
    .map(({ handle, points, correct, answered, totalError }) => ({ handle, points, correct, answered, totalError }));

  const lastClose = dayWindow(CHALLENGE.days).closesAt;
  return {
    id: CHALLENGE.id,
    name: CHALLENGE.name,
    startsAt: CHALLENGE.startsAt,
    endsAt: new Date(lastClose).toISOString(),
    finished: now >= lastClose,
    entrants: new Set(answers.map((a) => a.email)).size,
    days,
    leaderboard: board,
  };
}

export type { ChallengeAction };
