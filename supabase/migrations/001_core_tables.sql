-- Phase 1.1 — Core tables: workspaces, users, projects
-- Each user belongs to one workspace. All data is scoped by workspace_id.

create extension if not exists "uuid-ossp";

-- Workspaces
create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users (profile linked to Supabase auth; one workspace per user)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects (code format: rif#0001)
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  code text not null check (code ~ '^rif#[0-9]{4}$'),
  location text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  unique (workspace_id, code)
);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.handle_updated_at();

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- Helper: resolve authenticated user's workspace (bypasses RLS safely)
create or replace function public.get_user_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.users
  where id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_user_workspace_id() from public;
grant execute on function public.get_user_workspace_id() to authenticated;

-- Row Level Security — workspace isolation
alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;

alter table public.users enable row level security;
alter table public.users force row level security;

alter table public.projects enable row level security;
alter table public.projects force row level security;

-- Workspaces: own workspace only
create policy workspaces_select_own
  on public.workspaces for select to authenticated
  using (id = public.get_user_workspace_id());

create policy workspaces_update_own
  on public.workspaces for update to authenticated
  using (id = public.get_user_workspace_id())
  with check (id = public.get_user_workspace_id());

create policy workspaces_insert_signup
  on public.workspaces for insert to authenticated
  with check (auth.uid() is not null);

-- Users: same workspace only; signup creates first profile in a new workspace
create policy users_select_same_workspace
  on public.users for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy users_insert_signup
  on public.users for insert to authenticated
  with check (
    id = auth.uid()
    and not exists (select 1 from public.users u where u.id = auth.uid())
    and not exists (select 1 from public.users u where u.workspace_id = workspace_id)
  );

create policy users_update_own
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and workspace_id = public.get_user_workspace_id()
  );

-- Projects: workspace-scoped CRUD
create policy projects_select_own_workspace
  on public.projects for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy projects_insert_own_workspace
  on public.projects for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy projects_update_own_workspace
  on public.projects for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy projects_delete_own_workspace
  on public.projects for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

-- Indexes
create index users_workspace_id_idx on public.users(workspace_id);
create index projects_workspace_id_idx on public.projects(workspace_id);
create index projects_code_idx on public.projects(code);
