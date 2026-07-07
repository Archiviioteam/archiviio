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
