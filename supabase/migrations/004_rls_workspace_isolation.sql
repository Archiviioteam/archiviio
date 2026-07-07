-- Phase 1.3 — RLS workspace isolation
-- Users can only access data belonging to their own workspace.

-- Harden workspace resolver
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

-- Force RLS on core tables
alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;

alter table public.users enable row level security;
alter table public.users force row level security;

alter table public.projects enable row level security;
alter table public.projects force row level security;

-- Drop legacy policies (core)
drop policy if exists "Users can view their workspace" on public.workspaces;
drop policy if exists "Users can update their workspace" on public.workspaces;
drop policy if exists "Authenticated users can create workspaces" on public.workspaces;
drop policy if exists workspaces_select_own on public.workspaces;
drop policy if exists workspaces_update_own on public.workspaces;
drop policy if exists workspaces_insert_signup on public.workspaces;

drop policy if exists "Users can view workspace members" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists users_select_same_workspace on public.users;
drop policy if exists users_insert_signup on public.users;
drop policy if exists users_update_own on public.users;

drop policy if exists "Workspace scoped select" on public.projects;
drop policy if exists "Workspace scoped insert" on public.projects;
drop policy if exists "Workspace scoped update" on public.projects;
drop policy if exists "Workspace scoped delete" on public.projects;
drop policy if exists projects_select_own_workspace on public.projects;
drop policy if exists projects_insert_own_workspace on public.projects;
drop policy if exists projects_update_own_workspace on public.projects;
drop policy if exists projects_delete_own_workspace on public.projects;

-- Workspaces
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

-- Users
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

-- Projects
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

-- Module tables (no-op if 002 not applied yet)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'contacts', 'suppliers', 'documents', 'tasks', 'nomenclature_rules'
  ]
  loop
    if to_regclass('public.' || tbl) is not null then
      execute format(
        'alter table public.%I enable row level security',
        tbl
      );
      execute format(
        'alter table public.%I force row level security',
        tbl
      );

      execute format(
        'drop policy if exists %I on public.%I',
        'Workspace scoped select', tbl
      );
      execute format(
        'drop policy if exists %I on public.%I',
        'Workspace scoped insert', tbl
      );
      execute format(
        'drop policy if exists %I on public.%I',
        'Workspace scoped update', tbl
      );
      execute format(
        'drop policy if exists %I on public.%I',
        'Workspace scoped delete', tbl
      );
      execute format(
        'drop policy if exists %I on public.%I',
        tbl || '_select_own_workspace', tbl
      );
      execute format(
        'drop policy if exists %I on public.%I',
        tbl || '_insert_own_workspace', tbl
      );
      execute format(
        'drop policy if exists %I on public.%I',
        tbl || '_update_own_workspace', tbl
      );
      execute format(
        'drop policy if exists %I on public.%I',
        tbl || '_delete_own_workspace', tbl
      );

      execute format(
        'create policy %I on public.%I for select to authenticated using (workspace_id = public.get_user_workspace_id())',
        tbl || '_select_own_workspace', tbl
      );
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (workspace_id = public.get_user_workspace_id())',
        tbl || '_insert_own_workspace', tbl
      );
      execute format(
        'create policy %I on public.%I for update to authenticated using (workspace_id = public.get_user_workspace_id()) with check (workspace_id = public.get_user_workspace_id())',
        tbl || '_update_own_workspace', tbl
      );
      execute format(
        'create policy %I on public.%I for delete to authenticated using (workspace_id = public.get_user_workspace_id())',
        tbl || '_delete_own_workspace', tbl
      );
    end if;
  end loop;
end;
$$;
