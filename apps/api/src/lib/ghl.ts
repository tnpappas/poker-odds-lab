/**
 * GoHighLevel (LeadConnector) integration.
 *
 * When a purchase completes we tag the buyer's contact as "customer" in GHL.
 * Adding that tag fires the "Customer - Book Delivery" workflow, which emails
 * the full guide and removes the buyer from the free-chapters nurture.
 *
 * Best-effort: every call is wrapped so a GHL outage can never break the
 * purchase flow. No-ops when GHL_API_TOKEN is unset (same safe-fallback pattern
 * as our other optional integrations).
 */
import { config } from '../config';
import { logger } from './logger';
import { fetchWithTimeout } from './http';

const API_BASE = 'https://services.leadconnectorhq.com';
const TOKEN = config.GHL_API_TOKEN;
const LOCATION_ID = config.GHL_LOCATION_ID ?? 'uZ27QI1WPmHwzgqdmss8';
const CUSTOMER_TAG = config.GHL_CUSTOMER_TAG;

export const ghlConfigured = Boolean(TOKEN);

function ghlHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Tag a buyer as "customer" in GHL, matched/created by email. Two steps: upsert
 * the contact (dedupes by email within the location), then add the tag via the
 * dedicated endpoint so the tag-added workflow trigger fires reliably.
 */
export async function tagGhlCustomer(email: string): Promise<void> {
  await tagGhlContact(email, CUSTOMER_TAG);
}

/** Upsert a contact by email and add one tag. Best-effort, never throws. Resolves true when the tag was added. */
export async function tagGhlContact(email: string, tag: string): Promise<boolean> {
  if (!ghlConfigured) return false;
  if (!email || email.endsWith('@placeholder.local')) return false;

  try {
    const upsertRes = await fetchWithTimeout(`${API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: ghlHeaders(),
      body: JSON.stringify({ locationId: LOCATION_ID, email }),
    });
    if (!upsertRes.ok) {
      logger.warn('ghl contact upsert failed', { status: upsertRes.status });
      return false;
    }
    const data = (await upsertRes.json()) as { contact?: { id?: string } };
    const contactId = data.contact?.id;
    if (!contactId) {
      logger.warn('ghl upsert returned no contact id');
      return false;
    }

    const tagRes = await fetchWithTimeout(`${API_BASE}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: ghlHeaders(),
      body: JSON.stringify({ tags: [tag] }),
    });
    if (!tagRes.ok) {
      logger.warn('ghl add-tag failed', { status: tagRes.status, contactId });
      return false;
    }
    logger.info('ghl contact tagged', { contactId, tag });
    return true;
  } catch (err) {
    logger.warn('ghl tag error', { err: String(err) });
    return false;
  }
}
