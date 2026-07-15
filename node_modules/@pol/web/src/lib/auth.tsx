import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

/** True when a Clerk publishable key is configured. */
export const clerkEnabled = !!publishableKey;

/**
 * Wraps the app in ClerkProvider only when a key is configured. Without a key
 * the app still runs in local-only mode (localStorage + dev-auth), so nothing
 * is required to boot locally.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  return <ClerkProvider publishableKey={publishableKey!}>{children}</ClerkProvider>;
}
