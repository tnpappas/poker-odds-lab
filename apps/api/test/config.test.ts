import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config';

describe('config', () => {
  it('production refuses to start without the required variables', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', FRONTEND_URL: 'https://x' })).toThrow(/missing required environment variables/);
  });

  it('production starts when everything required is present', () => {
    const c = loadConfig({
      NODE_ENV: 'production', DATABASE_URL: 'postgres://x', CLERK_SECRET_KEY: 'sk', CLERK_WEBHOOK_SECRET: 'wh',
      PAYPAL_CLIENT_ID: 'id', PAYPAL_SECRET: 's', PAYPAL_WEBHOOK_ID: 'w', PAYPAL_MONTHLY_PLAN_ID: 'P-1', PAYPAL_ANNUAL_PLAN_ID: 'P-2',
      FRONTEND_URL: 'https://www.pokerlogiclab.com,https://preview.vercel.app',
    });
    expect(c.isProd).toBe(true);
    expect(c.paypalConfigured).toBe(true);
    expect(c.primaryFrontendUrl).toBe('https://www.pokerlogiclab.com');
    expect(c.frontendOrigins).toHaveLength(2);
    expect(c.paypalApiBase).toContain('api-m.paypal.com');
  });

  it('development needs nothing', () => {
    const c = loadConfig({ NODE_ENV: 'development' });
    expect(c.paypalConfigured).toBe(false);
    expect(c.PORT).toBe(3001);
  });

  it('sandbox switches the PayPal base url', () => {
    expect(loadConfig({ PAYPAL_ENV: 'sandbox' }).paypalApiBase).toContain('sandbox');
  });
});
