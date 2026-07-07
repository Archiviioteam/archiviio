-- Phase 12.1 — Universal activity timeline

create table public.activity_events (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.activity_events enable row level security;
alter table public.activity_events force row level security;

create policy activity_events_select_own_workspace
  on public.activity_events for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy activity_events_insert_own_workspace
  on public.activity_events for insert to authenticated
  with check (
    workspace_id = public.get_user_workspace_id()
    and actor_id = auth.uid()
  );

create index activity_events_workspace_created_idx
  on public.activity_events (workspace_id, created_at desc);

create index activity_events_project_created_idx
  on public.activity_events (project_id, created_at desc)
  where project_id is not null;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
