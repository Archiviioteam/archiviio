-- Phase 6 — project_nomenclatures (project-level nomenclature content)
-- Requires 001_core_tables.sql

create table public.project_nomenclatures (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (project_id)
);

create trigger project_nomenclatures_updated_at
  before update on public.project_nomenclatures
  for each row execute function public.handle_updated_at();

alter table public.project_nomenclatures enable row level security;
alter table public.project_nomenclatures force row level security;

create policy project_nomenclatures_select_own_workspace
  on public.project_nomenclatures for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy project_nomenclatures_insert_own_workspace
  on public.project_nomenclatures for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy project_nomenclatures_update_own_workspace
  on public.project_nomenclatures for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy project_nomenclatures_delete_own_workspace
  on public.project_nomenclatures for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index project_nomenclatures_workspace_id_idx on public.project_nomenclatures(workspace_id);
create index project_nomenclatures_project_id_idx on public.project_nomenclatures(project_id);
