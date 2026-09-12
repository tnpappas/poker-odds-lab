import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Tests run against the in-memory store with dev auth: no database, no
    // Clerk, no PayPal. Vendor calls are mocked per test.
    env: { NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:5173', OWNER_EMAILS: 'owner@example.com' },
  },
});
