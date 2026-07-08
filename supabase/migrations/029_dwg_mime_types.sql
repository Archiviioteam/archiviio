-- Expand DWG MIME allowlist for browser/OS variants (e.g. application/dwg on macOS).

do $$
begin
  update storage.buckets
  set allowed_mime_types = array[
    'application/pdf',
    'image/vnd.dwg',
    'image/x-dwg',
    'application/acad',
    'application/x-dwg',
    'application/dwg',
    'application/x-autocad',
    'application/autocad_dwg',
    'application/vnd.autodesk.autocad.dwg',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed'
  ]
  where id = 'documents';
end;
$$;
