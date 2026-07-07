-- Workspace-level nomenclature rules (title + notes)

create table public.workspace_nomenclature_rules (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workspace_nomenclature_rules_updated_at
  before update on public.workspace_nomenclature_rules
  for each row execute function public.handle_updated_at();

alter table public.workspace_nomenclature_rules enable row level security;
alter table public.workspace_nomenclature_rules force row level security;

create policy workspace_nomenclature_rules_select_own_workspace
  on public.workspace_nomenclature_rules for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy workspace_nomenclature_rules_insert_own_workspace
  on public.workspace_nomenclature_rules for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy workspace_nomenclature_rules_update_own_workspace
  on public.workspace_nomenclature_rules for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy workspace_nomenclature_rules_delete_own_workspace
  on public.workspace_nomenclature_rules for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index workspace_nomenclature_rules_workspace_id_idx
  on public.workspace_nomenclature_rules(workspace_id);

create extension if not exists pg_trgm;

create index workspace_nomenclature_rules_title_trgm_idx
  on public.workspace_nomenclature_rules using gin (title gin_trgm_ops);

notify pgrst, 'reload schema';
