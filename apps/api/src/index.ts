import 'dotenv/config';
import { config, missingRecommended } from './config'; // validates the environment; throws in production if incomplete
import './lib/sentry'; // initialize error tracking before anything else
import { createApp } from './app';
import { storageBackend } from './storage/index';
import { logger } from './lib/logger';
import { captureException } from './lib/sentry';

const app = createApp();

// Last-resort safety nets so a stray rejection/exception is reported, not silent.
process.on('unhandledRejection', (reason) => {
  captureException(reason);
  logger.error('unhandledRejection', { reason: reason instanceof Error ? reason.message : String(reason) });
});
process.on('uncaughtException', (err) => {
  captureException(err);
  logger.error('uncaughtException', { error: err.message });
});

const missing = missingRecommended(config);
if (config.isProd && missing.length) {
  logger.warn('recommended environment variables are not set', { missing });
}

app.listen(config.PORT, () => {
  logger.info('Poker Logic Lab API listening', {
    port: config.PORT,
    env: config.NODE_ENV,
    storage: storageBackend,
    auth: config.CLERK_SECRET_KEY ? 'clerk' : 'dev',
    payments: config.paypalConfigured ? `paypal:${config.PAYPAL_ENV}` : 'disabled',
    errorTracking: config.SENTRY_DSN ? 'sentry' : 'disabled',
  });
});
