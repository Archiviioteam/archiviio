-- Phase 28 — Supplier material library flag

alter table public.suppliers
  add column if not exists in_material_library boolean not null default false;

create index if not exists suppliers_in_material_library_idx
  on public.suppliers (in_material_library);

notify pgrst, 'reload schema';
