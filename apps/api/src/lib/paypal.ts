/**
 * PayPal REST (Orders v2) integration.
 *
 * With PayPal, the account owner is the merchant of record (unlike Polar, which
 * was a merchant-of-record service). When PAYPAL_CLIENT_ID / PAYPAL_SECRET are
 * unset, `paypalConfigured` is false and the billing routes fall back to Polar.
 *
 * Flow: create a CAPTURE order tagged with our internal user id (custom_id),
 * redirect the buyer to PayPal's approval link, then capture on return and/or
 * via the PAYMENT.CAPTURE.COMPLETED webhook. Both paths grant lifetime access.
 */

const clientId = process.env.PAYPAL_CLIENT_ID;
const secret = process.env.PAYPAL_SECRET;
const env = (process.env.PAYPAL_ENV ?? 'live').toLowerCase();

export const paypalConfigured = !!(clientId && secret);

const API_BASE =
  env === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

// Lifetime price in USD. Overridable via env so a price change needs no redeploy.
const PRICE_USD = process.env.PAYPAL_LIFETIME_PRICE ?? '24.99';

// --- OAuth token (cached until shortly before expiry) --------------------
let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (!paypalConfigured) throw new Error('PayPal is not configured');
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return data.access_token;
}

// --- Create order --------------------------------------------------------
export interface CreatedOrder {
  id: string;
  approveUrl: string;
}

/** Create a CAPTURE order for the lifetime product; custom_id ties it to our user. */
export async function createLifetimeOrder(opts: {
  userId: string;
  email: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<CreatedOrder> {
  const token = await accessToken();
  const res = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: opts.userId,
          description: 'Poker Logic Lab - Lifetime access',
          amount: { currency_code: 'USD', value: PRICE_USD },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Poker Logic Lab',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: opts.returnUrl,
            cancel_url: opts.cancelUrl,
          },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal order error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { id: string; links?: { rel: string; href: string }[] };
  const approve = data.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  if (!approve) throw new Error('PayPal did not return an approval link');
  return { id: data.id, approveUrl: approve.href };
}

// --- Capture order -------------------------------------------------------
export interface CaptureResult {
  orderId: string;
  userId?: string;
  completed: boolean;
}

/** Capture an approved order. Idempotent: an already-captured order is a success. */
export async function captureOrder(orderId: string): Promise<CaptureResult> {
  const token = await accessToken();
  const res = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, any>;

  if (!res.ok) {
    const alreadyCaptured =
      Array.isArray(data?.details) &&
      data.details.some((d: { issue?: string }) => d.issue === 'ORDER_ALREADY_CAPTURED');
    if (!alreadyCaptured) {
      throw new Error(`PayPal capture error ${res.status}: ${JSON.stringify(data)}`);
    }
  }

  const pu = data?.purchase_units?.[0];
  const cap = pu?.payments?.captures?.[0];
  const userId: string | undefined = pu?.custom_id ?? cap?.custom_id;
  const status: string | undefined = data?.status ?? cap?.status;
  const completed = status === 'COMPLETED' || cap?.status === 'COMPLETED';
  return { orderId, userId, completed };
}

// --- Webhook signature verification --------------------------------------
/** Verify a PayPal webhook via the REST verify endpoint. Requires PAYPAL_WEBHOOK_ID. */
export async function verifyWebhookSignature(
  headers: Record<string, string | undefined>,
  rawBody: Buffer,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const token = await accessToken();
  const res = await fetch(`${API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody.toString('utf8')),
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
}
