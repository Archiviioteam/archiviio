-- Workspace-level sticky notes

create table public.workspace_notes (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workspace_notes_updated_at
  before update on public.workspace_notes
  for each row execute function public.handle_updated_at();

alter table public.workspace_notes enable row level security;
alter table public.workspace_notes force row level security;

create policy workspace_notes_select_own_workspace
  on public.workspace_notes for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy workspace_notes_insert_own_workspace
  on public.workspace_notes for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy workspace_notes_update_own_workspace
  on public.workspace_notes for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy workspace_notes_delete_own_workspace
  on public.workspace_notes for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index workspace_notes_workspace_id_idx
  on public.workspace_notes(workspace_id);

create index workspace_notes_updated_at_idx
  on public.workspace_notes(workspace_id, updated_at desc);

create extension if not exists pg_trgm;

create index workspace_notes_title_trgm_idx
  on public.workspace_notes using gin (title gin_trgm_ops);

create index workspace_notes_content_trgm_idx
  on public.workspace_notes using gin (content gin_trgm_ops);

notify pgrst, 'reload schema';
