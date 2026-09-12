import express from 'express';

/**
 * Webhook routers are mounted BEFORE express.json() in app.ts and parse the raw
 * body themselves: signature verification needs the exact bytes the provider
 * signed, which a prior JSON parse would destroy.
 */
export const rawJson = express.raw({ type: 'application/json' });
