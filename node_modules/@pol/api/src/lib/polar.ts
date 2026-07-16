import { Polar } from '@polar-sh/sdk';

const accessToken = process.env.POLAR_ACCESS_TOKEN;

export const polarConfigured = !!accessToken;

/** Shared Polar client (null when POLAR_ACCESS_TOKEN is unset). */
export const polar: Polar | null = accessToken
  ? new Polar({
      accessToken,
      // 'sandbox' while testing, 'production' when live. Defaults to production.
      server: (process.env.POLAR_SERVER as 'sandbox' | 'production' | undefined) ?? 'production',
    })
  : null;

export type CheckoutPlan = 'lifetime' | 'monthly' | 'annual';

/** Map a checkout plan to its configured Polar product ID. */
export function productIdFor(plan: CheckoutPlan): string | undefined {
  switch (plan) {
    case 'lifetime':
      return process.env.POLAR_LIFETIME_PRODUCT_ID;
    case 'monthly':
      return process.env.POLAR_MONTHLY_PRODUCT_ID;
    case 'annual':
      return process.env.POLAR_ANNUAL_PRODUCT_ID;
  }
}

/** Reverse-map a Polar product ID back to our internal plan tier (for webhooks). */
export function planForProduct(productId: string | undefined | null): 'lifetime' | 'pro' | null {
  if (!productId) return null;
  if (productId === process.env.POLAR_LIFETIME_PRODUCT_ID) return 'lifetime';
  if (productId === process.env.POLAR_MONTHLY_PRODUCT_ID || productId === process.env.POLAR_ANNUAL_PRODUCT_ID) {
    return 'pro';
  }
  return null;
}
