# Security notes

- The browser contains only the Supabase publishable/anon key. Never put a `service_role` key in Vite `VITE_*` variables.
- RLS must remain enabled for every tenant-owned table. Do not solve authorization errors by disabling RLS.
- Tenant ID values from the browser are untrusted. Each query is protected by database RLS; transactional invoice/purchase functions verify membership again.
- Do not expose database secrets, SMTP credentials, SMS provider credentials, payment gateway secrets or webhook signing secrets in frontend code.
- Before public launch, run automated positive and negative tenant-isolation tests for every table and RPC and arrange an independent security review.
- Authentication delivery is only as strong as the configured email/SMS providers. Enable rate limits/CAPTCHA and use short OTP expiry as appropriate.
- Treat invoices and payment records as financial records. Design append-only correction/reversal flows rather than silently editing posted transactions.
