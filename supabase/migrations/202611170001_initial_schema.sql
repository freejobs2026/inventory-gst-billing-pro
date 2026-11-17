-- Inventory & GST Billing PRO — initial multi-tenant schema
-- Apply this migration to a NEW Supabase project using the SQL Editor or Supabase CLI.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  gstin text check (gstin is null or gstin = '' or gstin ~ '^[0-9A-Z]{15}$'),
  state text not null default 'Karnataka',
  currency text not null default 'INR' check (currency = 'INR'),
  invoice_sequence bigint not null default 0 check (invoice_sequence >= 0),
  purchase_sequence bigint not null default 0 check (purchase_sequence >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','admin','manager','staff','viewer')),
  status text not null default 'active' check (status in ('invited','active','suspended')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  legal_name text,
  address text,
  phone text,
  email text,
  invoice_prefix text not null default 'INV',
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sku text,
  name text not null check (char_length(name) between 1 and 200),
  category text,
  hsn_code text,
  unit text not null default 'pcs',
  purchase_price numeric(14,2) not null default 0 check (purchase_price >= 0),
  sale_price numeric(14,2) not null default 0 check (sale_price >= 0),
  gst_rate numeric(5,2) not null default 0 check (gst_rate in (0, 5, 12, 18, 28)),
  stock_qty numeric(14,3) not null default 0 check (stock_qty >= 0),
  low_stock_threshold numeric(14,3) not null default 0 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, sku),
  unique (org_id, id)
);
create index if not exists products_org_name_idx on public.products(org_id, name);
create index if not exists products_org_active_idx on public.products(org_id, is_active);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  gstin text,
  state text,
  billing_address text,
  shipping_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id)
);
create index if not exists customers_org_name_idx on public.customers(org_id, name);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  gstin text,
  state text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id)
);

create table if not exists public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invoice_number text not null,
  invoice_date date not null default current_date,
  customer_id uuid,
  customer_name text,
  supply_type text not null check (supply_type in ('intrastate','interstate')),
  taxable_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  cgst_amount numeric(14,2) not null default 0,
  sgst_amount numeric(14,2) not null default 0,
  igst_amount numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  balance_due numeric(14,2) not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('paid','partial','unpaid')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, invoice_number),
  unique (org_id, id),
  foreign key (org_id, customer_id) references public.customers(org_id, id) on delete restrict,
  check (amount_paid >= 0 and balance_due >= 0)
);
create index if not exists sales_invoices_org_date_idx on public.sales_invoices(org_id, invoice_date desc);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null,
  product_id uuid,
  product_name text not null,
  hsn_code text,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  gst_rate numeric(5,2) not null default 0,
  taxable_amount numeric(14,2) not null,
  gst_amount numeric(14,2) not null,
  cgst_amount numeric(14,2) not null default 0,
  sgst_amount numeric(14,2) not null default 0,
  igst_amount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null,
  created_at timestamptz not null default now(),
  foreign key (org_id, invoice_id) references public.sales_invoices(org_id, id) on delete cascade,
  foreign key (org_id, product_id) references public.products(org_id, id) on delete restrict
);
create index if not exists invoice_items_org_invoice_idx on public.invoice_items(org_id, invoice_id);

create table if not exists public.purchase_bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  bill_number text,
  bill_date date not null default current_date,
  supplier_id uuid,
  supplier_name text,
  taxable_amount numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('paid','partial','unpaid')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, bill_number),
  foreign key (org_id, supplier_id) references public.suppliers(org_id, id) on delete restrict
);
create index if not exists purchase_bills_org_date_idx on public.purchase_bills(org_id, bill_date desc);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  purchase_bill_id uuid not null,
  product_id uuid,
  product_name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  gst_rate numeric(5,2) not null default 0,
  taxable_amount numeric(14,2) not null,
  gst_amount numeric(14,2) not null,
  line_total numeric(14,2) not null,
  created_at timestamptz not null default now(),
  foreign key (org_id, purchase_bill_id) references public.purchase_bills(org_id, id) on delete cascade,
  foreign key (org_id, product_id) references public.products(org_id, id) on delete restrict
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid,
  payment_type text not null check (payment_type in ('receipt','supplier_payment')),
  party_name text not null,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text not null default 'cash' check (payment_method in ('cash','upi','bank_transfer','card','cheque','other')),
  payment_date date not null default current_date,
  reference_no text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (org_id, invoice_id) references public.sales_invoices(org_id, id) on delete restrict
);
create index if not exists payments_org_date_idx on public.payments(org_id, payment_date desc);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null,
  movement_type text not null check (movement_type in ('opening','purchase','sale','adjustment','return_in','return_out')),
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  unit_cost numeric(14,2) not null default 0,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (org_id, product_id) references public.products(org_id, id) on delete restrict
);
create index if not exists stock_movements_org_product_idx on public.stock_movements(org_id, product_id, created_at desc);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  plan_code text not null default 'starter' check (plan_code in ('starter','professional','enterprise')),
  status text not null default 'trial' check (status in ('trial','active','past_due','cancelled','expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_org_created_idx on public.audit_logs(org_id, created_at desc);

-- Updated timestamp trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger business_settings_set_updated_at before update on public.business_settings for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger suppliers_set_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
create trigger sales_invoices_set_updated_at before update on public.sales_invoices for each row execute function public.set_updated_at();
create trigger purchase_bills_set_updated_at before update on public.purchase_bills for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

-- Create a public profile for each newly registered Auth user.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, phone, display_name)
  values (new.id, new.email, new.phone, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email, phone = excluded.phone;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- Tenant helpers. SECURITY DEFINER is narrowly scoped and the search_path is pinned empty.
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.org_memberships m
    where m.org_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.org_memberships m
    where m.org_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

revoke all on function public.is_org_member(uuid) from public, anon;
revoke all on function public.has_org_role(uuid, text[]) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

-- Workspace creation is atomic: the caller becomes the first owner.
create or replace function public.create_business(p_name text, p_state text default 'Karnataka', p_gstin text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_org_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(trim(p_name)) < 2 then raise exception 'Business name must contain at least 2 characters'; end if;
  if p_gstin is not null and trim(p_gstin) <> '' and trim(p_gstin) !~ '^[0-9A-Z]{15}$' then raise exception 'GSTIN must contain 15 uppercase letters or digits'; end if;

  insert into public.organizations (name, owner_user_id, state, gstin)
  values (trim(p_name), v_user_id, coalesce(nullif(trim(p_state), ''), 'Karnataka'), nullif(trim(p_gstin), ''))
  returning id into v_org_id;

  insert into public.org_memberships (org_id, user_id, role, status)
  values (v_org_id, v_user_id, 'owner', 'active');

  insert into public.business_settings (org_id, legal_name)
  values (v_org_id, trim(p_name));

  insert into public.subscriptions (org_id, plan_code, status)
  values (v_org_id, 'starter', 'trial');

  return v_org_id;
end;
$$;
revoke all on function public.create_business(text, text, text) from public, anon;
grant execute on function public.create_business(text, text, text) to authenticated;

-- Atomic sales posting. Price and GST are read from tenant-owned product rows, not browser input.
create or replace function public.create_sales_invoice(
  p_org_id uuid,
  p_customer_id uuid,
  p_supply_type text,
  p_items jsonb,
  p_paid_amount numeric default 0,
  p_payment_method text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(14,3);
  v_discount numeric(5,2);
  v_taxable numeric(14,2);
  v_gst numeric(14,2);
  v_discount_total numeric(14,2) := 0;
  v_taxable_total numeric(14,2) := 0;
  v_gst_total numeric(14,2) := 0;
  v_cgst_total numeric(14,2) := 0;
  v_sgst_total numeric(14,2) := 0;
  v_igst_total numeric(14,2) := 0;
  v_grand_total numeric(14,2);
  v_seq bigint;
  v_invoice_no text;
  v_invoice_id uuid;
  v_customer_name text;
  v_paid numeric(14,2);
  v_status text;
begin
  if not public.is_org_member(p_org_id) then raise exception 'You do not have access to this business'; end if;
  if p_supply_type not in ('intrastate','interstate') then raise exception 'Invalid supply type'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Add at least one product to the invoice'; end if;
  if p_customer_id is not null then
    select c.name into v_customer_name from public.customers c where c.id = p_customer_id and c.org_id = p_org_id;
    if v_customer_name is null then raise exception 'Customer does not belong to this business'; end if;
  else
    v_customer_name := 'Walk-in customer';
  end if;

  -- First pass locks product rows and validates stock before any posting.
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product from public.products p
    where p.id = (v_item ->> 'product_id')::uuid and p.org_id = p_org_id and p.is_active = true
    for update;
    if not found then raise exception 'A selected product is unavailable'; end if;
    v_qty := (v_item ->> 'quantity')::numeric;
    v_discount := coalesce((v_item ->> 'discount_percent')::numeric, 0);
    if v_qty <= 0 then raise exception 'Quantity must be greater than zero'; end if;
    if v_discount < 0 or v_discount > 100 then raise exception 'Discount must be between 0 and 100'; end if;
    if v_product.stock_qty < v_qty then raise exception 'Insufficient stock for % (available: %)', v_product.name, v_product.stock_qty; end if;
    v_discount_total := v_discount_total + round(v_qty * v_product.sale_price * v_discount / 100, 2);
    v_taxable := round(v_qty * v_product.sale_price * (1 - v_discount / 100), 2);
    v_gst := round(v_taxable * v_product.gst_rate / 100, 2);
    v_taxable_total := v_taxable_total + v_taxable;
    v_gst_total := v_gst_total + v_gst;
    if p_supply_type = 'interstate' then v_igst_total := v_igst_total + v_gst;
    else v_cgst_total := v_cgst_total + round(v_gst / 2, 2); v_sgst_total := v_sgst_total + (v_gst - round(v_gst / 2, 2)); end if;
  end loop;

  v_grand_total := v_taxable_total + v_gst_total;
  v_paid := coalesce(p_paid_amount, 0);
  if v_paid < 0 or v_paid > v_grand_total then raise exception 'Paid amount must be between zero and invoice total'; end if;
  if v_paid > 0 and coalesce(p_payment_method, '') not in ('cash','upi','bank_transfer','card','cheque','other') then raise exception 'Select a valid payment method'; end if;

  update public.organizations set invoice_sequence = invoice_sequence + 1 where id = p_org_id returning invoice_sequence into v_seq;
  v_invoice_no := 'INV-' || to_char(current_date, 'YYYY') || '-' || lpad(v_seq::text, 5, '0');
  v_status := case when v_paid >= v_grand_total then 'paid' when v_paid > 0 then 'partial' else 'unpaid' end;

  insert into public.sales_invoices (
    org_id, invoice_number, invoice_date, customer_id, customer_name, supply_type,
    taxable_amount, discount_amount, gst_amount, cgst_amount, sgst_amount, igst_amount,
    grand_total, amount_paid, balance_due, payment_status, created_by
  ) values (
    p_org_id, v_invoice_no, current_date, p_customer_id, v_customer_name, p_supply_type,
    v_taxable_total, v_discount_total, v_gst_total, v_cgst_total, v_sgst_total, v_igst_total,
    v_grand_total, v_paid, v_grand_total - v_paid, v_status, (select auth.uid())
  ) returning id into v_invoice_id;

  -- Second pass inserts immutable line snapshots and posts stock movements.
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product from public.products p
    where p.id = (v_item ->> 'product_id')::uuid and p.org_id = p_org_id
    for update;
    v_qty := (v_item ->> 'quantity')::numeric;
    v_discount := coalesce((v_item ->> 'discount_percent')::numeric, 0);
    v_taxable := round(v_qty * v_product.sale_price * (1 - v_discount / 100), 2);
    v_gst := round(v_taxable * v_product.gst_rate / 100, 2);
    insert into public.invoice_items (
      org_id, invoice_id, product_id, product_name, hsn_code, quantity, unit_price,
      discount_percent, gst_rate, taxable_amount, gst_amount, cgst_amount, sgst_amount, igst_amount, line_total
    ) values (
      p_org_id, v_invoice_id, v_product.id, v_product.name, v_product.hsn_code, v_qty, v_product.sale_price,
      v_discount, v_product.gst_rate, v_taxable, v_gst,
      case when p_supply_type = 'intrastate' then round(v_gst / 2, 2) else 0 end,
      case when p_supply_type = 'intrastate' then v_gst - round(v_gst / 2, 2) else 0 end,
      case when p_supply_type = 'interstate' then v_gst else 0 end,
      v_taxable + v_gst
    );
    update public.products set stock_qty = stock_qty - v_qty where id = v_product.id and org_id = p_org_id;
    insert into public.stock_movements (org_id, product_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, created_by)
    values (p_org_id, v_product.id, 'sale', -v_qty, v_product.purchase_price, 'sales_invoice', v_invoice_id, (select auth.uid()));
  end loop;

  if v_paid > 0 then
    insert into public.payments (org_id, invoice_id, payment_type, party_name, amount, payment_method, payment_date, created_by)
    values (p_org_id, v_invoice_id, 'receipt', v_customer_name, v_paid, p_payment_method, current_date, (select auth.uid()));
  end if;

  insert into public.audit_logs (org_id, actor_user_id, action, entity_type, entity_id, details)
  values (p_org_id, (select auth.uid()), 'created', 'sales_invoice', v_invoice_id, jsonb_build_object('invoice_number', v_invoice_no, 'grand_total', v_grand_total));

  return jsonb_build_object('id', v_invoice_id, 'invoice_number', v_invoice_no, 'grand_total', v_grand_total, 'payment_status', v_status);
end;
$$;
revoke all on function public.create_sales_invoice(uuid, uuid, text, jsonb, numeric, text) from public, anon;
grant execute on function public.create_sales_invoice(uuid, uuid, text, jsonb, numeric, text) to authenticated;

-- Atomic purchase posting: quantity, rate and GST are supplied by the signed-in business operator;
-- the function verifies the product belongs to that same organization.
create or replace function public.create_purchase_bill(
  p_org_id uuid,
  p_supplier_name text,
  p_items jsonb,
  p_bill_date date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(14,3);
  v_rate numeric(14,2);
  v_gst_rate numeric(5,2);
  v_taxable numeric(14,2);
  v_gst numeric(14,2);
  v_taxable_total numeric(14,2) := 0;
  v_gst_total numeric(14,2) := 0;
  v_bill_id uuid;
  v_bill_no text;
  v_count bigint;
begin
  if not public.is_org_member(p_org_id) then raise exception 'You do not have access to this business'; end if;
  if coalesce(trim(p_supplier_name), '') = '' then raise exception 'Supplier name is required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Add at least one product to the purchase'; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product from public.products p
    where p.id = (v_item ->> 'product_id')::uuid and p.org_id = p_org_id and p.is_active = true
    for update;
    if not found then raise exception 'A selected product is unavailable'; end if;
    v_qty := (v_item ->> 'quantity')::numeric;
    v_rate := (v_item ->> 'unit_price')::numeric;
    v_gst_rate := coalesce((v_item ->> 'gst_rate')::numeric, v_product.gst_rate);
    if v_qty <= 0 or v_rate < 0 then raise exception 'Invalid purchase quantity or rate'; end if;
    if v_gst_rate not in (0,5,12,18,28) then raise exception 'Invalid GST rate'; end if;
    v_taxable := round(v_qty * v_rate, 2);
    v_gst := round(v_taxable * v_gst_rate / 100, 2);
    v_taxable_total := v_taxable_total + v_taxable;
    v_gst_total := v_gst_total + v_gst;
  end loop;

  update public.organizations set purchase_sequence = purchase_sequence + 1 where id = p_org_id returning purchase_sequence into v_count;
  v_bill_no := 'PUR-' || to_char(coalesce(p_bill_date, current_date), 'YYYY') || '-' || lpad(v_count::text, 5, '0');
  insert into public.purchase_bills (org_id, bill_number, bill_date, supplier_name, taxable_amount, gst_amount, grand_total, created_by)
  values (p_org_id, v_bill_no, coalesce(p_bill_date, current_date), trim(p_supplier_name), v_taxable_total, v_gst_total, v_taxable_total + v_gst_total, (select auth.uid()))
  returning id into v_bill_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product from public.products p
    where p.id = (v_item ->> 'product_id')::uuid and p.org_id = p_org_id
    for update;
    v_qty := (v_item ->> 'quantity')::numeric;
    v_rate := (v_item ->> 'unit_price')::numeric;
    v_gst_rate := coalesce((v_item ->> 'gst_rate')::numeric, v_product.gst_rate);
    v_taxable := round(v_qty * v_rate, 2);
    v_gst := round(v_taxable * v_gst_rate / 100, 2);
    insert into public.purchase_items (org_id, purchase_bill_id, product_id, product_name, quantity, unit_price, gst_rate, taxable_amount, gst_amount, line_total)
    values (p_org_id, v_bill_id, v_product.id, v_product.name, v_qty, v_rate, v_gst_rate, v_taxable, v_gst, v_taxable + v_gst);
    update public.products set stock_qty = stock_qty + v_qty, purchase_price = v_rate where id = v_product.id and org_id = p_org_id;
    insert into public.stock_movements (org_id, product_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, created_by)
    values (p_org_id, v_product.id, 'purchase', v_qty, v_rate, 'purchase_bill', v_bill_id, (select auth.uid()));
  end loop;

  insert into public.audit_logs (org_id, actor_user_id, action, entity_type, entity_id, details)
  values (p_org_id, (select auth.uid()), 'created', 'purchase_bill', v_bill_id, jsonb_build_object('bill_number', v_bill_no, 'grand_total', v_taxable_total + v_gst_total));
  return jsonb_build_object('id', v_bill_id, 'bill_number', v_bill_no, 'grand_total', v_taxable_total + v_gst_total);
end;
$$;
revoke all on function public.create_purchase_bill(uuid, text, jsonb, date) from public, anon;
grant execute on function public.create_purchase_bill(uuid, text, jsonb, date) to authenticated;

-- Enable RLS on every table in the exposed public schema.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_memberships enable row level security;
alter table public.business_settings enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales_invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.purchase_bills enable row level security;
alter table public.purchase_items enable row level security;
alter table public.payments enable row level security;
alter table public.stock_movements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;

-- Explicit grants: no anonymous access to business data.
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.organizations to authenticated;
grant update (name, gstin, state) on public.organizations to authenticated;
grant select on public.org_memberships to authenticated;
grant select, insert, update, delete on public.business_settings to authenticated;
grant select, insert on public.products to authenticated;
grant update (sku, name, category, hsn_code, unit, purchase_price, sale_price, gst_rate, low_stock_threshold, is_active) on public.products to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
grant select on public.sales_invoices to authenticated;
grant select on public.invoice_items to authenticated;
grant select on public.purchase_bills to authenticated;
grant select on public.purchase_items to authenticated;
grant select, insert on public.payments to authenticated;
grant select, insert on public.stock_movements to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.audit_logs to authenticated;

-- Profile: a user can only read/update their own profile.
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Workspace and membership administration.
create policy organizations_select_member on public.organizations for select to authenticated using (public.is_org_member(id));
create policy organizations_update_admin on public.organizations for update to authenticated using (public.has_org_role(id, array['owner','admin'])) with check (public.has_org_role(id, array['owner','admin']));
create policy organizations_delete_owner on public.organizations for delete to authenticated using (public.has_org_role(id, array['owner']));

create policy memberships_select_self_or_admin on public.org_memberships for select to authenticated using (user_id = (select auth.uid()) or public.has_org_role(org_id, array['owner','admin']));
-- Membership changes are intentionally not exposed directly to browsers. Add invitations through a trusted server function.

-- All business records are scoped to an active membership in their organization.
create policy business_settings_tenant_all on public.business_settings for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy products_tenant_all on public.products for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy customers_tenant_all on public.customers for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy suppliers_tenant_all on public.suppliers for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy sales_invoices_tenant_select on public.sales_invoices for select to authenticated using (public.is_org_member(org_id));
create policy invoice_items_tenant_select on public.invoice_items for select to authenticated using (public.is_org_member(org_id));
create policy purchase_bills_tenant_select on public.purchase_bills for select to authenticated using (public.is_org_member(org_id));
create policy purchase_items_tenant_select on public.purchase_items for select to authenticated using (public.is_org_member(org_id));
create policy payments_tenant_all on public.payments for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy stock_movements_tenant_select on public.stock_movements for select to authenticated using (public.is_org_member(org_id));
create policy stock_movements_opening_insert on public.stock_movements for insert to authenticated with check (public.is_org_member(org_id) and movement_type = 'opening' and quantity_delta > 0);
create policy subscriptions_read_tenant on public.subscriptions for select to authenticated using (public.is_org_member(org_id));
create policy audit_logs_read_tenant on public.audit_logs for select to authenticated using (public.is_org_member(org_id));

-- Prevent clients from changing subscription rows or other tenants' user membership.
-- Service-role operations for billing must be performed only in a trusted server/edge function.
