# Validation record

October 5, 2026 · Build 0.2.0 · Node 24.19.0

- `npm test`: 15 automated checks passed, zero failures.
- `npm run build`: production Vite bundle generated successfully.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities at validation time. This is not a security certification.

Checks use real local HTTP and temporary SQLite databases with mocked PayPal and SMTP responses. Interface interactions use jsdom; they do not verify actual browser rendering or the PayPal popup. Online SQLite backup and restoration are exercised using a separate temporary database.

Expected rejected requests and a simulated payment network failure are intentionally exercised. No actual money moved; no real email was sent. No client credentials, deployment, domain configuration or production data were used. Docker build, real PayPal sandbox/live transactions, email delivery, hosted restart/restore, visual/browser/accessibility testing and production release remain outstanding.

No default customer/owner password or assumed inventory is included. The packaged dist bundle is a convenience build; rebuild it after any source change.
