import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { captureException } from '../lib/sentry';

/**
 * Last handler in the chain. Validation errors become 400s; everything else is
 * reported to Sentry, logged with the request id, and answered with a generic
 * 500 that carries the request id so a customer can quote it to support.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', issues: err.issues });
    return;
  }
  captureException(err);
  logger.error('unhandled request error', {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    error: err instanceof Error ? err.message : String(err),
  });
  res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
}
