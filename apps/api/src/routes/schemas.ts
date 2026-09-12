/** Request body schemas shared by the feature routers. */
import { z } from 'zod';

export const decisionSchema = z.object({
  sessionId: z.string().uuid().nullable().optional(),
  street: z.enum(['preflop', 'flop', 'turn', 'river']),
  decisionType: z.enum(['pot_odds', 'ev_call', 'range_read', 'blitz']),
  userAction: z.enum(['call', 'fold', 'raise']),
  correctAction: z.enum(['call', 'fold', 'raise']),
  userEquityEstimate: z.number().min(0).max(1).nullable().optional(),
  actualEquity: z.number().min(0).max(1).nullable().optional(),
  evResult: z.number().nullable().optional(),
  potSize: z.number().nullable().optional(),
  betSize: z.number().nullable().optional(),
});

export const adversarySchema = z.object({
  name: z.string().min(1).max(80),
  vpip: z.number().min(0).max(1),
  pfr: z.number().min(0).max(1),
  cbetFlop: z.number().min(0).max(1),
  cbetTurn: z.number().min(0).max(1),
  foldTo3bet: z.number().min(0).max(1),
  af: z.number().min(0).max(10),
  wtsd: z.number().min(0).max(1),
  notes: z.string().max(1000).nullable().optional(),
});

export const sessionCreateSchema = z.object({
  mode: z.enum(['hand_replay', 'blitz', 'adversary_lab', 'equity_viz']),
});

export const sessionPatchSchema = z.object({
  handsPlayed: z.number().int().optional(),
  totalEvWon: z.number().optional(),
  totalEvLost: z.number().optional(),
  decisionsCorrect: z.number().int().optional(),
  decisionsTotal: z.number().int().optional(),
  ended: z.boolean().optional(),
});

export const usageSchema = z.object({ mode: z.enum(['replay', 'blitz']) });

export const blitzResultSchema = z.object({
  score: z.number(),
  accuracy: z.number().min(0).max(1),
  hands: z.number().int().min(0).max(1000),
});

export const grantSchema = z.object({
  email: z.string().email(),
  plan: z.enum(['free', 'pro']).default('pro'),
});

export const checkoutSchema = z.object({ plan: z.enum(['monthly', 'annual']) });
export const captureSchema = z.object({ subscriptionId: z.string().min(1).max(64) });
