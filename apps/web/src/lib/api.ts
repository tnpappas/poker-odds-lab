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

/** Read the Clerk session token straight off the global, if Clerk has loaded. */
async function clerkToken(): Promise<string | null> {
  const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
  return (await clerk?.session?.getToken().catch(() => null)) ?? null;
}

/**
 * Build the auth + content headers for an API call.
 *
 * When Clerk is configured the session token is required: it is sent as a
 * bearer and we do NOT fall back to the dev `x-user-id` header, because the
 * production API rejects that header outright, so the fallback only ever
 * produced silent 401s. Callers that run early in the page lifecycle (the
 * checkout return, for example) should pass a token they already obtained from
 * Clerk's `getToken()` so they never race Clerk's async load.
 */
async function authHeaders(token?: string | null): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (clerkEnabled) {
    const bearer = token ?? (await clerkToken());
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    return headers;
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

export type CheckoutPlan = 'monthly' | 'annual';

/**
 * Start a real hosted checkout and redirect the browser to it.
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
 * Result of trying to capture a PayPal order.
 *
 * `pending` means PayPal has the order but the capture has not settled yet, so
 * the webhook will finish the job. Anything else is a real failure and must be
 * surfaced, never swallowed: a swallowed failure means a buyer approved a
 * payment that was never actually collected.
 */
export type CaptureOutcome =
  | { ok: true; entitled: boolean }
  | { ok: false; reason: 'unauthenticated' | 'pending' | 'error'; status: number; message?: string };

/**
 * Capture a PayPal order after the buyer approves and returns to the site.
 * Grants access immediately; the PAYMENT.CAPTURE.COMPLETED webhook and the
 * CHECKOUT.ORDER.APPROVED safety net are the server-side backups.
 */
async function captureCheckout(orderId: string, token?: string | null): Promise<CaptureOutcome> {
  if (!apiEnabled) return { ok: false, reason: 'error', status: 0, message: 'API not configured' };
  try {
    const res = await fetch(`${API_URL}/api/billing/capture`, {
      method: 'POST',
      headers: await authHeaders(token),
      body: JSON.stringify({ orderId }),
    });
    // 202 counts as ok on a Response, so check it first.
    if (res.status === 202) return { ok: false, reason: 'pending', status: 202 };
    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as { entitled?: boolean };
      return { ok: true, entitled: !!body.entitled };
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const reason = res.status === 401 || res.status === 403 ? 'unauthenticated' : 'error';
    console.error('[checkout] capture failed', res.status, body.error);
    return { ok: false, reason, status: res.status, message: body.error };
  } catch (err) {
    console.error('[checkout] capture request errored', err);
    return { ok: false, reason: 'error', status: 0, message: String(err) };
  }
}

export type Plan = 'free' | 'pro';

export interface Me {
  id?: string;
  email?: string;
  plan: Plan;
  entitled: boolean;
  owner?: boolean;
}

/** Fetch the signed-in user's entitlement from the server. Null if unavailable. */
async function getMe(token?: string | null): Promise<Me | null> {
  if (!apiEnabled) return null;
  try {
    const res = await fetch(`${API_URL}/api/me`, { headers: await authHeaders(token) });
    if (!res.ok) return null;
    return (await res.json()) as Me;
  } catch {
    return null;
  }
}

/** Owner-only: grant (or revoke) access for an account by email address. */
async function grantAccess(
  email: string,
  plan: Plan = 'pro',
): Promise<{ ok: true; email: string; plan: Plan } | { ok: false; error: string }> {
  if (!apiEnabled) return { ok: false, error: 'API not configured' };
  try {
    const res = await fetch(`${API_URL}/api/admin/grant`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ email, plan }),
    });
    const body = (await res.json().catch(() => ({}))) as { email?: string; plan?: Plan; error?: string };
    if (!res.ok) return { ok: false, error: body.error ?? `Request failed (${res.status})` };
    return { ok: true, email: body.email ?? email, plan: body.plan ?? plan };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export const api = {
  postDecision: (d: ApiDecision) => send('/api/decisions', d),
  incrementUsage: (mode: 'replay' | 'blitz') => send('/api/usage/increment', { mode }),
  startCheckout,
  captureCheckout,
  getMe,
  grantAccess,
};
