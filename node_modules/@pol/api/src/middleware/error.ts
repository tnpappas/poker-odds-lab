import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { captureException } from '../lib/sentry';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', issues: err.issues });
    return;
  }
  captureException(err);
  logger.error('unhandled request error', {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
  });
  res.status(500).json({ error: 'Internal server error' });
}
