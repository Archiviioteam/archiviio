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
