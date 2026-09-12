/**
 * Database schema (Drizzle, Neon Postgres).
 *
 * Conventions:
 * - UUID primary keys everywhere (not guessable).
 * - created_at on every table; updated_at on rows that change after insert.
 * - user_id (not null, cascade delete) on every table holding customer data.
 * - Indexes on every user_id and on the columns used to order lists.
 * - Enumerated values are database enums, not free text.
 *
 * Schema changes ship as SQL files in apps/api/drizzle/ and are applied to Neon
 * before the code that depends on them deploys (see docs/RUNBOOK.md).
 */
import {
  pgTable, pgEnum, uuid, text, integer, doublePrecision, timestamp, date, unique, index,
} from 'drizzle-orm/pg-core';

/** 'lifetime' is kept for the handful of accounts from the one-time-purchase era. */
export const planEnum = pgEnum('plan', ['free', 'pro', 'lifetime']);

const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date());

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerk_id').notNull().unique(),
    email: text('email').notNull(),
    username: text('username'),
    plan: planEnum('plan').notNull().default('free'),
    /** Active PayPal subscription (I-...), set on activation, cleared on cancel. */
    paypalSubscriptionId: text('paypal_subscription_id'),
    /**
     * Paid-through date from PayPal (next billing time). After a cancel the
     * subscription id is cleared but Pro stays on until this passes.
     */
    proUntil: timestamp('pro_until', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
    paypalSubIdx: index('users_paypal_subscription_idx').on(t.paypalSubscriptionId),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
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
    updatedAt: updatedAt(),
  },
  (t) => ({ userStartedIdx: index('sessions_user_started_idx').on(t.userId, t.startedAt) }),
);

export const handDecisions = pgTable(
  'hand_decisions',
  {
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
    createdAt: createdAt(),
  },
  (t) => ({
    userCreatedIdx: index('hand_decisions_user_created_idx').on(t.userId, t.createdAt),
    sessionIdx: index('hand_decisions_session_idx').on(t.sessionId),
  }),
);

export const adversaryProfiles = pgTable(
  'adversary_profiles',
  {
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
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({ userIdx: index('adversary_profiles_user_idx').on(t.userId) }),
);

export const userLeaks = pgTable(
  'user_leaks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    leakType: text('leak_type').notNull(),
    severity: doublePrecision('severity').default(0).notNull(),
    sampleSize: integer('sample_size').default(0).notNull(),
    lastCalculated: timestamp('last_calculated', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ userIdx: index('user_leaks_user_idx').on(t.userId) }),
);

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

/**
 * Every webhook delivery we have acted on, keyed by the provider's event id.
 * Inserting the id before processing makes a redelivered event a no-op, so a
 * duplicate can never grant or revoke access twice.
 */
export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(), // `${provider}:${eventId}`
  provider: text('provider').notNull(), // 'paypal' | 'clerk'
  eventType: text('event_type').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
});
