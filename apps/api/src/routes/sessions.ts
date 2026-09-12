import { Router, type Request } from 'express';
import { storage } from '../storage/index';
import { sessionCreateSchema, sessionPatchSchema } from './schemas';

export const sessions = Router();
const uid = (req: Request) => req.user!.id;

sessions.get('/sessions', async (req, res) => res.json(await storage.listSessions(uid(req))));

sessions.post('/sessions', async (req, res) => {
  const { mode } = sessionCreateSchema.parse(req.body);
  res.status(201).json(await storage.createSession(uid(req), mode));
});

sessions.patch('/sessions/:id', async (req, res) => {
  const { ended, ...fields } = sessionPatchSchema.parse(req.body);
  const patch = { ...fields, endedAt: ended ? new Date().toISOString() : undefined };
  const updated = await storage.updateSession(req.params.id, uid(req), patch);
  if (!updated) return res.status(404).json({ error: 'Session not found' });
  res.json(updated);
});
