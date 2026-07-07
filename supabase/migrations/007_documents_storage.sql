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
