import type { Request, Response, NextFunction } from 'express';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { storage } from '../storage/index';
import type { User } from '../storage/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const clerkSecret = process.env.CLERK_SECRET_KEY;
const clerkConfigured = !!clerkSecret;
const isProd = process.env.NODE_ENV === 'production';

// Fail fast on a misconfigured production deploy rather than silently trusting
// the dev `x-user-id` header (which would let anyone impersonate any user).
if (isProd && !clerkConfigured) {
  throw new Error(
    'CLERK_SECRET_KEY is required in production. Refusing to start with dev-auth (x-user-id header trust) enabled.',
  );
}

const clerkClient = clerkConfigured ? createClerkClient({ secretKey: clerkSecret! }) : null;

/**
 * Resolve the authenticated user and attach it to req.user.
 *
 * Production: verify the Clerk session JWT from the Authorization header with
 * @clerk/backend's verifyToken, then resolve the user's email (from the token
 * claims when present, otherwise via the Clerk API) and upsert into our store.
 *
 * Dev only (NODE_ENV !== 'production' and no CLERK_SECRET_KEY): trust the
 * `x-user-id` header, provisioning a user on the fly so the API is runnable
 * locally without auth infra. This path is hard-disabled in production above.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (clerkConfigured) {
      const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
      if (!token) {
        res.status(401).json({ error: 'Missing bearer token' });
        return;
      }

      let claims: Awaited<ReturnType<typeof verifyToken>>;
      try {
        claims = await verifyToken(token, { secretKey: clerkSecret! });
      } catch {
        res.status(401).json({ error: 'Invalid or expired session token' });
        return;
      }

      const clerkId = claims.sub;
      if (!clerkId) {
        res.status(401).json({ error: 'Token missing subject claim' });
        return;
      }

      // Email may ride on a custom JWT template; otherwise fetch it from Clerk.
      let email = (claims as Record<string, unknown>).email as string | undefined;
      let username = (claims as Record<string, unknown>).username as string | undefined;
      if (!email && clerkClient) {
        try {
          const u = await clerkClient.users.getUser(clerkId);
          email =
            u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
            u.emailAddresses[0]?.emailAddress;
          username = u.username ?? username;
        } catch {
          // Fall through to a placeholder; the Clerk webhook keeps email fresh.
        }
      }

      req.user = await storage.getOrCreateUser(clerkId, email ?? `${clerkId}@placeholder.local`, username);
      next();
      return;
    }

    // Dev-auth (non-production only; hard-disabled above when NODE_ENV=production).
    const devId = req.header('x-user-id') ?? 'demo-user';
    const email = req.header('x-user-email') ?? `${devId}@example.com`;
    req.user = await storage.getOrCreateUser(devId, email);
    next();
  } catch (err) {
    next(err);
  }
}
