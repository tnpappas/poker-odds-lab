import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const ghl = vi.hoisted(() => ({ tagGhlContact: vi.fn(async (_email: string, _tag: string) => true) }));
vi.mock('../src/lib/ghl', () => ({ ghlConfigured: true, tagGhlCustomer: vi.fn(async () => undefined), ...ghl }));

import { startServer } from './helpers';

let base: string;
let close: () => Promise<void>;
beforeAll(async () => ({ base, close } = await startServer()));
afterAll(() => close());

const post = (body: unknown) =>
  fetch(base + '/api/leads/free-chapters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('free chapters signup', () => {
  it('needs no account and tags the email in GHL', async () => {
    ghl.tagGhlContact.mockClear();
    const res = await post({ email: ' Reader@Example.com ', source: 'home' });
    expect(res.status).toBe(200);
    expect(ghl.tagGhlContact).toHaveBeenCalledWith('reader@example.com', 'free-chapters');
  });

  it('works without a source', async () => {
    expect((await post({ email: 'nosource@example.com' })).status).toBe(200);
  });

  it('rejects a bad email without calling GHL', async () => {
    ghl.tagGhlContact.mockClear();
    const res = await post({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(ghl.tagGhlContact).not.toHaveBeenCalled();
  });

  it('reports a failure instead of losing the email', async () => {
    ghl.tagGhlContact.mockResolvedValueOnce(false);
    expect((await post({ email: 'lost@example.com' })).status).toBe(503);
  });
});
