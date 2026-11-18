# Poker Logic Lab: PayPal Subscription Setup

## Context

Poker Logic Lab is a poker decision-training app deployed on Vercel (frontend) and Railway (API). Payments are processed through PayPal. The app runs a freemium + subscription model, $29/year (lead offer) or $4.99/month. It was first switched from a one-time $24.99 lifetime purchase to a $7.99/mo or $49/yr subscription, and repriced to $29/year and $4.99/month on Nov 17 2026.

The frontend and API code are already updated and deployed. What remains is the PayPal dashboard configuration and Railway env vars.

## Tech Stack

- **Frontend:** React 19 + Vite, deployed on Vercel at https://www.pokerlogiclab.com
- **API:** Express 5 + TypeScript, deployed on Railway at https://polapi-production.up.railway.app
- **Auth:** Clerk (publishable key in Vercel env, secret key in Railway env)
- **Payments:** PayPal REST API (Subscriptions v1 for recurring billing)
- **Database:** Neon Postgres + Drizzle ORM
- **CRM:** GoHighLevel (GHL) for contact management
- **Repo:** https://github.com/tnpappas/poker-odds-lab (branch: main)

## What is already done

1. **Pricing model:** $29/year (lead offer) or $4.99/month, permanent (repriced Nov 17 2026, was $7.99/mo + $49/yr). Free tier: 3 replays/day, 2 blitz rounds/day, Visualizer + Calculator free.
2. **Frontend updated:** Pricing page, Paywall, RequirePurchase, Home, Blog, BlogPost, Legal, Seo, Admin, CheckoutSuccess, fbpixel all updated for subscription model. Zero "lifetime" references remain.
3. **API updated:** `apps/api/src/routes/index.ts` checkout route now creates PayPal subscriptions via Subscriptions v1 API. Billing/capture verifies subscription status. Billing/cancel endpoint added.
4. **PayPal integration updated:** `apps/api/src/lib/paypal.ts` has `createSubscription()`, `verifySubscription()`, `cancelSubscription()`, and `paypalPlanIdFor()` for recurring billing.
5. **Webhook handler updated:** `apps/api/src/routes/webhooks.ts` handles `BILLING.SUBSCRIPTION.ACTIVATED` (grant pro), `BILLING.SUBSCRIPTION.CANCELLED` / `EXPIRED` (revoke to free), and `PAYMENT.SALE.COMPLETED` (renewal log).
6. **Code is pushed and deployed** to both Vercel and Railway. Build passes, typecheck passes.

## What Claude needs to do

### Step 1: Create a PayPal Product

Log into the PayPal Business dashboard (https://www.paypal.com/businessmanage) or use the PayPal REST API to create a product.

**Option A: Via PayPal Dashboard**
1. Go to **Apps and Features** → **My Apps and Features** → select your app
2. Go to **Products** → **Create Product**
3. Product name: `Poker Logic Lab`
4. Product type: `SERVICE`
5. Description: `Poker decision training app`
6. Save and note the Product ID (starts with `PROD-`)

**Option B: Via REST API**
```bash
# First get an access token
curl -s -X POST https://api-m.paypal.com/v1/oauth2/token \
  -u "$PAYPAL_CLIENT_ID:$PAYPAL_SECRET" \
  -d 'grant_type=client_credentials' | jq -r '.access_token'

# Then create the product
curl -s -X POST https://api-m.paypal.com/v1/catalogs/products \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "PayPal-Request-Id: poker-logic-lab-product" \
  -d '{
    "name": "Poker Logic Lab",
    "description": "Poker decision training app with Hand Replay, Equity Visualizer, Mental Math Blitz, and more.",
    "type": "SERVICE",
    "category": "SOFTWARE_AND_SERVICES"
  }'
```

### Step 2: Create two billing plans

Create one monthly and one annual billing plan under the product.

**Monthly plan ($4.99/mo):**
```bash
curl -s -X POST https://api-m.paypal.com/v1/billing/plans \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "PayPal-Request-Id: poker-logic-lab-monthly" \
  -d '{
    "product_id": "<PRODUCT_ID from step 1>",
    "name": "Poker Logic Lab Monthly",
    "description": "Unlimited access to all Poker Logic Lab tools, $4.99/month.",
    "status": "ACTIVE",
    "billing_cycles": [
      {
        "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
        "tenure_type": "REGULAR",
        "sequence": 1,
        "total_cycles": 0,
        "pricing_scheme": {
          "fixed_price": { "value": "4.99", "currency_code": "USD" }
        }
      }
    ],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "setup_fee": { "value": "0", "currency_code": "USD" },
      "setup_fee_failure_action": "CONTINUE",
      "payment_failure_threshold": 3
    }
  }'
```

**Annual plan ($29/yr):**
```bash
curl -s -X POST https://api-m.paypal.com/v1/billing/plans \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "PayPal-Request-Id: poker-logic-lab-annual" \
  -d '{
    "product_id": "<PRODUCT_ID from step 1>",
    "name": "Poker Logic Lab Annual",
    "description": "Unlimited access to all Poker Logic Lab tools, $29/year. Save 51%.",
    "status": "ACTIVE",
    "billing_cycles": [
      {
        "frequency": { "interval_unit": "YEAR", "interval_count": 1 },
        "tenure_type": "REGULAR",
        "sequence": 1,
        "total_cycles": 0,
        "pricing_scheme": {
          "fixed_price": { "value": "29.00", "currency_code": "USD" }
        }
      }
    ],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "setup_fee": { "value": "0", "currency_code": "USD" },
      "setup_fee_failure_action": "CONTINUE",
      "payment_failure_threshold": 3
    }
  }'
```

Copy the Plan IDs (they start with `P-`) from both responses.

### Step 3: Set environment variables on Railway

Go to the Railway project `polapi-production` and set these env vars:

```
PAYPAL_MONTHLY_PLAN_ID=P-92H20041T20107138NL5DGFY
PAYPAL_ANNUAL_PLAN_ID=P-9LA204358G3322238NL5DJSI
```

These env vars are already referenced in the code:
- `apps/api/src/lib/paypal.ts` → `paypalPlanIdFor()` reads `process.env.PAYPAL_MONTHLY_PLAN_ID` and `process.env.PAYPAL_ANNUAL_PLAN_ID`

Already set (do not change):
- `PAYPAL_CLIENT_ID` (already configured)
- `PAYPAL_SECRET` (already configured)
- `PAYPAL_WEBHOOK_ID` (already configured)

After setting the new env vars, Railway will auto-redeploy the API.

### Step 4: Update the PayPal webhook event types

Go to the PayPal dashboard → **Apps and Features** → your app → **Webhooks**. The webhook URL should already be:
```
https://polapi-production.up.railway.app/webhooks/paypal
```

Add these event types to the webhook (if not already present):
- `BILLING.SUBSCRIPTION.ACTIVATED` — fires when a subscription starts, grants pro access
- `BILLING.SUBSCRIPTION.CANCELLED` — fires when a subscription is cancelled, revokes to free
- `BILLING.SUBSCRIPTION.EXPIRED` — fires when a subscription expires, revokes to free
- `PAYMENT.SALE.COMPLETED` — fires on each recurring payment (renewal), logged

The webhook code is in `apps/api/src/routes/webhooks.ts` and handles all of these.

### Step 5: Verify the full checkout flow

After the API redeploys on Railway:

1. Go to https://www.pokerlogiclab.com/pricing
2. Click "Go Monthly" (should open Clerk sign-up modal)
3. Create an account
4. After sign-up, you should be redirected to PayPal's subscription approval page
5. Approve the subscription (the membership is $29/year for annual, or $4.99/month for monthly)
6. You should be redirected back to the site and see "You're in. Unlimited access is unlocked."
7. Go to https://www.pokerlogiclab.com/replay — it should be fully unlocked

If the checkout fails with "Missing PayPal plan ID," the env vars are not set correctly. Check Railway logs.

## Key files

| File | Purpose |
|------|---------|
| `apps/api/src/lib/paypal.ts` | PayPal integration: subscriptions, verification, cancellation, webhook signature verification |
| `apps/api/src/routes/index.ts` | API routes: `/billing/checkout`, `/billing/capture`, `/billing/cancel`, `/billing/portal` |
| `apps/api/src/routes/webhooks.ts` | Webhook handlers: PayPal subscription events, Clerk user lifecycle |
| `apps/web/src/pages/Pricing.tsx` | Pricing page with Free / Monthly / Annual tiers |
| `apps/web/src/components/Paywall.tsx` | In-app paywall shown when free limits are exhausted |
| `apps/web/src/components/CheckoutSuccess.tsx` | Handles return from PayPal, verifies subscription, shows success/failed modal |
| `apps/web/src/components/RequirePurchase.tsx` | Gates tools behind purchase, free tools bypass the gate |
| `apps/web/src/store/useGameStore.ts` | Zustand store with plan state and free usage limits |
| `apps/web/src/lib/api.ts` | Frontend API client: `startCheckout()`, `captureCheckout()`, `getMe()` |

## Environment variables

### Railway (API) — already set

| Var | Purpose |
|-----|---------|
| `PAYPAL_CLIENT_ID` | PayPal REST API client ID |
| `PAYPAL_SECRET` | PayPal REST API secret |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID for signature verification |
| `CLERK_SECRET_KEY` | Clerk server-side API key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `DATABASE_URL` | Neon Postgres connection string |
| `GHL_API_TOKEN` | GoHighLevel API token |
| `GHL_LOCATION_ID` | GHL location ID |
| `OWNER_EMAILS` | Comma-separated owner emails (bypass paywall) |
| `FRONTEND_URL` | `https://www.pokerlogiclab.com` |

### Railway (API) — needs to be set

| Var | Purpose |
|-----|---------|
| `PAYPAL_MONTHLY_PLAN_ID` | PayPal billing plan ID for $4.99/mo subscription |
| `PAYPAL_ANNUAL_PLAN_ID` | PayPal billing plan ID for $29/yr subscription |

### Vercel (Frontend) — already set

| Var | Purpose |
|-----|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_API_URL` | `https://polapi-production.up.railway.app` |

## Pricing model

| Tier | Price | What you get |
|------|-------|--------------|
| Free | $0 | 3 Hand Replay hands/day, 2 Mental Math Blitz rounds/day, Equity Visualizer, Equity Calculator, 1 free Lab Note |
| Monthly | $4.99/mo | Everything unlimited + all Lab Notes + the complete book + new Lab Notes weekly |
| Annual | $29/yr | Same as Monthly, billed annually (save 51%) |

## Notes

- Polar was referenced in the codebase as a fallback payment provider but was never configured on Railway. All payments go through PayPal. The Polar code paths remain as a fallback but are not active.
- The `PAYPAL_ENV` env var defaults to `live` (production). Set it to `sandbox` for testing.
- The `PAYPAL_LIFETIME_PRICE` env var is no longer used (was for the old one-time purchase model).
- Free limits: `FREE_REPLAY_LIMIT = 3` and `FREE_BLITZ_LIMIT = 2` in `apps/web/src/store/useGameStore.ts`.
