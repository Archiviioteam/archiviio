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
