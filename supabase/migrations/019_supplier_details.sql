-- Phase 19 — Supplier company details and multi-select company types

alter table public.suppliers
  add column if not exists company text,
  add column if not exists contact_name text,
  add column if not exists website text,
  add column if not exists company_types text[] not null default '{}';

update public.suppliers
set company = name
where company is null;

update public.suppliers
set company_types = array[category]
where category is not null
  and btrim(category) <> ''
  and company_types = '{}';

update public.suppliers
set name = company
where company is not null;

alter table public.suppliers
  alter column company set not null;

create index if not exists suppliers_company_types_idx
  on public.suppliers using gin (company_types);

notify pgrst, 'reload schema';
