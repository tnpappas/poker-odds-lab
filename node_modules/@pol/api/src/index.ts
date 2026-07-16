import 'dotenv/config';
import './lib/sentry'; // initialize error tracking before anything else
import { createApp } from './app';
import { storageBackend } from './storage/index';
import { logger } from './lib/logger';
import { captureException } from './lib/sentry';

const port = Number(process.env.PORT) || 3001;
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

app.listen(port, () => {
  logger.info('Poker Logic Lab API listening', {
    port,
    storage: storageBackend,
    auth: process.env.CLERK_SECRET_KEY ? 'clerk' : 'dev',
    payments: process.env.POLAR_ACCESS_TOKEN ? 'polar' : 'disabled',
  });
});
