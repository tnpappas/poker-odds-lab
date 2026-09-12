import * as Sentry from '@sentry/react';

// Browser error tracking. No-op when VITE_SENTRY_DSN is unset (local dev,
// previews), so nothing is sent unless the Vercel env var is configured.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export const sentryEnabled = !!dsn;

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Errors only; no performance tracing (keeps the free tier quiet).
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

export { Sentry };
