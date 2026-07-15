import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY;

export const stripeConfigured = !!secret;

/** Shared Stripe client (null when STRIPE_SECRET_KEY is unset). */
export const stripe: Stripe | null = secret ? new Stripe(secret) : null;

export type CheckoutPlan = 'lifetime' | 'monthly' | 'annual';

/** Map a checkout plan to its configured Stripe Price ID. */
export function priceIdFor(plan: CheckoutPlan): string | undefined {
  switch (plan) {
    case 'lifetime':
      return process.env.STRIPE_LIFETIME_PRICE_ID;
    case 'monthly':
      return process.env.STRIPE_MONTHLY_PRICE_ID;
    case 'annual':
      return process.env.STRIPE_ANNUAL_PRICE_ID;
  }
}
