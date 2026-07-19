import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { api } from './routes/index';
import { webhooks } from './routes/webhooks';
import { errorHandler } from './middleware/error';
import { storageBackend } from './storage/index';

const isProd = process.env.NODE_ENV === 'production';

// CORS allowlist from FRONTEND_URL (comma-separated for multiple origins).
// Fails closed in production: with no allowlist configured, no cross-origin
// browser requests are permitted rather than reflecting every origin.
const allowlist = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOrigin = allowlist.length > 0 ? allowlist : isProd ? false : true;

export function createApp() {
  const app = express();

  // Behind a proxy/load balancer (Railway, Render, Vercel) so rate-limit and
  // secure-cookie logic see the real client IP.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: corsOrigin, credentials: true }));

  // Webhooks are mounted BEFORE express.json(): they verify signatures against
  // the raw request body, which a global JSON parse would consume.
  app.use('/api', webhooks);

  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      storage: storageBackend,
      auth: process.env.CLERK_SECRET_KEY ? 'clerk' : 'dev',
      payments: process.env.PAYPAL_CLIENT_ID ? 'paypal' : process.env.POLAR_ACCESS_TOKEN ? 'polar' : 'disabled',
    });
  });

  // Rate limit the application API (health + webhooks are intentionally exempt:
  // webhooks are authenticated by signature and can legitimately burst).
  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120, // 120 requests/minute per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
  });
  app.use('/api', apiLimiter, api);

  app.use(errorHandler);
  return app;
}
