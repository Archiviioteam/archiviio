-- Phase 9.1 — Document management: documents + document_versions
-- Requires 002_module_tables.sql (existing documents table)

-- Evolve documents: file_url, file_size, uploaded_by; drop legacy columns
alter table public.documents rename column file_path to file_url;

alter table public.documents
  add column file_size bigint,
  add column uploaded_by uuid references public.users(id) on delete set null;

alter table public.documents drop column if exists tags;

drop trigger if exists documents_updated_at on public.documents;
alter table public.documents drop column if exists updated_at;

-- Version history: each upload keeps its own file_url (no in-place replacement)
create table public.document_versions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  file_url text not null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

alter table public.document_versions enable row level security;
alter table public.document_versions force row level security;

-- Workspace isolation via parent document
create policy document_versions_select_own_workspace
  on public.document_versions for select to authenticated
  using (
    exists (
      select 1
      from public.documents d
      where d.id = document_id
        and d.workspace_id = public.get_user_workspace_id()
    )
  );

create policy document_versions_insert_own_workspace
  on public.document_versions for insert to authenticated
  with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_id
        and d.workspace_id = public.get_user_workspace_id()
    )
  );

create policy document_versions_update_own_workspace
  on public.document_versions for update to authenticated
  using (
    exists (
      select 1
      from public.documents d
      where d.id = document_id
        and d.workspace_id = public.get_user_workspace_id()
    )
  )
  with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_id
        and d.workspace_id = public.get_user_workspace_id()
    )
  );

create policy document_versions_delete_own_workspace
  on public.document_versions for delete to authenticated
  using (
    exists (
      select 1
      from public.documents d
      where d.id = document_id
        and d.workspace_id = public.get_user_workspace_id()
    )
  );

create index documents_project_id_idx on public.documents(project_id);
create index documents_uploaded_by_idx on public.documents(uploaded_by);
create index document_versions_document_id_idx on public.document_versions(document_id);
