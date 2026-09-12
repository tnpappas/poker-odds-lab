/**
 * Application API. Every route here requires an authenticated user; the
 * webhook receivers live in ../webhooks and are mounted separately because
 * they authenticate by signature instead.
 */
import { Router } from 'express';
import { requireUser } from '../middleware/auth';
import { me } from './me';
import { sessions } from './sessions';
import { decisions } from './decisions';
import { adversaries } from './adversaries';
import { blitz } from './blitz';
import { usage } from './usage';
import { account } from './account';
import { billing } from './billing';

export const api = Router();

api.use(requireUser);
api.use(me);
api.use(sessions);
api.use(decisions);
api.use(adversaries);
api.use(blitz);
api.use(usage);
api.use(account);
api.use(billing);
