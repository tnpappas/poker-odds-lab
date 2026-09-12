import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/app';

/** Start the API on a random port with the in-memory store and dev auth. */
export async function startServer(): Promise<{ base: string; close: () => Promise<void> }> {
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

/** Call the API as a dev-auth user (x-user-id header). */
export function asUser(base: string, userId: string, email?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-user-id': userId };
  if (email) headers['x-user-email'] = email;
  return {
    get: (path: string) => fetch(base + path, { headers }),
    post: (path: string, body?: unknown) =>
      fetch(base + path, { method: 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) }),
    del: (path: string) => fetch(base + path, { method: 'DELETE', headers }),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = Record<string, any>;

/** Parse a JSON response as a loosely typed object (tests only). */
export async function json(res: Response | Promise<Response>): Promise<Json> {
  return (await (await res).json()) as Json;
}
