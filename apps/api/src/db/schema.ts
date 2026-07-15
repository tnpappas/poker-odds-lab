import { pgTable, uuid, text, integer, doublePrecision, timestamp, date, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  username: text('username'),
  plan: text('plan').notNull().default('free'), // 'free' | 'pro' | 'lifetime'
  stripeCustomerId: text('stripe_customer_id'), // set on first successful checkout
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(), // 'hand_replay' | 'blitz' | 'adversary_lab' | 'equity_viz'
  handsPlayed: integer('hands_played').default(0).notNull(),
  totalEvWon: doublePrecision('total_ev_won').default(0).notNull(),
  totalEvLost: doublePrecision('total_ev_lost').default(0).notNull(),
  decisionsCorrect: integer('decisions_correct').default(0).notNull(),
  decisionsTotal: integer('decisions_total').default(0).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

export const handDecisions = pgTable('hand_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  street: text('street').notNull(),
  decisionType: text('decision_type').notNull(),
  userAction: text('user_action').notNull(),
  correctAction: text('correct_action').notNull(),
  userEquityEstimate: doublePrecision('user_equity_estimate'),
  actualEquity: doublePrecision('actual_equity'),
  evResult: doublePrecision('ev_result'),
  potSize: doublePrecision('pot_size'),
  betSize: doublePrecision('bet_size'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adversaryProfiles = pgTable('adversary_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  vpip: doublePrecision('vpip').default(0.25).notNull(),
  pfr: doublePrecision('pfr').default(0.18).notNull(),
  cbetFlop: doublePrecision('cbet_flop').default(0.6).notNull(),
  cbetTurn: doublePrecision('cbet_turn').default(0.45).notNull(),
  foldTo3bet: doublePrecision('fold_to_3bet').default(0.55).notNull(),
  af: doublePrecision('af').default(2.5).notNull(),
  wtsd: doublePrecision('wtsd').default(0.28).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userLeaks = pgTable('user_leaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  leakType: text('leak_type').notNull(),
  severity: doublePrecision('severity').default(0).notNull(),
  sampleSize: integer('sample_size').default(0).notNull(),
  lastCalculated: timestamp('last_calculated', { withTimezone: true }).defaultNow().notNull(),
});

export const dailyUsage = pgTable(
  'daily_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').defaultNow().notNull(),
    replaysUsed: integer('replays_used').default(0).notNull(),
    blitzUsed: integer('blitz_used').default(0).notNull(),
  },
  (t) => ({ userDate: unique().on(t.userId, t.date) }),
);
