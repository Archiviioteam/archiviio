-- Secure invite links for workspace join flow

create or replace function public.new_invitation_token()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

revoke all on function public.new_invitation_token() from public;

alter table public.workspace_invitations
  add column if not exists token text;

update public.workspace_invitations
set token = public.new_invitation_token()
where token is null;

alter table public.workspace_invitations
  alter column token set default public.new_invitation_token();

alter table public.workspace_invitations
  alter column token set not null;

create unique index if not exists workspace_invitations_token_key
  on public.workspace_invitations (token);

drop function if exists public.invite_workspace_member(text);

create or replace function public.invite_workspace_member(invitee_email text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  normalized_email text := lower(trim(invitee_email));
  current_workspace_id uuid := public.get_user_workspace_id();
  current_user_id uuid := auth.uid();
  invitation_token text;
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
    token = public.new_invitation_token(),
    updated_at = now()
  returning token into invitation_token;

  return invitation_token;
end;
$$;

revoke all on function public.invite_workspace_member(text) from public;
grant execute on function public.invite_workspace_member(text) to authenticated;

notify pgrst, 'reload schema';
