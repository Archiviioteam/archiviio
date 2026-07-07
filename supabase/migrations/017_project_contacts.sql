-- Phase 17 — Link contacts to projects (many-to-many)

create table public.project_contacts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, contact_id)
);

alter table public.project_contacts enable row level security;
alter table public.project_contacts force row level security;

create policy project_contacts_select_own_workspace
  on public.project_contacts for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy project_contacts_insert_own_workspace
  on public.project_contacts for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy project_contacts_delete_own_workspace
  on public.project_contacts for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index project_contacts_project_id_idx
  on public.project_contacts(project_id);

create index project_contacts_contact_id_idx
  on public.project_contacts(contact_id);

create index project_contacts_workspace_id_idx
  on public.project_contacts(workspace_id);

notify pgrst, 'reload schema';
