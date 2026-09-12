/**
 * Environment configuration, validated once at startup.
 *
 * In production every variable the live app depends on must be present, and
 * the process refuses to start otherwise (a missing plan id used to surface
 * only at checkout time as "Missing PayPal plan ID"). In development and test
 * everything is optional so the API still boots with the in-memory store and
 * dev auth.
 */
import { z } from 'zod';

const NodeEnv = z.enum(['development', 'test', 'production']).default('development');

const schema = z.object({
  NODE_ENV: NodeEnv,
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_SECRET: z.string().optional(),
  PAYPAL_ENV: z.enum(['live', 'sandbox']).default('live'),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_MONTHLY_PLAN_ID: z.string().optional(),
  PAYPAL_ANNUAL_PLAN_ID: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  OWNER_EMAILS: z.string().default(''),
  GHL_API_TOKEN: z.string().optional(),
  GHL_LOCATION_ID: z.string().optional(),
  GHL_CUSTOMER_TAG: z.string().default('customer'),
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
});

export type Config = z.infer<typeof schema> & {
  isProd: boolean;
  isTest: boolean;
  /** First FRONTEND_URL entry: the origin used for checkout return redirects. */
  primaryFrontendUrl: string;
  /** Every FRONTEND_URL entry: the CORS allowlist. */
  frontendOrigins: string[];
  ownerEmails: string[];
  paypalConfigured: boolean;
  paypalApiBase: string;
};

/** Variables that must be set for a production deploy to be considered valid. */
const REQUIRED_IN_PROD = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'PAYPAL_MONTHLY_PLAN_ID',
  'PAYPAL_ANNUAL_PLAN_ID',
  'FRONTEND_URL',
] as const;

/** Variables that should be set in production; missing ones are logged, not fatal. */
const RECOMMENDED_IN_PROD = ['SENTRY_DSN', 'GHL_API_TOKEN', 'OWNER_EMAILS'] as const;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  const c = parsed.data;
  const isProd = c.NODE_ENV === 'production';

  if (isProd) {
    const missing = REQUIRED_IN_PROD.filter((k) => !c[k]);
    if (missing.length) {
      throw new Error(
        `Refusing to start in production: missing required environment variables ${missing.join(', ')}. ` +
          'Set them in the Railway service variables.',
      );
    }
  }

  const frontendOrigins = c.FRONTEND_URL.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    ...c,
    isProd,
    isTest: c.NODE_ENV === 'test',
    primaryFrontendUrl: frontendOrigins[0] ?? 'http://localhost:5173',
    frontendOrigins,
    ownerEmails: c.OWNER_EMAILS.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    paypalConfigured: !!(c.PAYPAL_CLIENT_ID && c.PAYPAL_SECRET),
    paypalApiBase: c.PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com',
  };
}

/** Names of recommended variables that are unset (for a startup warning). */
export function missingRecommended(c: Config): string[] {
  return RECOMMENDED_IN_PROD.filter((k) => !c[k]);
}

export const config: Config = loadConfig();
