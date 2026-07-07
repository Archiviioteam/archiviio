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
