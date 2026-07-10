-- Project referents (members) and per-task assignee

create table public.project_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

alter table public.project_members enable row level security;
alter table public.project_members force row level security;

create policy project_members_select_own_workspace
  on public.project_members for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy project_members_insert_own_workspace
  on public.project_members for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy project_members_delete_own_workspace
  on public.project_members for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index project_members_project_id_idx
  on public.project_members(project_id);

create index project_members_user_id_idx
  on public.project_members(user_id);

create index project_members_workspace_id_idx
  on public.project_members(workspace_id);

alter table public.tasks
  add column if not exists assignee_user_id uuid references public.users(id) on delete set null;

create index if not exists tasks_assignee_user_id_idx
  on public.tasks(assignee_user_id);

notify pgrst, 'reload schema';
