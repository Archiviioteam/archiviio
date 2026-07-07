-- Archiviio full schema
-- Paste and run once in Supabase SQL Editor (project: archiviio)
-- Source: supabase/migrations/001..024

-- ========================================================================
-- 001_core_tables.sql
-- ========================================================================

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

-- ========================================================================
-- 002_module_tables.sql
-- ========================================================================

-- Phase 2+ — Module tables (contacts, suppliers, documents, tasks, nomenclature)
-- Requires 001_core_tables.sql

-- Contacts
create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Suppliers
create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  file_path text not null,
  file_type text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nomenclature rules (project-level naming conventions)
create table public.nomenclature_rules (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  pattern text not null,
  description text,
  created_at timestamptz not null default now()
);

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function public.handle_updated_at();

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.handle_updated_at();

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

alter table public.contacts enable row level security;
alter table public.contacts force row level security;
alter table public.suppliers enable row level security;
alter table public.suppliers force row level security;
alter table public.documents enable row level security;
alter table public.documents force row level security;
alter table public.tasks enable row level security;
alter table public.tasks force row level security;
alter table public.nomenclature_rules enable row level security;
alter table public.nomenclature_rules force row level security;

create policy contacts_select_own_workspace
  on public.contacts for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy contacts_insert_own_workspace
  on public.contacts for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy contacts_update_own_workspace
  on public.contacts for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy contacts_delete_own_workspace
  on public.contacts for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy suppliers_select_own_workspace
  on public.suppliers for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy suppliers_insert_own_workspace
  on public.suppliers for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy suppliers_update_own_workspace
  on public.suppliers for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy suppliers_delete_own_workspace
  on public.suppliers for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy documents_select_own_workspace
  on public.documents for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy documents_insert_own_workspace
  on public.documents for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy documents_update_own_workspace
  on public.documents for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy documents_delete_own_workspace
  on public.documents for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy tasks_select_own_workspace
  on public.tasks for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy tasks_insert_own_workspace
  on public.tasks for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy tasks_update_own_workspace
  on public.tasks for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy tasks_delete_own_workspace
  on public.tasks for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy nomenclature_rules_select_own_workspace
  on public.nomenclature_rules for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy nomenclature_rules_insert_own_workspace
  on public.nomenclature_rules for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy nomenclature_rules_update_own_workspace
  on public.nomenclature_rules for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy nomenclature_rules_delete_own_workspace
  on public.nomenclature_rules for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index contacts_workspace_id_idx on public.contacts(workspace_id);
create index suppliers_workspace_id_idx on public.suppliers(workspace_id);
create index documents_workspace_id_idx on public.documents(workspace_id);
create index tasks_workspace_id_idx on public.tasks(workspace_id);

-- ========================================================================
-- 003_update_projects_fields.sql
-- ========================================================================

-- Phase 1.2 — Update projects table fields
-- Run only if 001_core_tables.sql was applied with the older projects schema.

drop trigger if exists projects_updated_at on public.projects;
drop index if exists projects_tags_idx;

alter table public.projects
  drop column if exists description,
  drop column if exists tags,
  drop column if exists updated_at;

alter table public.projects
  drop constraint if exists projects_code_format_check;

alter table public.projects
  add constraint projects_code_format_check
  check (code ~ '^rif#[0-9]{4}$');

-- ========================================================================
-- 004_rls_workspace_isolation.sql
-- ========================================================================

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

-- ========================================================================
-- 005_project_nomenclatures.sql
-- ========================================================================

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

-- ========================================================================
-- 006_documents.sql
-- ========================================================================

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

-- ========================================================================
-- 007_documents_storage.sql
-- ========================================================================

-- Phase 9.2 — Supabase Storage: documents bucket
-- Requires 001_core_tables.sql (get_user_workspace_id)
-- Run 008_documents_storage_rules.sql next for MIME allowlist and file size limit.
-- Upload path convention: {workspace_id}/{project_id}/{document_id}/{filename}

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Workspace isolation: first path segment must match the user's workspace
create policy documents_storage_select_own_workspace
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

create policy documents_storage_insert_own_workspace
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

create policy documents_storage_update_own_workspace
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

create policy documents_storage_delete_own_workspace
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

-- ========================================================================
-- 008_documents_storage_rules.sql
-- ========================================================================

-- Phase 9.2 — Documents storage rules: MIME allowlist + configurable size limit
-- Requires 007_documents_storage.sql
-- Change documents_max_file_size_bytes below to adjust the server-side upload limit.

do $$
declare
  documents_max_file_size_bytes bigint := 52428800; -- 50 MB
begin
  update storage.buckets
  set
    public = false,
    file_size_limit = documents_max_file_size_bytes,
    allowed_mime_types = array[
      'application/pdf',
      'image/vnd.dwg',
      'application/acad',
      'application/x-dwg',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed'
    ]
  where id = 'documents';

  if not found then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'documents',
      'documents',
      false,
      documents_max_file_size_bytes,
      array[
        'application/pdf',
        'image/vnd.dwg',
        'application/acad',
        'application/x-dwg',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed'
      ]
    );
  end if;
end;
$$;

-- ========================================================================
-- 009_document_tags.sql
-- ========================================================================

-- Phase 9.6 — Document tagging
-- Requires 006_documents.sql

alter table public.documents
  add column if not exists tags text[] not null default '{}';

create index if not exists documents_tags_idx on public.documents using gin (tags);

-- ========================================================================
-- 010_signup_workspace_function.sql
-- ========================================================================

-- Phase 1.4 — Atomic signup workspace setup (bypasses RLS safely)
-- Requires 001_core_tables.sql and 004_rls_workspace_isolation.sql
-- Parameter order: user_email before workspace_name (PostgREST RPC lookup)

create or replace function public.setup_signup_workspace(
  user_email text,
  workspace_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.users where id = uid) then
    return (select workspace_id from public.users where id = uid limit 1);
  end if;

  insert into public.workspaces (name)
  values (workspace_name)
  returning id into new_workspace_id;

  insert into public.users (id, workspace_id, email, role)
  values (uid, new_workspace_id, user_email, 'owner');

  return new_workspace_id;
end;
$$;

revoke all on function public.setup_signup_workspace(text, text) from public;
grant execute on function public.setup_signup_workspace(text, text) to authenticated;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';

-- ========================================================================
-- 011_free_project_code.sql
-- ========================================================================

-- Allow any project code format (remove rif#0001 constraint)
-- 001 creates an inline check named projects_code_check;
-- 003 may rename it to projects_code_format_check.

alter table public.projects
  drop constraint if exists projects_code_check,
  drop constraint if exists projects_code_format_check;

-- ========================================================================
-- 012_search_indexes.sql
-- ========================================================================

-- Phase 10.3 — Global search indexes
-- Requires 001_core_tables.sql, 002_module_tables.sql, 009_document_tags.sql
-- Optimizes ilike substring search used by the global search service.

create extension if not exists pg_trgm;

-- Projects: name, code
create index if not exists projects_name_trgm_idx
  on public.projects using gin (name gin_trgm_ops);

create index if not exists projects_code_trgm_idx
  on public.projects using gin (code gin_trgm_ops);

-- Contacts: name, company
create index if not exists contacts_name_trgm_idx
  on public.contacts using gin (name gin_trgm_ops);

create index if not exists contacts_company_trgm_idx
  on public.contacts using gin (company gin_trgm_ops);

-- Documents: name
create index if not exists documents_name_trgm_idx
  on public.documents using gin (name gin_trgm_ops);

-- Tags: array tag values (name search across contacts, suppliers, documents)
create or replace function public.tags_search_text(tags text[])
returns text
language sql
immutable
parallel safe
as $$
  select coalesce(
    (
      select string_agg(lower(tag), ' ')
      from unnest(coalesce(tags, '{}'::text[])) as tag
    ),
    ''
  );
$$;

create index if not exists contacts_tags_idx
  on public.contacts using gin (tags);

create index if not exists contacts_tags_name_trgm_idx
  on public.contacts using gin (public.tags_search_text(tags) gin_trgm_ops);

create index if not exists suppliers_tags_idx
  on public.suppliers using gin (tags);

create index if not exists suppliers_tags_name_trgm_idx
  on public.suppliers using gin (public.tags_search_text(tags) gin_trgm_ops);

create index if not exists documents_tags_name_trgm_idx
  on public.documents using gin (public.tags_search_text(tags) gin_trgm_ops);

-- ========================================================================
-- 013_project_location.sql
-- ========================================================================

-- Phase 11.4 — Project location for card display

alter table public.projects
  add column if not exists location text;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';

-- ========================================================================
-- 014_activity_events.sql
-- ========================================================================

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

-- ========================================================================
-- 015_task_details.sql
-- ========================================================================

-- Task details: notes, urgency, reminder

alter table public.tasks
  add column if not exists notes text,
  add column if not exists urgency text check (urgency in ('low', 'medium', 'high', 'critical')),
  add column if not exists reminder_at timestamptz;

notify pgrst, 'reload schema';

-- ========================================================================
-- 016_contact_type.sql
-- ========================================================================

-- Contact type (tipologia)

alter table public.contacts
  add column if not exists type text;

create extension if not exists pg_trgm;

create index if not exists contacts_type_trgm_idx
  on public.contacts using gin (type gin_trgm_ops);

notify pgrst, 'reload schema';

-- ========================================================================
-- 017_project_contacts.sql
-- ========================================================================

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

-- ========================================================================
-- 018_workspace_nomenclature_rules.sql
-- ========================================================================

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

-- ========================================================================
-- 019_supplier_details.sql
-- ========================================================================

-- Phase 19 — Supplier company details and multi-select company types

alter table public.suppliers
  add column if not exists company text,
  add column if not exists contact_name text,
  add column if not exists website text,
  add column if not exists company_types text[] not null default '{}';

update public.suppliers
set company = name
where company is null;

update public.suppliers
set company_types = array[category]
where category is not null
  and btrim(category) <> ''
  and company_types = '{}';

update public.suppliers
set name = company
where company is not null;

alter table public.suppliers
  alter column company set not null;

create index if not exists suppliers_company_types_idx
  on public.suppliers using gin (company_types);

notify pgrst, 'reload schema';

-- ========================================================================
-- 020_project_suppliers.sql
-- ========================================================================

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

-- ========================================================================
-- 021_workspace_notes.sql
-- ========================================================================

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

-- ========================================================================
-- 022_user_workspace_settings.sql
-- ========================================================================

-- User profile and workspace settings fields + asset storage

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists avatar_url text;

alter table public.workspaces
  add column if not exists code text,
  add column if not exists logo_url text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text;

-- Workspace assets bucket: avatars, logos
-- Path convention: {workspace_id}/avatars/{user_id}.{ext} | {workspace_id}/logo.{ext}

insert into storage.buckets (id, name, public)
values ('workspace-assets', 'workspace-assets', false)
on conflict (id) do nothing;

create policy workspace_assets_select_own_workspace
  on storage.objects for select to authenticated
  using (
    bucket_id = 'workspace-assets'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

create policy workspace_assets_insert_own_workspace
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'workspace-assets'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

create policy workspace_assets_update_own_workspace
  on storage.objects for update to authenticated
  using (
    bucket_id = 'workspace-assets'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  )
  with check (
    bucket_id = 'workspace-assets'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

create policy workspace_assets_delete_own_workspace
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'workspace-assets'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

-- ========================================================================
-- 023_workspace_invitations.sql
-- ========================================================================

-- Workspace invitations for team members

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_invitations_email_normalized check (email = lower(trim(email))),
  unique (workspace_id, email)
);

create trigger workspace_invitations_updated_at
  before update on public.workspace_invitations
  for each row execute function public.handle_updated_at();

alter table public.workspace_invitations enable row level security;
alter table public.workspace_invitations force row level security;

create policy workspace_invitations_select_own_workspace
  on public.workspace_invitations for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy workspace_invitations_insert_owner
  on public.workspace_invitations for insert to authenticated
  with check (
    workspace_id = public.get_user_workspace_id()
    and invited_by = auth.uid()
    and exists (
      select 1
      from public.users
      where id = auth.uid()
        and workspace_id = workspace_invitations.workspace_id
        and role = 'owner'
    )
  );

create or replace function public.invite_workspace_member(invitee_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(invitee_email));
  current_workspace_id uuid := public.get_user_workspace_id();
  current_user_id uuid := auth.uid();
  invitation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if current_workspace_id is null then
    raise exception 'Workspace not found';
  end if;

  if normalized_email is null or normalized_email = '' then
    raise exception 'Email is required';
  end if;

  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address';
  end if;

  if not exists (
    select 1
    from public.users
    where id = current_user_id
      and workspace_id = current_workspace_id
      and role = 'owner'
  ) then
    raise exception 'Only workspace owners can invite members';
  end if;

  if exists (
    select 1
    from public.users
    where workspace_id = current_workspace_id
      and lower(email) = normalized_email
  ) then
    raise exception 'This person is already in your workspace';
  end if;

  insert into public.workspace_invitations (
    workspace_id,
    email,
    invited_by,
    status
  )
  values (
    current_workspace_id,
    normalized_email,
    current_user_id,
    'pending'
  )
  on conflict (workspace_id, email)
  do update set
    invited_by = excluded.invited_by,
    status = 'pending',
    updated_at = now()
  returning id into invitation_id;

  return invitation_id;
end;
$$;

revoke all on function public.invite_workspace_member(text) from public;
grant execute on function public.invite_workspace_member(text) to authenticated;

notify pgrst, 'reload schema';

-- ========================================================================
-- 024_api_grants.sql
-- ========================================================================

-- PostgREST / Supabase Data API privileges (required for local and self-hosted).
-- Cloud projects enable these automatically; local CLI needs them explicitly.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
