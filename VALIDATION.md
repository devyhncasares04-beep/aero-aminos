# Validation record

October 5, 2026 · Node 24.19.0

- `npm test`: 18 automated checks passed, zero failures.
- `npm run build`: production Vite bundle generated successfully.
- Render Docker build and deployment succeeded. Runtime release: `24a1898d0a2140ce00398c262a0c9501306dfae5`.
- Hosted desktop browser: landing page and brand artwork render; featured NAD+ link opens its 500 mg / $30 detail page; add-to-bag and remove work; the bag displays the correct subtotal and closed-checkout state; client-care FAQ expands correctly. No real order or charge was placed.

Automated checks use real local HTTP and temporary SQLite databases with mocked PayPal and SMTP responses. They cover exact catalog prices, server-authoritative totals, stock reservations, role/ownership/CSRF boundaries, Zelle confirmation, PayPal amount/merchant binding and idempotency, uncertain capture reconciliation, signed webhook/refund handling, verification and recovery, durable email retries, and backup restoration. Interface checks use jsdom for navigation, search, product details, cart, safe policy rendering, approved destination choices, and password-manager autocomplete.

Expected rejected requests and a simulated payment network failure are intentionally exercised. No actual money moved; no real email was sent. The Render production dependency install reported zero vulnerabilities at build time; this is not a security certification.

Still required before sales launch: client credentials and confirmed business settings, real PayPal sandbox tests followed by an approved live checkout, email delivery/domain verification, actual inventory, first owner setup, published policies, hosted recovery rehearsal, and mobile-device/browser accessibility checks. Responsive styles are implemented but jsdom does not validate visual layout or the PayPal popup. Checkout stays disabled pending completion.

No default customer/owner password or assumed inventory is included. Subscriptions are on hold.
