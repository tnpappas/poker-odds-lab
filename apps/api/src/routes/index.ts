import { Router, type Request } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { requireUser } from '../middleware/auth';
import { detectLeaks } from '../services/leakDetector';
import { polar, productIdFor } from '../lib/polar';

export const api = Router();

// ---- Validation schemas -------------------------------------------------
const decisionSchema = z.object({
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

const adversarySchema = z.object({
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

const sessionCreateSchema = z.object({ mode: z.enum(['hand_replay', 'blitz', 'adversary_lab', 'equity_viz']) });
const sessionPatchSchema = z.object({
  handsPlayed: z.number().int().optional(),
  totalEvWon: z.number().optional(),
  totalEvLost: z.number().optional(),
  decisionsCorrect: z.number().int().optional(),
  decisionsTotal: z.number().int().optional(),
  ended: z.boolean().optional(),
});
const usageSchema = z.object({ mode: z.enum(['replay', 'blitz']) });

// All routes below require an authenticated user.
api.use(requireUser);
const uid = (req: Request) => req.user!.id;

// ---- Current user / entitlement ----------------------------------------
// Drives the client-side purchase gate. `entitled` is true once the user has
// bought (plan is set to 'pro' or 'lifetime' by the Polar webhook).
api.get('/me', (req, res) => {
  const u = req.user!;
  res.json({ id: u.id, email: u.email, plan: u.plan, entitled: u.plan !== 'free' });
});

// ---- Sessions -----------------------------------------------------------
api.get('/sessions', async (req, res) => res.json(await storage.listSessions(uid(req))));

api.post('/sessions', async (req, res) => {
  const { mode } = sessionCreateSchema.parse(req.body);
  res.status(201).json(await storage.createSession(uid(req), mode));
});

api.patch('/sessions/:id', async (req, res) => {
  const body = sessionPatchSchema.parse(req.body);
  const patch = { ...body, endedAt: body.ended ? new Date().toISOString() : undefined };
  delete (patch as Record<string, unknown>).ended;
  const updated = await storage.updateSession(req.params.id, uid(req), patch);
  if (!updated) return res.status(404).json({ error: 'Session not found' });
  res.json(updated);
});

// ---- Decisions ----------------------------------------------------------
api.post('/decisions', async (req, res) => {
  const input = decisionSchema.parse(req.body);
  res.status(201).json(await storage.addDecision(uid(req), input));
});

api.get('/decisions', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  res.json(await storage.listDecisions(uid(req), limit));
});

api.get('/decisions/summary', async (req, res) => res.json(await storage.decisionSummary(uid(req))));

// ---- Leaks --------------------------------------------------------------
api.get('/leaks', async (req, res) => res.json(await storage.getLeaks(uid(req))));

api.post('/leaks/recalculate', async (req, res) => {
  const decisions = await storage.listDecisions(uid(req), 200);
  const leaks = detectLeaks(decisions);
  await storage.saveLeaks(uid(req), leaks);
  res.json(leaks);
});

// ---- Adversaries -----------------------------------------------------------
api.get('/adversaries', async (req, res) => res.json(await storage.listAdversaries(uid(req))));

api.post('/adversaries', async (req, res) => {
  const input = adversarySchema.parse(req.body);
  res.status(201).json(await storage.createAdversary(uid(req), input));
});

api.patch('/adversaries/:id', async (req, res) => {
  const patch = adversarySchema.partial().parse(req.body);
  const updated = await storage.updateAdversary(req.params.id, uid(req), patch);
  if (!updated) return res.status(404).json({ error: 'Adversary not found' });
  res.json(updated);
});

api.delete('/adversaries/:id', async (req, res) => {
  const ok = await storage.deleteAdversary(req.params.id, uid(req));
  if (!ok) return res.status(404).json({ error: 'Adversary not found' });
  res.status(204).end();
});

// ---- Blitz --------------------------------------------------------------
api.get('/blitz/scenarios', (_req, res) =>
  res.json({ generatedClientSide: true, note: 'Blitz scenarios are generated on the client for zero latency. POST results to /blitz/results.' }),
);

api.post('/blitz/results', async (req, res) => {
  const schema = z.object({ score: z.number(), accuracy: z.number(), hands: z.number().int() });
  const r = schema.parse(req.body);
  const session = await storage.createSession(uid(req), 'blitz');
  const updated = await storage.updateSession(session.id, uid(req), {
    handsPlayed: r.hands,
    decisionsCorrect: Math.round(r.accuracy * r.hands),
    decisionsTotal: r.hands,
    endedAt: new Date().toISOString(),
  });
  res.status(201).json(updated);
});

// ---- Usage --------------------------------------------------------------
api.get('/usage/today', async (req, res) => res.json(await storage.usageToday(uid(req))));

api.post('/usage/increment', async (req, res) => {
  const { mode } = usageSchema.parse(req.body);
  res.json(await storage.incrementUsage(uid(req), mode));
});

// ---- Account (GDPR/CCPA deletion) --------------------------------------
// Deletes the authenticated user and cascades to all of their data.
api.delete('/account', async (req, res) => {
  const ok = await storage.deleteUser(uid(req));
  if (!ok) return res.status(404).json({ error: 'User not found' });
  res.status(204).end();
});

// ---- Payments (Polar.sh) ------------------------------------------------
// FRONTEND_URL may be a comma-separated allowlist (for CORS); the first entry
// is the primary origin used for checkout success/return redirects.
const FRONTEND_URL = (process.env.FRONTEND_URL ?? 'http://localhost:5173').split(',')[0].trim();
const checkoutSchema = z.object({ plan: z.enum(['lifetime', 'monthly', 'annual']) });

// Create a Polar hosted checkout and return its URL for the browser to open.
api.post('/billing/checkout', async (req, res) => {
  if (!polar) {
    return res.status(501).json({ error: 'Polar is not configured. Set POLAR_ACCESS_TOKEN.' });
  }
  const { plan } = checkoutSchema.parse(req.body);
  const productId = productIdFor(plan);
  if (!productId) {
    return res.status(500).json({ error: `Missing product id for plan "${plan}". Set the POLAR_*_PRODUCT_ID env var.` });
  }

  const user = req.user!;
  const checkout = await polar.checkouts.create({
    products: [productId],
    successUrl: `${FRONTEND_URL}/?checkout=success`,
    customerEmail: user.email,
    // Ties the Polar customer to our internal user id; echoed back on webhooks.
    externalCustomerId: user.id,
    metadata: { userId: user.id, plan },
  });

  res.json({ url: checkout.url });
});

// Open the Polar customer portal so the user can manage/cancel their subscription.
api.get('/billing/portal', async (req, res) => {
  if (!polar) {
    return res.status(501).json({ error: 'Polar is not configured. Set POLAR_ACCESS_TOKEN.' });
  }
  const customerId = req.user!.polarCustomerId;
  if (!customerId) {
    return res.status(400).json({ error: 'No billing account yet. Complete a purchase first.' });
  }
  const session = await polar.customerSessions.create({ customerId });
  res.json({ url: session.customerPortalUrl });
});
