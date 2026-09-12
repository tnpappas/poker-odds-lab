/**
 * Outbound HTTP with a hard timeout and a single retry on transient failures.
 *
 * Every vendor call (PayPal, GoHighLevel) goes through here so one slow vendor
 * cannot hang a request forever, and a blip (network reset, 502/503/504) gets
 * one more try instead of failing the customer's checkout.
 */
export interface FetchOptions extends RequestInit {
  /** Abort after this many milliseconds (default 10s). */
  timeoutMs?: number;
  /** Retry once on network error or 5xx (default true; set false for non-idempotent calls). */
  retry?: boolean;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);

export async function fetchWithTimeout(url: string, opts: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 10_000, retry = true, ...init } = opts;
  const attempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const res = await attempt();
    if (retry && RETRYABLE_STATUS.has(res.status)) return await attempt();
    return res;
  } catch (err) {
    if (!retry) throw err;
    return attempt();
  }
}
