/**
 * PayPal integration: Subscriptions v1 (recurring billing) and webhook
 * signature verification.
 *
 * The account owner is the merchant of record. Every call goes through
 * fetchWithTimeout so a slow PayPal cannot hang a request. When PayPal is not
 * configured (no PAYPAL_CLIENT_ID / PAYPAL_SECRET) the billing routes answer
 * 501 rather than throwing.
 *
 * Plan ids (P-...) are created in the PayPal dashboard under Subscriptions and
 * set as PAYPAL_MONTHLY_PLAN_ID / PAYPAL_ANNUAL_PLAN_ID.
 */
import { config } from '../config';
import { fetchWithTimeout } from './http';

export type CheckoutPlan = 'monthly' | 'annual';

export const paypalConfigured = config.paypalConfigured;
const API_BASE = config.paypalApiBase;

/** Where a subscriber manages or cancels their PayPal automatic payments. */
export const PAYPAL_AUTOPAY_URL = 'https://www.paypal.com/myaccount/autopay/';

/** Map a checkout plan to its PayPal billing plan id. */
export function paypalPlanIdFor(plan: CheckoutPlan): string | undefined {
  return plan === 'monthly' ? config.PAYPAL_MONTHLY_PLAN_ID : config.PAYPAL_ANNUAL_PLAN_ID;
}

// --- OAuth token (cached until shortly before expiry) --------------------
let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (!paypalConfigured) throw new Error('PayPal is not configured');
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;

  const auth = Buffer.from(`${config.PAYPAL_CLIENT_ID}:${config.PAYPAL_SECRET}`).toString('base64');
  const res = await fetchWithTimeout(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return data.access_token;
}

async function paypalRequest(path: string, init: RequestInit & { retry?: boolean } = {}): Promise<Response> {
  const token = await accessToken();
  return fetchWithTimeout(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

// --- Subscriptions --------------------------------------------------------
export interface CreatedSubscription {
  id: string;
  approveUrl: string;
  status: string;
}

/**
 * Create a subscription for a billing plan. The buyer is sent to approveUrl,
 * approves on PayPal, and returns to returnUrl with subscription_id in the
 * query string; /billing/capture then verifies it.
 *
 * PayPal-Request-Id makes the create idempotent per user for 72 hours: a
 * double click cannot create two subscriptions.
 */
export async function createSubscription(opts: {
  planId: string;
  userId: string;
  email: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<CreatedSubscription> {
  const res = await paypalRequest('/v1/billing/subscriptions', {
    method: 'POST',
    retry: false,
    headers: { 'PayPal-Request-Id': `pol-sub-${opts.userId}-${opts.planId}` },
    body: JSON.stringify({
      plan_id: opts.planId,
      custom_id: opts.userId,
      subscriber: { email_address: opts.email },
      application_context: {
        brand_name: 'Poker Logic Lab',
        user_action: 'SUBSCRIBE_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal subscription error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { id: string; status: string; links?: { rel: string; href: string }[] };
  const approve = data.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action');
  if (!approve) throw new Error('PayPal did not return an approval link');
  return { id: data.id, approveUrl: approve.href, status: data.status };
}

export interface SubscriptionResult {
  subscriptionId: string;
  /** Our internal user id, carried on the subscription as custom_id. */
  userId?: string;
  active: boolean;
  status: string;
  /** ISO time of the next charge, which is also when the paid period ends. */
  nextBillingTime?: string;
}

/** Read a subscription back from PayPal to confirm it is really active. */
export async function verifySubscription(subscriptionId: string): Promise<SubscriptionResult> {
  const res = await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: 'GET' });
  if (!res.ok) throw new Error(`PayPal subscription verify error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    id: string; status: string; custom_id?: string; billing_info?: { next_billing_time?: string };
  };
  return {
    subscriptionId: data.id,
    userId: data.custom_id,
    active: data.status === 'ACTIVE',
    status: data.status,
    nextBillingTime: data.billing_info?.next_billing_time,
  };
}

/**
 * Cancel a subscription so it never renews. PayPal then sends
 * BILLING.SUBSCRIPTION.CANCELLED, which is what revokes access. A 422 means
 * it was already cancelled, which counts as success.
 */
export async function cancelSubscription(subscriptionId: string, reason = 'Cancelled from Poker Logic Lab'): Promise<void> {
  const res = await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`PayPal cancel error ${res.status}: ${await res.text()}`);
  }
}

// --- Webhook signature verification --------------------------------------
/** Ask PayPal to confirm a webhook delivery is authentic. Requires PAYPAL_WEBHOOK_ID. */
export async function verifyWebhookSignature(
  headers: Record<string, string | undefined>,
  rawBody: Buffer,
): Promise<boolean> {
  const webhookId = config.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !paypalConfigured) return false;
  let event: unknown;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return false;
  }
  const res = await paypalRequest('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
}
