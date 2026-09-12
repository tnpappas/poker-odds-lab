import { Router } from 'express';
import { clerkWebhook } from './clerk';
import { paypalWebhook } from './paypal';

/** Signature-authenticated receivers, mounted at /api before the JSON parser. */
export const webhooks = Router();
webhooks.use(clerkWebhook);
webhooks.use(paypalWebhook);
