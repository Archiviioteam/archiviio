-- Phase 20 — Link suppliers to projects (many-to-many)

create table public.project_suppliers (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, supplier_id)
);

alter table public.project_suppliers enable row level security;
alter table public.project_suppliers force row level security;

create policy project_suppliers_select_own_workspace
  on public.project_suppliers for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy project_suppliers_insert_own_workspace
  on public.project_suppliers for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy project_suppliers_delete_own_workspace
  on public.project_suppliers for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index project_suppliers_project_id_idx
  on public.project_suppliers(project_id);

create index project_suppliers_supplier_id_idx
  on public.project_suppliers(supplier_id);

create index project_suppliers_workspace_id_idx
  on public.project_suppliers(workspace_id);

notify pgrst, 'reload schema';
