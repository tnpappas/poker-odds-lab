import { randomUUID } from 'node:crypto';
import {
  Storage, User, Session, Decision, Adversary, Leak, Usage, Plan, SessionMode,
  DecisionInput, DecisionSummary, AdversaryInput, summarize,
} from './types';

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

/** In-memory storage — used when DATABASE_URL is not configured. */
export class MemoryStorage implements Storage {
  private users = new Map<string, User>(); // keyed by id
  private byClerk = new Map<string, string>(); // clerkId -> id
  private sessions = new Map<string, Session>();
  private decisions: Decision[] = [];
  private adversaries = new Map<string, Adversary>();
  private leaks = new Map<string, Leak[]>(); // userId -> leaks
  private usage = new Map<string, Usage>(); // `${userId}:${date}` -> usage

  async getOrCreateUser(clerkId: string, email: string, username?: string): Promise<User> {
    const existingId = this.byClerk.get(clerkId);
    if (existingId) return this.users.get(existingId)!;
    const user: User = { id: randomUUID(), clerkId, email, username: username ?? null, plan: 'free', polarCustomerId: null, createdAt: now() };
    this.users.set(user.id, user);
    this.byClerk.set(clerkId, user.id);
    return user;
  }

  async upsertUserFromWebhook(clerkId: string, email: string, username?: string): Promise<User> {
    const id = this.byClerk.get(clerkId);
    if (id) {
      const u = this.users.get(id)!;
      u.email = email;
      if (username !== undefined) u.username = username;
      return u;
    }
    return this.getOrCreateUser(clerkId, email, username);
  }

  async setPlan(userId: string, plan: Plan): Promise<void> {
    const u = this.users.get(userId);
    if (u) u.plan = plan;
  }

  async setPolarCustomer(userId: string, polarCustomerId: string): Promise<void> {
    const u = this.users.get(userId);
    if (u) u.polarCustomerId = polarCustomerId;
  }

  async findUserByPolarCustomer(polarCustomerId: string): Promise<User | null> {
    for (const u of this.users.values()) {
      if (u.polarCustomerId === polarCustomerId) return u;
    }
    return null;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const u = this.users.get(userId);
    if (!u) return false;
    // Cascade: remove all data owned by this user.
    this.users.delete(userId);
    this.byClerk.delete(u.clerkId);
    for (const [id, s] of this.sessions) if (s.userId === userId) this.sessions.delete(id);
    this.decisions = this.decisions.filter((d) => d.userId !== userId);
    for (const [id, v] of this.adversaries) if (v.userId === userId) this.adversaries.delete(id);
    this.leaks.delete(userId);
    for (const key of this.usage.keys()) if (key.startsWith(`${userId}:`)) this.usage.delete(key);
    return true;
  }

  async createSession(userId: string, mode: SessionMode): Promise<Session> {
    const s: Session = {
      id: randomUUID(), userId, mode, handsPlayed: 0, totalEvWon: 0, totalEvLost: 0,
      decisionsCorrect: 0, decisionsTotal: 0, startedAt: now(), endedAt: null,
    };
    this.sessions.set(s.id, s);
    return s;
  }

  async updateSession(id: string, userId: string, patch: Partial<Session>): Promise<Session | null> {
    const s = this.sessions.get(id);
    if (!s || s.userId !== userId) return null;
    Object.assign(s, patch, { id: s.id, userId: s.userId });
    return s;
  }

  async listSessions(userId: string): Promise<Session[]> {
    return [...this.sessions.values()].filter((s) => s.userId === userId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async addDecision(userId: string, input: DecisionInput): Promise<Decision> {
    const d: Decision = {
      id: randomUUID(),
      sessionId: input.sessionId ?? null,
      userId,
      street: input.street,
      decisionType: input.decisionType,
      userAction: input.userAction,
      correctAction: input.correctAction,
      userEquityEstimate: input.userEquityEstimate ?? null,
      actualEquity: input.actualEquity ?? null,
      evResult: input.evResult ?? null,
      potSize: input.potSize ?? null,
      betSize: input.betSize ?? null,
      createdAt: now(),
    };
    this.decisions.unshift(d);
    return d;
  }

  async listDecisions(userId: string, limit: number): Promise<Decision[]> {
    return this.decisions.filter((d) => d.userId === userId).slice(0, limit);
  }

  async decisionSummary(userId: string): Promise<DecisionSummary> {
    return summarize(this.decisions.filter((d) => d.userId === userId));
  }

  async getLeaks(userId: string): Promise<Leak[]> {
    return this.leaks.get(userId) ?? [];
  }

  async saveLeaks(userId: string, leaks: Leak[]): Promise<void> {
    this.leaks.set(userId, leaks);
  }

  async listAdversaries(userId: string): Promise<Adversary[]> {
    return [...this.adversaries.values()].filter((v) => v.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createAdversary(userId: string, input: AdversaryInput): Promise<Adversary> {
    const v: Adversary = { id: randomUUID(), userId, ...input, notes: input.notes ?? null, createdAt: now() };
    this.adversaries.set(v.id, v);
    return v;
  }

  async updateAdversary(id: string, userId: string, patch: Partial<AdversaryInput>): Promise<Adversary | null> {
    const v = this.adversaries.get(id);
    if (!v || v.userId !== userId) return null;
    Object.assign(v, patch, { id: v.id, userId: v.userId });
    return v;
  }

  async deleteAdversary(id: string, userId: string): Promise<boolean> {
    const v = this.adversaries.get(id);
    if (!v || v.userId !== userId) return false;
    return this.adversaries.delete(id);
  }

  async usageToday(userId: string): Promise<Usage> {
    const key = `${userId}:${today()}`;
    return this.usage.get(key) ?? { date: today(), replaysUsed: 0, blitzUsed: 0 };
  }

  async incrementUsage(userId: string, mode: 'replay' | 'blitz'): Promise<Usage> {
    const key = `${userId}:${today()}`;
    const u = this.usage.get(key) ?? { date: today(), replaysUsed: 0, blitzUsed: 0 };
    if (mode === 'replay') u.replaysUsed++;
    else u.blitzUsed++;
    this.usage.set(key, u);
    return u;
  }
}
