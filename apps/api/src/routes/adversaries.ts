import { Router, type Request } from 'express';
import { storage } from '../storage/index';
import { adversarySchema } from './schemas';

export const adversaries = Router();
const uid = (req: Request) => req.user!.id;

adversaries.get('/adversaries', async (req, res) => res.json(await storage.listAdversaries(uid(req))));

adversaries.post('/adversaries', async (req, res) => {
  const input = adversarySchema.parse(req.body);
  res.status(201).json(await storage.createAdversary(uid(req), input));
});

adversaries.patch('/adversaries/:id', async (req, res) => {
  const patch = adversarySchema.partial().parse(req.body);
  const updated = await storage.updateAdversary(req.params.id, uid(req), patch);
  if (!updated) return res.status(404).json({ error: 'Adversary not found' });
  res.json(updated);
});

adversaries.delete('/adversaries/:id', async (req, res) => {
  const ok = await storage.deleteAdversary(req.params.id, uid(req));
  if (!ok) return res.status(404).json({ error: 'Adversary not found' });
  res.status(204).end();
});
