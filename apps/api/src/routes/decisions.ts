import { Router, type Request } from 'express';
import { storage } from '../storage/index';
import { detectLeaks } from '../services/leakDetector';
import { decisionSchema } from './schemas';

export const decisions = Router();
const uid = (req: Request) => req.user!.id;

const MAX_LIST = 1000;
const DEFAULT_LIST = 200;

decisions.post('/decisions', async (req, res) => {
  const input = decisionSchema.parse(req.body);
  res.status(201).json(await storage.addDecision(uid(req), input));
});

decisions.get('/decisions', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || DEFAULT_LIST, MAX_LIST);
  res.json(await storage.listDecisions(uid(req), limit));
});

decisions.get('/decisions/summary', async (req, res) => res.json(await storage.decisionSummary(uid(req))));

decisions.get('/leaks', async (req, res) => res.json(await storage.getLeaks(uid(req))));

decisions.post('/leaks/recalculate', async (req, res) => {
  const recent = await storage.listDecisions(uid(req), DEFAULT_LIST);
  const leaks = detectLeaks(recent);
  await storage.saveLeaks(uid(req), leaks);
  res.json(leaks);
});
