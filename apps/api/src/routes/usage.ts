import { Router, type Request } from 'express';
import { storage } from '../storage/index';
import { usageSchema } from './schemas';

export const usage = Router();
const uid = (req: Request) => req.user!.id;

usage.get('/usage/today', async (req, res) => res.json(await storage.usageToday(uid(req))));

usage.post('/usage/increment', async (req, res) => {
  const { mode } = usageSchema.parse(req.body);
  res.json(await storage.incrementUsage(uid(req), mode));
});
