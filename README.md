# Aero Aminos — custom store

Build 0.2.0 · October 5, 2026

A custom Node/Express application with the approved black-and-gold visual direction, the supplied 21-product catalog, one-time purchases, PayPal integration code, manual Zelle verification, customer accounts and owner operations. Shopify is not used. Subscriptions and recurring discounts are absent.

**Status: implementation prepared for staging, not a live or fully production-validated store.** Checkout defaults closed. No client credentials, live payment, domain, email delivery or publishing have been configured. The original simulated portal remains a separate historical prototype.

## Run locally

Requires Node 24 and npm. From this directory:

```bash
npm ci
cp .env.example .env
npm run dev:server
```

In a second terminal:

```bash
npm run dev
```

Open http://localhost:4173. The catalog works without credentials; registration and recovery require configured email. Set OWNER_EMAIL in .env, then run `npm run owner` in an interactive terminal to create the verified owner. There are no default passwords, seeded people, stock quantities or orders. Use the owner Product collection screen to enter confirmed available stock.

## Verify and build

```bash
npm test
npm run build
```

The automated suite uses temporary databases, local HTTP, mocked PayPal/SMTP, and jsdom for interface interactions. It covers customer isolation, owner permissions, CSRF, verification/recovery, stock races, authoritative totals, idempotency, PayPal status reconciliation, verified webhook processing, Zelle receipt checks, fulfillment, mail retry, and backup restoration. It does not replace real PayPal sandbox transactions, SMTP delivery tests, accessibility testing or visual browser QA.

For deployment and client setup, read DEPLOYMENT.md. The supplied Dockerfile has not been built in this environment.

## What is implemented

- Exact product names, strengths and supplied prices; integer-cent totals calculated on the server.
- Customer login, verified registration, single-use recovery links, hashed passwords, HttpOnly sessions and server-enforced access.
- Persistent SQLite orders, available inventory, event history, hashed session/reset tokens and an email outbox.
- PayPal create/capture and signature-verified webhooks; merchant, order, currency and amount validation. Pending payment never qualifies for fulfillment.
- Zelle orders await manual owner verification of full receipt with a unique bank reference and password re-entry.
- Paid-only shipment recording with carrier/tracking; customer and owner notifications queued on payment.
- Configuration checks keep checkout closed by default. Unknown stock cannot be purchased.

## Operational boundaries

One application process with one persistent SQLite database is required. Do not run multiple replicas or cluster workers. There is no scheduled unpaid PayPal reservation expiration, automatic tax engine, carrier-label purchase, owner MFA, refund initiation screen, dispute workflow, email bounce webhook, or automatic offsite backup job. These must be addressed for the intended operating model before a production release.

Inventory is available-to-sell stock: creating an order reserves it. Unpaid Zelle can be canceled by the owner and restocks once. Unpaid/failed PayPal reservations remain held until the operator reconciles the provider state; never manually release stock while a payment may still complete. Paid/refunded stock is not automatically returned. Do not launch high-volume sales without a reviewed reservation expiry/reconciliation workflow.

Refunds are initiated in PayPal. Verified refund/reversal events update order payment status; accounting and returned inventory require owner review. Shipment status remains a separate record. Dashboard paid subtotal excludes fully/partially refunded orders and is an operational indicator, not accounting net revenue.

SMTP acceptance is recorded as `accepted`, not `delivered`. Retries persist across restarts, but an interruption after SMTP acceptance and before database acknowledgement can produce a duplicate email. Configure provider delivery monitoring, SPF/DKIM/DMARC and bounce handling before launch. Failed messages are visible by count in Store setup; automated replay/alerting is not implemented.

Policy pages and approved product/use content are not supplied or invented. `POLICIES_APPROVED=true` is an operator attestation, not a policy publisher. Add the actual approved shipping, refund, privacy and terms pages and links before setting it.

## Source layout

- `app.js`, `styles.css`, `index.html`, `public/logo.png`: storefront and account screens.
- `server/app.js`: API, checkout, account and owner authorization.
- `server/paypal.js`: PayPal API adapter.
- `server/db.js`, `catalog.js`: schema and supplied catalog.
- `server/mail.js`: persistent notification queue and SMTP worker.
- `server/owner.js`, `backup.js`: administrative CLI utilities.
- `tests/`: integration, interface and operational checks.

Secrets belong in private host configuration. The PayPal Client ID is public by design; the Client Secret must remain server-side. No secrets or real customer records are included in this package.
