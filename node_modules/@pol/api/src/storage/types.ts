export type Plan = 'free' | 'pro' | 'lifetime';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type DecisionType = 'pot_odds' | 'ev_call' | 'range_read' | 'blitz';
export type Action = 'call' | 'fold' | 'raise';
export type SessionMode = 'hand_replay' | 'blitz' | 'adversary_lab' | 'equity_viz';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  username: string | null;
  plan: Plan;
  stripeCustomerId: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  mode: SessionMode;
  handsPlayed: number;
  totalEvWon: number;
  totalEvLost: number;
  decisionsCorrect: number;
  decisionsTotal: number;
  startedAt: string;
  endedAt: string | null;
}

export interface Decision {
  id: string;
  sessionId: string | null;
  userId: string;
  street: Street;
  decisionType: DecisionType;
  userAction: Action;
  correctAction: Action;
  userEquityEstimate: number | null;
  actualEquity: number | null;
  evResult: number | null;
  potSize: number | null;
  betSize: number | null;
  createdAt: string;
}

export interface Adversary {
  id: string;
  userId: string;
  name: string;
  vpip: number;
  pfr: number;
  cbetFlop: number;
  cbetTurn: number;
  foldTo3bet: number;
  af: number;
  wtsd: number;
  notes: string | null;
  createdAt: string;
}

export interface Leak {
  leakType: string;
  severity: number;
  sampleSize: number;
}

export interface Usage {
  date: string;
  replaysUsed: number;
  blitzUsed: number;
}

export interface DecisionInput {
  sessionId?: string | null;
  street: Street;
  decisionType: DecisionType;
  userAction: Action;
  correctAction: Action;
  userEquityEstimate?: number | null;
  actualEquity?: number | null;
  evResult?: number | null;
  potSize?: number | null;
  betSize?: number | null;
}

export interface DecisionSummary {
  totalDecisions: number;
  correct: number;
  accuracy: number;
  totalEv: number;
  byStreet: Record<Street, { ev: number; count: number }>;
  avgReadError: number | null;
}

export interface AdversaryInput {
  name: string;
  vpip: number;
  pfr: number;
  cbetFlop: number;
  cbetTurn: number;
  foldTo3bet: number;
  af: number;
  wtsd: number;
  notes?: string | null;
}

export interface Storage {
  getOrCreateUser(clerkId: string, email: string, username?: string): Promise<User>;
  upsertUserFromWebhook(clerkId: string, email: string, username?: string): Promise<User>;
  setPlan(userId: string, plan: Plan): Promise<void>;
  setStripeCustomer(userId: string, stripeCustomerId: string): Promise<void>;
  findUserByStripeCustomer(stripeCustomerId: string): Promise<User | null>;
  deleteUser(userId: string): Promise<boolean>;

  createSession(userId: string, mode: SessionMode): Promise<Session>;
  updateSession(id: string, userId: string, patch: Partial<Session>): Promise<Session | null>;
  listSessions(userId: string): Promise<Session[]>;

  addDecision(userId: string, input: DecisionInput): Promise<Decision>;
  listDecisions(userId: string, limit: number): Promise<Decision[]>;
  decisionSummary(userId: string): Promise<DecisionSummary>;

  getLeaks(userId: string): Promise<Leak[]>;
  saveLeaks(userId: string, leaks: Leak[]): Promise<void>;

  listAdversaries(userId: string): Promise<Adversary[]>;
  createAdversary(userId: string, input: AdversaryInput): Promise<Adversary>;
  updateAdversary(id: string, userId: string, patch: Partial<AdversaryInput>): Promise<Adversary | null>;
  deleteAdversary(id: string, userId: string): Promise<boolean>;

  usageToday(userId: string): Promise<Usage>;
  incrementUsage(userId: string, mode: 'replay' | 'blitz'): Promise<Usage>;
}

export const STREETS: Street[] = ['preflop', 'flop', 'turn', 'river'];

/** Aggregate a list of decisions into a dashboard summary (shared by both stores). */
export function summarize(decisions: Decision[]): DecisionSummary {
  const byStreet = {
    preflop: { ev: 0, count: 0 },
    flop: { ev: 0, count: 0 },
    turn: { ev: 0, count: 0 },
    river: { ev: 0, count: 0 },
  } as DecisionSummary['byStreet'];
  let correct = 0;
  let totalEv = 0;
  const readErrors: number[] = [];

  for (const d of decisions) {
    if (d.userAction === d.correctAction) correct++;
    totalEv += d.evResult ?? 0;
    byStreet[d.street].ev += d.evResult ?? 0;
    byStreet[d.street].count++;
    if (d.decisionType === 'range_read' && d.userEquityEstimate != null && d.actualEquity != null) {
      readErrors.push(Math.abs(d.userEquityEstimate - d.actualEquity));
    }
  }

  return {
    totalDecisions: decisions.length,
    correct,
    accuracy: decisions.length ? correct / decisions.length : 0,
    totalEv: Math.round(totalEv * 100) / 100,
    byStreet,
    avgReadError: readErrors.length ? readErrors.reduce((a, b) => a + b, 0) / readErrors.length : null,
  };
}
