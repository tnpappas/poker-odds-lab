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
import { logger } from './logger';

const API_BASE = 'https://services.leadconnectorhq.com';
const TOKEN = process.env.GHL_API_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID ?? 'uZ27QI1WPmHwzgqdmss8';
const CUSTOMER_TAG = process.env.GHL_CUSTOMER_TAG ?? 'customer';

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
  if (!ghlConfigured) return;
  if (!email || email.endsWith('@placeholder.local')) return;

  try {
    const upsertRes = await fetch(`${API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: ghlHeaders(),
      body: JSON.stringify({ locationId: LOCATION_ID, email }),
    });
    if (!upsertRes.ok) {
      logger.warn('ghl contact upsert failed', { status: upsertRes.status });
      return;
    }
    const data = (await upsertRes.json()) as { contact?: { id?: string } };
    const contactId = data.contact?.id;
    if (!contactId) {
      logger.warn('ghl upsert returned no contact id');
      return;
    }

    const tagRes = await fetch(`${API_BASE}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: ghlHeaders(),
      body: JSON.stringify({ tags: [CUSTOMER_TAG] }),
    });
    if (!tagRes.ok) {
      logger.warn('ghl add-tag failed', { status: tagRes.status, contactId });
      return;
    }
    logger.info('ghl customer tagged', { contactId });
  } catch (err) {
    logger.warn('ghl tag error', { err: String(err) });
  }
}
