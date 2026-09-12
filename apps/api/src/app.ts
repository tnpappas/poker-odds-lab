import express from 'express';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { api } from './routes/index';
import { webhooks } from './webhooks/index';
import { errorHandler } from './middleware/error';
import { storageBackend } from './storage/index';

// CORS fails closed in production: with no allowlist configured, no
// cross-origin browser request is permitted rather than reflecting every origin.
const corsOrigin = config.frontendOrigins.length > 0 ? config.frontendOrigins : config.isProd ? false : true;

/** Requests per minute per IP on the application API. */
const API_RATE_LIMIT = 120;
/** Tighter limit for billing: nobody legitimately starts 10 checkouts a minute. */
const BILLING_RATE_LIMIT = config.isTest ? 1000 : 10;

export function createApp() {
  const app = express();

  // Behind Railway's proxy, so rate limiting sees the real client IP.
  app.set('trust proxy', 1);

  // Request id: returned to the client and attached to every log line the
  // request produces, so one id ties a support report to the server logs.
  app.use((req, res, next) => {
    const id = req.header('x-request-id') ?? randomUUID();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    next();
  });

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
      auth: config.CLERK_SECRET_KEY ? 'clerk' : 'dev',
      payments: config.paypalConfigured ? 'paypal' : 'disabled',
      errorTracking: config.SENTRY_DSN ? 'sentry' : 'disabled',
    });
  });

  const limiterOptions = { standardHeaders: 'draft-7' as const, legacyHeaders: false, message: { error: 'Too many requests, please slow down.' } };
  app.use('/api/billing', rateLimit({ windowMs: 60_000, limit: BILLING_RATE_LIMIT, ...limiterOptions }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: API_RATE_LIMIT, ...limiterOptions }), api);

  app.use(errorHandler);
  return app;
}
