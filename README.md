# Inventory & GST Billing PRO

**Black & gold SaaS starter · React + Vite + Supabase · Web + installable mobile web app**

This repository contains the first deployable application foundation for a multi-business inventory and GST billing SaaS product. Each business is an organization (tenant); users access a tenant only through an active membership. PostgreSQL Row Level Security (RLS) is the enforcement layer.

## Included in this first version

- Email/password sign-up and sign-in.
- Phone number OTP sign-in (SMS provider must be configured in Supabase Auth).
- Multiple business workspaces per authenticated user, with a workspace switcher.
- First-time business workspace creation; creator is assigned the `owner` role.
- Black-and-gold responsive interface for desktop, tablet and mobile browsers.
- Product catalogue, pricing, HSN, GST rate, opening stock and low-stock threshold.
- Customer master.
- Sales invoice creation with multiple product lines, discount, intrastate CGST/SGST or interstate IGST selection.
- Sales posting calculates price and GST from database product records, checks stock and updates the stock ledger in one PostgreSQL transaction.
- Purchase posting with stock increase and movement history in one PostgreSQL function.
- Payment register, sales/purchase summaries and output GST summary.
- Business profile settings.
- Tenant-scoped schema, RLS policies, limited database function grants and audit records for sales/purchase posting.

## Important MVP boundaries

This is a **working application starter**, not yet a fully certified accounting/GST product. Before accepting paying customers or using it for tax filings, complete the launch checklist below. In particular:

- GST place-of-supply determination is selected by the operator in this MVP. The app does not yet determine place of supply from verified supplier/customer locations, delivery address, SEZ/export status or special transaction rules.
- GST rate choices are currently 0%, 5%, 12%, 18% and 28%. Confirm applicable rates, HSN/SAC, exemptions, cess and rounding with a GST professional.
- PDF invoice rendering, credit/debit notes, e-invoice/IRN, e-way bills, GSTR exports, input-tax-credit reconciliation and statutory return filing are not implemented.
- Customer receipt records are not yet allocated against invoice balances; the first release records cash movement only.
- Purchase screen supports one product line per bill. The database procedure supports a JSON array of lines and can be used when the UI is expanded.
- Staff invitations, fine-grained roles UI, subscription checkout, billing webhooks, platform operator console, audit-log viewer, automated backups and data export/retention workflows are next milestones.
- There is no demo data by default. Connect a Supabase project to use the app.

## Requirements

- Node.js 20 LTS or later (Node 22 LTS recommended).
- A Supabase project.
- Email provider configured in Supabase Auth.
- An SMS provider configured in Supabase Auth for phone OTP. Phone numbers should use international E.164 format (for India, e.g. `+91XXXXXXXXXX`). Supabase phone authentication is provider-backed; SMS cost, country rules and India DLT obligations must be checked with your provider.

## 1. Create and configure Supabase

1. Create a new Supabase project.
2. Open **SQL Editor** and run the full file `supabase/migrations/202611170001_initial_schema.sql`.
3. In **Project Settings → API**, copy the Project URL and publishable key (or legacy anon key).
4. In **Authentication → URL Configuration**, set the local URL to `http://localhost:5173` and add your production domain before launch.
5. In **Authentication → Sign In / Providers**, enable Email. Decide whether email confirmation is required (recommended for production).
6. Enable Phone and configure a supported SMS provider before relying on phone OTP. Test delivery and rate limits with real Indian mobile numbers.
7. In **Database → Advisors / Security Advisor**, review findings after applying the migration.

Do not put the Supabase `service_role` secret in the browser, `.env` file delivered to customers, Git repository, or a public hosting environment variable exposed to client builds. This app only needs the publishable/anon key in the browser; RLS protects database rows.

## 2. Run locally

```bash
# From this project folder
cp .env.example .env.local
# Edit .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open `http://localhost:5173`.

For a production build:

```bash
npm run build
npm run preview
```

The static production files are written to `dist/`.

## 3. Deploy the web app

Deploy the repository to Vercel, Netlify, Cloudflare Pages or another static hosting provider:

- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables.
- Configure SPA fallback/rewrite so unknown app routes return `index.html` (the current app uses client-side view state, but keep fallback enabled for future routes).
- Add the production domain to Supabase Auth URL configuration.

The responsive site can be installed to a phone's home screen through the browser. A dedicated native iOS/Android app is not part of this starter.

## 4. Multi-tenant data security model

- `organizations` is the tenant/business table.
- `org_memberships` maps Supabase Auth users to organizations and roles.
- Every business-owned record includes `org_id`.
- `is_org_member(org_id)` and `has_org_role(org_id, roles)` are narrow helper functions. They are `SECURITY DEFINER` with an empty pinned `search_path`; execute is revoked from `PUBLIC` and `anon` and granted to authenticated users.
- Tenant policies require active membership for the target `org_id`.
- The `create_business` function creates the organization, owner membership, business settings and starter trial record atomically. It obtains the user ID from `auth.uid()`; the caller cannot assign ownership to another user.
- `create_sales_invoice` validates product ownership and stock, calculates totals using database product prices/GST, creates invoice lines, updates stock and writes movement/payment/audit records in one transaction.
- `create_purchase_bill` verifies product tenant ownership and records the bill, item, stock increase and movement log in one transaction.
- The browser must never receive a service-role secret. Do not disable RLS to make the app work.

### Mandatory tenant-isolation test before production

Create two separate test users, **User A** and **User B**:

1. Sign up both users and create Business A under User A and Business B under User B.
2. Add products/customers/invoices to Business A.
3. Sign in as User B. Verify Business A is not returned by the membership/workspace query and no Business A product, customer, invoice, purchase, payment or stock movement can be selected through the Supabase API.
4. As User B, attempt direct `select`, `insert`, `update` and `delete` calls using Business A's `org_id`; all must fail or return zero rows according to operation/policy.
5. Verify User A can access Business A and cannot access Business B.
6. Add User A as a member of a second test organization only through a trusted owner/admin invitation workflow once that workflow is implemented. Verify the switcher shows only organizations where their active membership exists.
7. Repeat tests with a disabled/suspended membership. Access must stop immediately.

Have a qualified engineer perform a security review and automated RLS tests (for example, Supabase CLI database tests/pgTAP) before launch. The test checklist above is a manual acceptance plan, not a substitute for an automated security suite.

## 5. Database objects

| Table / function | Purpose |
|---|---|
| `profiles` | Public profile mapped to `auth.users` |
| `organizations` | Business tenant and invoice counter |
| `org_memberships` | User-to-business membership and role |
| `business_settings` | Invoice identity and business contact data |
| `products` | SKU, HSN, pricing, GST and stock |
| `customers`, `suppliers` | Party masters |
| `sales_invoices`, `invoice_items` | Sales invoices and immutable line snapshots |
| `purchase_bills`, `purchase_items` | Purchase bills and line snapshots |
| `payments` | Payment register |
| `stock_movements` | Stock ledger |
| `subscriptions` | Per-business SaaS plan state (billing integration pending) |
| `audit_logs` | Key business posting events |
| `create_business()` | Creates a tenant and first owner |
| `create_sales_invoice()` | Atomic GST sales posting |
| `create_purchase_bill()` | Atomic purchase and stock posting |

## 6. Before commercial launch

- Add automated pgTAP RLS tests to CI and verify tenant isolation for every table and RPC.
- Add a secure server/Edge Function layer for invitations, subscription checkout, webhook verification, account deletion and platform support tools.
- Implement subscription entitlements server-side; never trust a plan name sent by the browser.
- Add robust invoice PDF layout, tax validation, customer-state/place-of-supply rules, invoice cancellation and credit/debit notes.
- Add pagination, rate limiting, CAPTCHA on OTP flows, MFA for privileged operators and monitoring/alerts.
- Configure custom SMTP, SMS sender registration, privacy notice, terms, retention/deletion process, incident response and backups/restore tests.
- Run load tests, dependency/security scans, accessibility checks and an independent penetration test.

## Official references

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Phone Login: https://supabase.com/docs/guides/auth/phone-login
- Supabase JavaScript OTP: https://supabase.com/docs/reference/javascript/auth-signinwithotp
- Supabase Database Functions: https://supabase.com/docs/guides/database/functions
- Supabase Production Security Checklist: https://supabase.com/docs/guides/security/production-checklist
