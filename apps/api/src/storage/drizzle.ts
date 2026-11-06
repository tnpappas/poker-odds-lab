import { eq, and, desc, sql, isNull, ne } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import {
  Storage, User, Session, Decision, Adversary, Leak, Usage, Plan, SessionMode,
  DecisionInput, DecisionSummary, AdversaryInput, summarize, Street, DecisionType, Action,
  ChallengeAnswer, ChallengeAnswerInput, ChallengePrize, ChallengePrizeInput, ChallengePrizeKind,
} from './types';

type DB = NeonHttpDatabase<typeof schema>;
type UserRow = typeof schema.users.$inferSelect;
type SessionRow = typeof schema.sessions.$inferSelect;
type DecisionRow = typeof schema.handDecisions.$inferSelect;
type AdversaryRow = typeof schema.adversaryProfiles.$inferSelect;

const today = () => new Date().toISOString().slice(0, 10);

function mapUser(r: UserRow): User {
  return { id: r.id, clerkId: r.clerkId, email: r.email, username: r.username, plan: r.plan as Plan, paypalSubscriptionId: r.paypalSubscriptionId, proUntil: r.proUntil ? r.proUntil.toISOString() : null, createdAt: r.createdAt.toISOString() };
}
function mapSession(r: SessionRow): Session {
  return {
    id: r.id, userId: r.userId, mode: r.mode as SessionMode, handsPlayed: r.handsPlayed,
    totalEvWon: r.totalEvWon, totalEvLost: r.totalEvLost, decisionsCorrect: r.decisionsCorrect,
    decisionsTotal: r.decisionsTotal, startedAt: r.startedAt.toISOString(), endedAt: r.endedAt ? r.endedAt.toISOString() : null,
  };
}
function mapDecision(r: DecisionRow): Decision {
  return {
    id: r.id, sessionId: r.sessionId, userId: r.userId, street: r.street as Street,
    decisionType: r.decisionType as DecisionType, userAction: r.userAction as Action, correctAction: r.correctAction as Action,
    userEquityEstimate: r.userEquityEstimate, actualEquity: r.actualEquity, evResult: r.evResult,
    potSize: r.potSize, betSize: r.betSize, createdAt: r.createdAt.toISOString(),
  };
}
function mapAdversary(r: AdversaryRow): Adversary {
  return {
    id: r.id, userId: r.userId, name: r.name, vpip: r.vpip, pfr: r.pfr, cbetFlop: r.cbetFlop,
    cbetTurn: r.cbetTurn, foldTo3bet: r.foldTo3bet, af: r.af, wtsd: r.wtsd, notes: r.notes, createdAt: r.createdAt.toISOString(),
  };
}

/** Postgres-backed storage via Drizzle + Neon. */
type PrizeRow = typeof schema.challengePrizes.$inferSelect;

function mapPrize(r: PrizeRow): ChallengePrize {
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  return {
    challengeId: r.challengeId, email: r.email, kind: r.kind as ChallengePrizeKind, rank: r.rank, handle: r.handle,
    notifiedAt: iso(r.notifiedAt), grantedAt: iso(r.grantedAt), grantedUserId: r.grantedUserId,
    accessUntil: iso(r.accessUntil), createdAt: r.createdAt.toISOString(),
  };
}

export class DrizzleStorage implements Storage {
  constructor(private db: DB) {}

  private prizeTableReady: Promise<void> | null = null;

  /**
   * Create challenge_prizes if it is not there yet (same SQL as migration
   * 0004, idempotent), so the prize feature works without a manual step in the
   * Neon console. Runs once per process; a failure is retried on the next call.
   */
  private ensurePrizeTable(): Promise<void> {
    this.prizeTableReady ??= this.db
      .execute(sql`CREATE TABLE IF NOT EXISTS challenge_prizes (
        challenge_id text NOT NULL,
        email text NOT NULL,
        kind text NOT NULL,
        rank integer NOT NULL,
        handle text NOT NULL,
        notified_at timestamptz,
        granted_at timestamptz,
        granted_user_id uuid,
        access_until timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT challenge_prizes_pk PRIMARY KEY (challenge_id, email)
      )`)
      .then(() => undefined)
      .catch((err: unknown) => {
        this.prizeTableReady = null;
        throw err;
      });
    return this.prizeTableReady;
  }

  async getOrCreateUser(clerkId: string, email: string, username?: string): Promise<User> {
    const found = await this.db.select().from(schema.users).where(eq(schema.users.clerkId, clerkId)).limit(1);
    if (found[0]) return mapUser(found[0]);
    const inserted = await this.db.insert(schema.users).values({ clerkId, email, username: username ?? null }).returning();
    return mapUser(inserted[0]);
  }

  async upsertUserFromWebhook(clerkId: string, email: string, username?: string): Promise<User> {
    const inserted = await this.db
      .insert(schema.users)
      .values({ clerkId, email, username: username ?? null })
      .onConflictDoUpdate({ target: schema.users.clerkId, set: { email, username: username ?? null } })
      .returning();
    return mapUser(inserted[0]);
  }

  async setPlan(userId: string, plan: Plan): Promise<void> {
    await this.db.update(schema.users).set({ plan }).where(eq(schema.users.id, userId));
  }

  async setProUntil(userId: string, proUntil: string | null): Promise<void> {
    await this.db.update(schema.users).set({ proUntil: proUntil ? new Date(proUntil) : null }).where(eq(schema.users.id, userId));
  }

  async setPaypalSubscription(userId: string, subscriptionId: string | null): Promise<void> {
    await this.db.update(schema.users).set({ paypalSubscriptionId: subscriptionId }).where(eq(schema.users.id, userId));
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const r = await this.db
      .select()
      .from(schema.users)
      .where(sql`lower(${schema.users.email}) = ${email.trim().toLowerCase()}`)
      .limit(1);
    return r[0] ? mapUser(r[0]) : null;
  }

  async getUserById(userId: string): Promise<User | null> {
    const r = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    return r[0] ? mapUser(r[0]) : null;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Child rows (sessions, hand_decisions, adversary_profiles, user_leaks,
    // daily_usage) are removed automatically via ON DELETE CASCADE.
    const r = await this.db.delete(schema.users).where(eq(schema.users.id, userId)).returning();
    return r.length > 0;
  }

  async createSession(userId: string, mode: SessionMode): Promise<Session> {
    const r = await this.db.insert(schema.sessions).values({ userId, mode }).returning();
    return mapSession(r[0]);
  }

  async updateSession(id: string, userId: string, patch: Partial<Session>): Promise<Session | null> {
    const set: Partial<typeof schema.sessions.$inferInsert> = {};
    if (patch.handsPlayed !== undefined) set.handsPlayed = patch.handsPlayed;
    if (patch.totalEvWon !== undefined) set.totalEvWon = patch.totalEvWon;
    if (patch.totalEvLost !== undefined) set.totalEvLost = patch.totalEvLost;
    if (patch.decisionsCorrect !== undefined) set.decisionsCorrect = patch.decisionsCorrect;
    if (patch.decisionsTotal !== undefined) set.decisionsTotal = patch.decisionsTotal;
    if (patch.endedAt !== undefined) set.endedAt = patch.endedAt ? new Date(patch.endedAt) : null;
    const r = await this.db
      .update(schema.sessions)
      .set(set)
      .where(and(eq(schema.sessions.id, id), eq(schema.sessions.userId, userId)))
      .returning();
    return r[0] ? mapSession(r[0]) : null;
  }

  async listSessions(userId: string): Promise<Session[]> {
    const r = await this.db.select().from(schema.sessions).where(eq(schema.sessions.userId, userId)).orderBy(desc(schema.sessions.startedAt));
    return r.map(mapSession);
  }

  async addDecision(userId: string, input: DecisionInput): Promise<Decision> {
    const r = await this.db
      .insert(schema.handDecisions)
      .values({
        userId,
        sessionId: input.sessionId ?? null,
        street: input.street,
        decisionType: input.decisionType,
        userAction: input.userAction,
        correctAction: input.correctAction,
        userEquityEstimate: input.userEquityEstimate ?? null,
        actualEquity: input.actualEquity ?? null,
        evResult: input.evResult ?? null,
        potSize: input.potSize ?? null,
        betSize: input.betSize ?? null,
      })
      .returning();
    return mapDecision(r[0]);
  }

  async listDecisions(userId: string, limit: number): Promise<Decision[]> {
    const r = await this.db
      .select().from(schema.handDecisions)
      .where(eq(schema.handDecisions.userId, userId))
      .orderBy(desc(schema.handDecisions.createdAt))
      .limit(limit);
    return r.map(mapDecision);
  }

  async decisionSummary(userId: string): Promise<DecisionSummary> {
    const r = await this.listDecisions(userId, 200);
    return summarize(r);
  }

  async getLeaks(userId: string): Promise<Leak[]> {
    const r = await this.db.select().from(schema.userLeaks).where(eq(schema.userLeaks.userId, userId));
    return r.map((x) => ({ leakType: x.leakType, severity: x.severity, sampleSize: x.sampleSize }));
  }

  async saveLeaks(userId: string, leaks: Leak[]): Promise<void> {
    await this.db.delete(schema.userLeaks).where(eq(schema.userLeaks.userId, userId));
    if (leaks.length) {
      await this.db.insert(schema.userLeaks).values(leaks.map((l) => ({ userId, leakType: l.leakType, severity: l.severity, sampleSize: l.sampleSize })));
    }
  }

  async listAdversaries(userId: string): Promise<Adversary[]> {
    const r = await this.db.select().from(schema.adversaryProfiles).where(eq(schema.adversaryProfiles.userId, userId)).orderBy(desc(schema.adversaryProfiles.createdAt));
    return r.map(mapAdversary);
  }

  async createAdversary(userId: string, input: AdversaryInput): Promise<Adversary> {
    const r = await this.db.insert(schema.adversaryProfiles).values({ userId, ...input, notes: input.notes ?? null }).returning();
    return mapAdversary(r[0]);
  }

  async updateAdversary(id: string, userId: string, patch: Partial<AdversaryInput>): Promise<Adversary | null> {
    const r = await this.db
      .update(schema.adversaryProfiles)
      .set(patch)
      .where(and(eq(schema.adversaryProfiles.id, id), eq(schema.adversaryProfiles.userId, userId)))
      .returning();
    return r[0] ? mapAdversary(r[0]) : null;
  }

  async deleteAdversary(id: string, userId: string): Promise<boolean> {
    const r = await this.db
      .delete(schema.adversaryProfiles)
      .where(and(eq(schema.adversaryProfiles.id, id), eq(schema.adversaryProfiles.userId, userId)))
      .returning();
    return r.length > 0;
  }

  async usageToday(userId: string): Promise<Usage> {
    const r = await this.db
      .select().from(schema.dailyUsage)
      .where(and(eq(schema.dailyUsage.userId, userId), eq(schema.dailyUsage.date, today())))
      .limit(1);
    return r[0] ? { date: r[0].date, replaysUsed: r[0].replaysUsed, blitzUsed: r[0].blitzUsed } : { date: today(), replaysUsed: 0, blitzUsed: 0 };
  }

  async incrementUsage(userId: string, mode: 'replay' | 'blitz'): Promise<Usage> {
    const current = await this.usageToday(userId);
    const next = {
      replaysUsed: current.replaysUsed + (mode === 'replay' ? 1 : 0),
      blitzUsed: current.blitzUsed + (mode === 'blitz' ? 1 : 0),
    };
    const r = await this.db
      .insert(schema.dailyUsage)
      .values({ userId, date: today(), replaysUsed: next.replaysUsed, blitzUsed: next.blitzUsed })
      .onConflictDoUpdate({ target: [schema.dailyUsage.userId, schema.dailyUsage.date], set: next })
      .returning();
    return { date: r[0].date, replaysUsed: r[0].replaysUsed, blitzUsed: r[0].blitzUsed };
  }

  async recordWebhookEvent(provider: 'paypal' | 'clerk', eventId: string, eventType: string): Promise<boolean> {
    const r = await this.db
      .insert(schema.webhookEvents)
      .values({ id: `${provider}:${eventId}`, provider, eventType })
      .onConflictDoNothing()
      .returning({ id: schema.webhookEvents.id });
    return r.length > 0;
  }

  async addChallengeAnswer(input: ChallengeAnswerInput): Promise<boolean> {
    const r = await this.db
      .insert(schema.challengeAnswers)
      .values(input)
      .onConflictDoNothing()
      .returning({ id: schema.challengeAnswers.id });
    return r.length > 0;
  }

  async listChallengeAnswers(challengeId: string): Promise<ChallengeAnswer[]> {
    const rows = await this.db
      .select()
      .from(schema.challengeAnswers)
      .where(eq(schema.challengeAnswers.challengeId, challengeId));
    return rows.map((r) => ({
      id: r.id, challengeId: r.challengeId, day: r.day, email: r.email, handle: r.handle,
      action: r.action as 'call' | 'fold', equityGuess: r.equityGuess, ipHash: r.ipHash, createdAt: r.createdAt.toISOString(),
    }));
  }

  async addChallengePrizes(rows: ChallengePrizeInput[]): Promise<void> {
    if (!rows.length) return;
    await this.ensurePrizeTable();
    await this.db.insert(schema.challengePrizes).values(rows).onConflictDoNothing();
  }

  async listChallengePrizes(challengeId: string): Promise<ChallengePrize[]> {
    await this.ensurePrizeTable();
    const rows = await this.db.select().from(schema.challengePrizes).where(eq(schema.challengePrizes.challengeId, challengeId));
    return rows.map(mapPrize);
  }

  async markChallengePrizeNotified(challengeId: string, email: string): Promise<void> {
    await this.ensurePrizeTable();
    await this.db
      .update(schema.challengePrizes)
      .set({ notifiedAt: new Date() })
      .where(and(eq(schema.challengePrizes.challengeId, challengeId), eq(schema.challengePrizes.email, email), isNull(schema.challengePrizes.notifiedAt)));
  }

  async claimChallengePrize(challengeId: string, email: string, userId: string): Promise<ChallengePrize | null> {
    await this.ensurePrizeTable();
    const r = await this.db
      .update(schema.challengePrizes)
      .set({ grantedAt: new Date(), grantedUserId: userId })
      .where(and(
        eq(schema.challengePrizes.challengeId, challengeId),
        eq(schema.challengePrizes.email, email),
        isNull(schema.challengePrizes.grantedAt),
        ne(schema.challengePrizes.kind, 'chapters'),
      ))
      .returning();
    return r[0] ? mapPrize(r[0]) : null;
  }

  async finishChallengePrizeClaim(challengeId: string, email: string, accessUntil: string | null): Promise<void> {
    await this.ensurePrizeTable();
    const where = and(eq(schema.challengePrizes.challengeId, challengeId), eq(schema.challengePrizes.email, email));
    await this.db
      .update(schema.challengePrizes)
      .set(accessUntil ? { accessUntil: new Date(accessUntil) } : { grantedAt: null, grantedUserId: null })
      .where(where);
  }
}
