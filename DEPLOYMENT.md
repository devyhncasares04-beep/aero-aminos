# Aero Aminos — staging and launch handoff

Prepared October 5, 2026. No Shopify account is required. This is a single-instance Node 24 service with a persistent disk. The site has not been published.

## Client responsibilities

Use a client-owned hosting account and domain. Render is one deployment option for an Express service with a persistent disk; its persistent disks require a paid service. No service, subscription or account has been purchased or created here. Review the current provider terms and cost before deploying.

The client must supply or approve:

1. Hosting account, domain and domain access.
2. Actual selling territories, permitted catalog/use and payment-provider acceptance of this specific catalog. A PayPal Business account or developer app alone does not establish product eligibility.
3. USD confirmation, approved delivery rate, reviewed tax treatment and allowed destinations. The implementation supports a single flat shipping charge and one tax rate, not address-based tax calculation. If obligations vary within the allowed destinations, implement the appropriate tax service/rules before launch.
4. Confirmed available stock for each product, owner and support emails, and actual store policies/content.
5. An authenticated transactional email service with SMTP credentials and approved sender domain.
6. PayPal credentials through private hosting settings, and the exact Zelle business recipient/name plus the bank's confirmation that the intended business use is supported.

Do not send PayPal passwords or Client Secrets in chat or commit them to source control. The client can enter secrets directly in the host's private environment settings.

## PayPal: next steps from the app credentials screen

Start with the **Sandbox** app already created. Stay in sandbox during integration tests.

1. Keep that app's Client ID and Client Secret together. Enter them privately as PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in staging.
2. Obtain the merchant ID for the corresponding sandbox business account and set PAYPAL_MERCHANT_ID. Do not combine sandbox credentials with a live merchant ID.
3. Once staging has a public HTTPS URL, add a webhook to that same sandbox app at `https://YOUR-STAGING-HOST/api/paypal/webhook`.
4. Subscribe to PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.PENDING, PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.REFUNDED and PAYMENT.CAPTURE.REVERSED. The application acts on completed, denied, refunded and reversed events; capture responses also record pending state. Save its webhook ID as PAYPAL_WEBHOOK_ID.
5. Leave PAYPAL_MODE=sandbox. Use a separate sandbox buyer to test the full checkout, cancellation, retries, payment confirmation and refund reconciliation.
6. Before live activation, obtain product eligibility confirmation, create/select the Live app, replace all four settings with matching live values, create its live webhook, and set PAYPAL_MODE=live and PAYPAL_CATALOG_APPROVED=true. Sandbox and live records must use separate databases/deployments.

The webhook ID and credentials are environment-specific. A webhook simulator alone is not sufficient evidence of actual checkout reconciliation. Client browser approval is never accepted as proof of payment; the server checks PayPal.

## Host the staging service

1. Put this source in a private, client-controlled repository. Do not add .env, node_modules, data, database backups or production customer records.
2. Create one Node web service. For Render, use Node 24, build command `npm ci && npm run build`, start command `npm start`, health path `/api/health`, and a persistent disk mounted at `/var/data`.
3. Set DATABASE_PATH=/var/data/aero.sqlite and APP_ORIGIN to the exact service HTTPS origin, with no trailing slash. Ensure the service user can write the mount. If using Docker, the image runs as UID 1000 and the volume must be writable by that user.
4. Configure all needed variables from .env.example in the private service environment. Let the provider supply PORT. Determine TRUST_PROXY_HOPS from the actual proxy topology; do not blindly trust forwarded headers or copy a count from another deployment.
5. Keep CHECKOUT_ENABLED=false initially. Create the owner through `npm run owner` in a private interactive service shell connected to the persistent disk. The owner email must match OWNER_EMAIL. Use a unique long password.
6. Configure SMTP and prove email verification, reset, paid-order and shipment messages reach intended inboxes. Set stock in the owner portal.
7. Publish client-approved policy pages and navigation links, approve the catalog/territories, configure shipping/tax/currency and enable only the payment methods cleared for testing. Set the approval flags truthfully. Enable checkout only in restricted staging once those prerequisites are satisfied. Use separate clearly labeled test Zelle instructions, or leave Zelle disabled in staging; Zelle has no test mode in this application.
8. Test desktop/mobile in a real browser, keyboard navigation, readable errors, payment popup/CSP behavior, denied payment and network interruptions. Browser visual QA was unavailable in the build environment and remains outstanding.

For a normal production process, npm start enforces NODE_ENV=production; HTTPS APP_ORIGIN is mandatory. The Dockerfile is an alternative deployment path and still requires a persistent volume, private environment and runtime validation.

## Data and operations

Keep one process/replica. SQLite, in-process payment locks and the mail worker are designed for one instance. A multi-instance deployment needs a coordinated database/worker/locking design first.

Create consistent backups with the included command, using an existing secure destination directory:

```bash
npm run backup -- /absolute/secure/path/aero-backup.sqlite
```

This invokes SQLite online backup. Encrypt and copy backups off the application disk; schedule and monitor that job in the hosting environment. Protect backups as customer data. For restoration, stop the service, restore into a clean database directory (do not retain stale WAL/SHM files), start the service, and verify orders, stock and account access. A local backup/restore test passed; host backup scheduling and disaster recovery have not been configured.

Review health, payment/provider events and the owner Store setup email counts. Add external uptime/error alerting, email delivery/bounce handling and a failed-payment reconciliation routine. Do not treat basic health as full payment-system health. Never log credentials or full customer/payment payloads.

Unpaid PayPal stock is deliberately retained until reconciled. Automatic expiry/release and a safe operator cancellation workflow remain required for unattended production operation. Owner MFA and session management improvements, policy content, retention/deletion procedures, refund handling and dispute operations require final production review.

## Release evidence still required

- Real PayPal sandbox checkout and refund/webhook tests, including pending/failed/abandoned cases.
- Real SMTP delivery, recovery and customer/owner notification checks.
- Actual browser/mobile/accessibility review of the served application.
- Persistent-disk restart and host backup restore rehearsal.
- Approved catalog/payment eligibility, stock, shipping, tax, policies and operating procedures.
- Explicit release approval before public launch or any live charge. A live test purchase must be separately authorized.

## Official references

- PayPal checkout: https://developer.paypal.com/docs/checkout/standard/integrate/
- PayPal Orders API: https://developer.paypal.com/api/orders/v2/
- PayPal webhooks: https://developer.paypal.com/api/webhooks/v1/
- Render Express deployment: https://render.com/docs/deploy-node-express-app
- Render persistent disks: https://render.com/docs/disks

## October 2026 storefront update

The root route now opens the black-and-gold landing page. `#/shop` remains the full searchable catalog. Product details, client care and all four policy routes are linked from the store. Country choices come only from `SHIPPING_COUNTRIES`. Account email forms explain when the mail service is not yet configured.

Before opening checkout, publish client-approved plain text using `TERMS_TEXT`, `PRIVACY_TEXT`, `SHIPPING_POLICY_TEXT`, and `REFUND_POLICY_TEXT`, then set `POLICIES_APPROVED=true`. Unapproved text is not published. An approval flag by itself no longer satisfies the policy gate. All product stock quantities must be confirmed (0 is valid for sold-out items), and a verified owner account must exist. The owner setup screen explains the relevant settings without exposing their values.

Still requires client setup: PayPal credentials/merchant/webhook configuration and catalog approval; verified Zelle business details if offered; SMTP sender credentials and domain authentication; owner/support addresses; shipping countries and rate; reviewed tax treatment; stock quantities; approved store policies. Do not copy another store's values. Keep `CHECKOUT_ENABLED=false` until provider and email tests pass. Subscriptions remain disabled.
