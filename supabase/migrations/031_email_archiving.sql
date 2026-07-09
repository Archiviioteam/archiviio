-- Email archiving via IMAP (workspace-shared archive, per-user mailbox connections)

create type public.email_direction as enum ('inbound', 'outbound');
create type public.email_match_status as enum ('auto', 'manual', 'unmatched');

create table public.mailbox_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  imap_host text not null default 'imaps.aruba.it',
  imap_port integer not null default 993,
  imap_secure boolean not null default true,
  imap_username text not null,
  password_encrypted text not null,
  sent_folder text not null default 'INBOX.Sent',
  sync_enabled boolean not null default true,
  last_sync_at timestamptz,
  last_sync_error text,
  last_uid_inbox integer not null default 0,
  last_uid_sent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create trigger mailbox_connections_updated_at
  before update on public.mailbox_connections
  for each row execute function public.handle_updated_at();

create table public.archived_emails (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  mailbox_connection_id uuid not null references public.mailbox_connections(id) on delete cascade,
  mailbox_user_id uuid not null references public.users(id) on delete cascade,
  direction public.email_direction not null,
  message_id text,
  imap_uid integer not null,
  imap_folder text not null,
  subject text not null default '',
  from_address text not null default '',
  from_name text,
  to_addresses text[] not null default '{}',
  cc_addresses text[] not null default '{}',
  sent_at timestamptz not null,
  snippet text not null default '',
  body_text text,
  match_status public.email_match_status not null default 'unmatched',
  match_confidence smallint not null default 0,
  matched_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mailbox_connection_id, imap_folder, imap_uid)
);

create trigger archived_emails_updated_at
  before update on public.archived_emails
  for each row execute function public.handle_updated_at();

create index archived_emails_workspace_id_idx
  on public.archived_emails(workspace_id);

create index archived_emails_project_id_idx
  on public.archived_emails(project_id)
  where project_id is not null;

create index archived_emails_unassigned_idx
  on public.archived_emails(workspace_id, direction, sent_at desc)
  where project_id is null;

create index archived_emails_project_direction_idx
  on public.archived_emails(project_id, direction, sent_at desc)
  where project_id is not null;

create index archived_emails_message_id_idx
  on public.archived_emails(workspace_id, message_id)
  where message_id is not null;

create table public.project_email_keywords (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  keyword text not null,
  created_at timestamptz not null default now(),
  unique (project_id, keyword)
);

create index project_email_keywords_workspace_id_idx
  on public.project_email_keywords(workspace_id);

-- RLS
alter table public.mailbox_connections enable row level security;
alter table public.mailbox_connections force row level security;

alter table public.archived_emails enable row level security;
alter table public.archived_emails force row level security;

alter table public.project_email_keywords enable row level security;
alter table public.project_email_keywords force row level security;

-- Mailbox: each user manages only their own connection
create policy mailbox_connections_select_own
  on public.mailbox_connections for select to authenticated
  using (user_id = auth.uid());

create policy mailbox_connections_insert_own
  on public.mailbox_connections for insert to authenticated
  with check (
    user_id = auth.uid()
    and workspace_id = public.get_user_workspace_id()
  );

create policy mailbox_connections_update_own
  on public.mailbox_connections for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and workspace_id = public.get_user_workspace_id()
  );

create policy mailbox_connections_delete_own
  on public.mailbox_connections for delete to authenticated
  using (user_id = auth.uid());

-- Archived emails: shared within workspace
create policy archived_emails_select_own_workspace
  on public.archived_emails for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy archived_emails_update_own_workspace
  on public.archived_emails for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

-- Keywords: workspace scoped
create policy project_email_keywords_select_own_workspace
  on public.project_email_keywords for select to authenticated
  using (workspace_id = public.get_user_workspace_id());

create policy project_email_keywords_insert_own_workspace
  on public.project_email_keywords for insert to authenticated
  with check (workspace_id = public.get_user_workspace_id());

create policy project_email_keywords_update_own_workspace
  on public.project_email_keywords for update to authenticated
  using (workspace_id = public.get_user_workspace_id())
  with check (workspace_id = public.get_user_workspace_id());

create policy project_email_keywords_delete_own_workspace
  on public.project_email_keywords for delete to authenticated
  using (workspace_id = public.get_user_workspace_id());

notify pgrst, 'reload schema';
