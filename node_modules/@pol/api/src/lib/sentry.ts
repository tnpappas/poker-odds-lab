import * as Sentry from '@sentry/node';
import { logger } from './logger';

const dsn = process.env.SENTRY_DSN;

export const sentryEnabled = !!dsn;

// Initialize on import (index.ts imports this before creating the app).
// No-op when SENTRY_DSN is unset, so local dev needs no Sentry account.
if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
  logger.info('sentry initialized');
}

/** Report an error to Sentry (no-op when disabled) and never throw. */
export function captureException(err: unknown): void {
  if (!sentryEnabled) return;
  try {
    Sentry.captureException(err);
  } catch {
    // Never let error reporting itself crash the request path.
  }
}

export { Sentry };
