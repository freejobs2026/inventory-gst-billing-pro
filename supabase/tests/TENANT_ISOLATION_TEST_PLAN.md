# Tenant-isolation acceptance test plan

Run this plan against a dedicated staging Supabase project before launch. Use two unrelated authenticated test users and two organizations. Never run destructive security tests against production customer data.

## Positive checks

- An active owner can read their organization and all records with their `org_id`.
- An active member can read their organization and its allowed business data.
- An owner/admin can update organization name, GSTIN and state.
- Product insert and product metadata update work within the caller's own organization.
- `create_sales_invoice` succeeds only for a member; it snapshots the DB product's current sale price/HSN/GST and updates stock.
- `create_purchase_bill` succeeds only for a member and posts the purchase item, stock increase and stock movement together.

## Negative checks

For User B, attempt each operation with User A's organization ID and record IDs:

- Select products, customers, suppliers, sales invoices, invoice items, purchase bills, purchase items, payments, stock movements, subscriptions and audit logs.
- Insert or update a product with User A's `org_id`.
- Archive a product from User A's organization.
- Create a sales invoice or purchase bill for User A's organization through either RPC.
- Insert an opening stock movement for User A's organization.
- Read User A's organization membership unless User B is an owner/admin of that same organization.
- Update invoice or purchase rows directly from the browser (these tables are intentionally read-only to authenticated clients; use the posting RPCs).

Expected: cross-tenant reads return no rows (or are denied) and writes/RPCs fail with an authorization error. Also test a suspended membership: all tenant access must stop.

## Required automated follow-up

Translate these cases into pgTAP tests and run `supabase test db` in CI. This document is a manual test plan only and does not claim those tests have been executed.
