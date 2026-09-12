import { config } from '../config';
import type { User } from '../storage/types';

/**
 * Owner allowlist (OWNER_EMAILS, comma-separated). Owners get Pro without
 * paying and can use the /admin routes. Checked server side only.
 */
export function isOwner(user: Pick<User, 'email'>): boolean {
  return config.ownerEmails.includes(user.email.toLowerCase());
}
