// Thin, opt-in API client. When VITE_API_URL is set, the app best-effort syncs
// analytics (decisions, usage) to the backend so the server-side dashboard and
// leak detection work across devices. When it's unset, every call is a no-op
// and the app runs fully on localStorage.

import { clerkEnabled } from './auth';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
export const apiEnabled = !!API_URL;

/** A stable anonymous id for dev-auth mode (used only when Clerk is not wired). */
function userId(): string {
  let id = localStorage.getItem('pol-user-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('pol-user-id', id);
  }
  return id;
}

/**
 * Build the auth + content headers for an API call.
 * When Clerk is configured, send the verified session token as a bearer.
 * Otherwise fall back to the dev `x-user-id` header (local-only mode).
 */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (clerkEnabled) {
    const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
    const token = await clerk?.session?.getToken().catch(() => null);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      return headers;
    }
  }
  headers['x-user-id'] = userId();
  return headers;
}

async function send(path: string, body: unknown): Promise<void> {
  if (!apiEnabled) return;
  try {
    await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
  } catch {
    // Best-effort: never let a sync failure disrupt the local experience.
  }
}

export interface ApiDecision {
  street: string;
  decisionType: string;
  userAction: string;
  correctAction: string;
  userEquityEstimate?: number | null;
  actualEquity: number;
  evResult: number;
  potSize: number;
  betSize: number;
}

export type CheckoutPlan = 'lifetime' | 'monthly' | 'annual';

/**
 * Start a real Polar checkout and redirect the browser to it.
 * Uses the Clerk bearer token when configured, else the dev header.
 */
async function startCheckout(plan: CheckoutPlan): Promise<{ ok: boolean; error?: string }> {
  if (!apiEnabled) return { ok: false, error: 'API not configured' };
  try {
    const res = await fetch(`${API_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: body.error ?? `Checkout failed (${res.status})` };
    }
    const { url } = (await res.json()) as { url?: string };
    if (!url) return { ok: false, error: 'No checkout URL returned' };
    window.location.assign(url);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error starting checkout' };
  }
}

/**
 * Capture a PayPal order after the buyer approves and returns to the site.
 * Grants access instantly; the webhook is the redundant backup.
 */
async function captureCheckout(orderId: string): Promise<{ entitled: boolean } | null> {
  if (!apiEnabled) return null;
  try {
    const res = await fetch(`${API_URL}/api/billing/capture`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { entitled: boolean };
  } catch {
    return null;
  }
}

export type Plan = 'free' | 'pro' | 'lifetime';

/** Fetch the signed-in user's entitlement from the server. Null if unavailable. */
async function getMe(): Promise<{ plan: Plan; entitled: boolean } | null> {
  if (!apiEnabled) return null;
  try {
    const res = await fetch(`${API_URL}/api/me`, { headers: await authHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as { plan: Plan; entitled: boolean };
  } catch {
    return null;
  }
}

export const api = {
  postDecision: (d: ApiDecision) => send('/api/decisions', d),
  incrementUsage: (mode: 'replay' | 'blitz') => send('/api/usage/increment', { mode }),
  startCheckout,
  captureCheckout,
  getMe,
};
