import { Router, type Request } from 'express';
import { storage } from '../storage/index';
import { blitzResultSchema } from './schemas';

export const blitz = Router();
const uid = (req: Request) => req.user!.id;

blitz.get('/blitz/scenarios', (_req, res) =>
  res.json({
    generatedClientSide: true,
    note: 'Blitz scenarios are generated on the client for zero latency. POST results to /blitz/results.',
  }),
);

blitz.post('/blitz/results', async (req, res) => {
  const r = blitzResultSchema.parse(req.body);
  const session = await storage.createSession(uid(req), 'blitz');
  const updated = await storage.updateSession(session.id, uid(req), {
    handsPlayed: r.hands,
    decisionsCorrect: Math.round(r.accuracy * r.hands),
    decisionsTotal: r.hands,
    endedAt: new Date().toISOString(),
  });
  res.status(201).json(updated);
});
