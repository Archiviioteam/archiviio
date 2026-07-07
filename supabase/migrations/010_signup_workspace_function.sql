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
