-- Run this in Supabase SQL Editor if npm run db:migrate cannot connect.
-- https://supabase.com/dashboard/project/_/sql/new

-- 013_project_location.sql
alter table public.projects
  add column if not exists location text;

notify pgrst, 'reload schema';

-- 027_remove_task_reminder.sql
alter table public.tasks
  drop column if exists reminder_at;

notify pgrst, 'reload schema';

-- 014_activity_events.sql
create table if not exists public.activity_events (
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

drop policy if exists activity_events_select_own_workspace on public.activity_events;
create policy activity_events_select_own_workspace
  on public.activity_events for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

drop policy if exists activity_events_insert_own_workspace on public.activity_events;
create policy activity_events_insert_own_workspace
  on public.activity_events for insert to authenticated
  with check (
    workspace_id = public.get_user_workspace_id()
    and actor_id = auth.uid()
  );

create index if not exists activity_events_workspace_created_idx
  on public.activity_events (workspace_id, created_at desc);

create index if not exists activity_events_project_created_idx
  on public.activity_events (project_id, created_at desc)
  where project_id is not null;

notify pgrst, 'reload schema';

-- 015_task_details.sql
alter table public.tasks
  add column if not exists notes text,
  add column if not exists urgency text check (urgency in ('low', 'medium', 'high', 'critical'));

notify pgrst, 'reload schema';

-- 016_contact_type.sql
alter table public.contacts
  add column if not exists type text;

create extension if not exists pg_trgm;

create index if not exists contacts_type_trgm_idx
  on public.contacts using gin (type gin_trgm_ops);

notify pgrst, 'reload schema';

-- 017_project_contacts.sql
create table if not exists public.project_contacts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, contact_id)
);

alter table public.project_contacts enable row level security;
alter table public.project_contacts force row level security;

drop policy if exists project_contacts_select_own_workspace on public.project_contacts;
create policy project_contacts_select_own_workspace
  on public.project_contacts for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

drop policy if exists project_contacts_insert_own_workspace on public.project_contacts;
create policy project_contacts_insert_own_workspace
  on public.project_contacts for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

drop policy if exists project_contacts_delete_own_workspace on public.project_contacts;
create policy project_contacts_delete_own_workspace
  on public.project_contacts for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index if not exists project_contacts_project_id_idx
  on public.project_contacts(project_id);

create index if not exists project_contacts_contact_id_idx
  on public.project_contacts(contact_id);

create index if not exists project_contacts_workspace_id_idx
  on public.project_contacts(workspace_id);

notify pgrst, 'reload schema';

-- 018_workspace_nomenclature_rules.sql
create table if not exists public.workspace_nomenclature_rules (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workspace_nomenclature_rules_updated_at on public.workspace_nomenclature_rules;
create trigger workspace_nomenclature_rules_updated_at
  before update on public.workspace_nomenclature_rules
  for each row execute function public.handle_updated_at();

alter table public.workspace_nomenclature_rules enable row level security;
alter table public.workspace_nomenclature_rules force row level security;

drop policy if exists workspace_nomenclature_rules_select_own_workspace on public.workspace_nomenclature_rules;
create policy workspace_nomenclature_rules_select_own_workspace
  on public.workspace_nomenclature_rules for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

drop policy if exists workspace_nomenclature_rules_insert_own_workspace on public.workspace_nomenclature_rules;
create policy workspace_nomenclature_rules_insert_own_workspace
  on public.workspace_nomenclature_rules for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

drop policy if exists workspace_nomenclature_rules_update_own_workspace on public.workspace_nomenclature_rules;
create policy workspace_nomenclature_rules_update_own_workspace
  on public.workspace_nomenclature_rules for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

drop policy if exists workspace_nomenclature_rules_delete_own_workspace on public.workspace_nomenclature_rules;
create policy workspace_nomenclature_rules_delete_own_workspace
  on public.workspace_nomenclature_rules for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index if not exists workspace_nomenclature_rules_workspace_id_idx
  on public.workspace_nomenclature_rules(workspace_id);

create extension if not exists pg_trgm;

create index if not exists workspace_nomenclature_rules_title_trgm_idx
  on public.workspace_nomenclature_rules using gin (title gin_trgm_ops);

notify pgrst, 'reload schema';

-- 019_supplier_details.sql
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

-- 020_project_suppliers.sql
create table if not exists public.project_suppliers (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, supplier_id)
);

alter table public.project_suppliers enable row level security;
alter table public.project_suppliers force row level security;

drop policy if exists project_suppliers_select_own_workspace on public.project_suppliers;
create policy project_suppliers_select_own_workspace
  on public.project_suppliers for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

drop policy if exists project_suppliers_insert_own_workspace on public.project_suppliers;
create policy project_suppliers_insert_own_workspace
  on public.project_suppliers for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

drop policy if exists project_suppliers_delete_own_workspace on public.project_suppliers;
create policy project_suppliers_delete_own_workspace
  on public.project_suppliers for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index if not exists project_suppliers_project_id_idx
  on public.project_suppliers(project_id);

create index if not exists project_suppliers_supplier_id_idx
  on public.project_suppliers(supplier_id);

create index if not exists project_suppliers_workspace_id_idx
  on public.project_suppliers(workspace_id);

notify pgrst, 'reload schema';

-- 021_workspace_notes.sql
create table if not exists public.workspace_notes (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workspace_notes_updated_at on public.workspace_notes;
create trigger workspace_notes_updated_at
  before update on public.workspace_notes
  for each row execute function public.handle_updated_at();

alter table public.workspace_notes enable row level security;
alter table public.workspace_notes force row level security;

drop policy if exists workspace_notes_select_own_workspace on public.workspace_notes;
create policy workspace_notes_select_own_workspace
  on public.workspace_notes for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

drop policy if exists workspace_notes_insert_own_workspace on public.workspace_notes;
create policy workspace_notes_insert_own_workspace
  on public.workspace_notes for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

drop policy if exists workspace_notes_update_own_workspace on public.workspace_notes;
create policy workspace_notes_update_own_workspace
  on public.workspace_notes for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

drop policy if exists workspace_notes_delete_own_workspace on public.workspace_notes;
create policy workspace_notes_delete_own_workspace
  on public.workspace_notes for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

create index if not exists workspace_notes_workspace_id_idx
  on public.workspace_notes(workspace_id);

create index if not exists workspace_notes_updated_at_idx
  on public.workspace_notes(workspace_id, updated_at desc);

create extension if not exists pg_trgm;

create index if not exists workspace_notes_title_trgm_idx
  on public.workspace_notes using gin (title gin_trgm_ops);

create index if not exists workspace_notes_content_trgm_idx
  on public.workspace_notes using gin (content gin_trgm_ops);

notify pgrst, 'reload schema';

-- 022_user_workspace_settings.sql
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

insert into storage.buckets (id, name, public)
values ('workspace-assets', 'workspace-assets', false)
on conflict (id) do nothing;

drop policy if exists workspace_assets_select_own_workspace on storage.objects;
create policy workspace_assets_select_own_workspace
  on storage.objects for select to authenticated
  using (
    bucket_id = 'workspace-assets'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

drop policy if exists workspace_assets_insert_own_workspace on storage.objects;
create policy workspace_assets_insert_own_workspace
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'workspace-assets'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

drop policy if exists workspace_assets_update_own_workspace on storage.objects;
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

drop policy if exists workspace_assets_delete_own_workspace on storage.objects;
create policy workspace_assets_delete_own_workspace
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'workspace-assets'
    and (storage.foldername(name))[1] = public.get_user_workspace_id()::text
  );

notify pgrst, 'reload schema';

-- 030_workspace_postal_code.sql
alter table public.workspaces
  add column if not exists postal_code text;

notify pgrst, 'reload schema';
