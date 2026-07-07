-- Contact type (tipologia)

alter table public.contacts
  add column if not exists type text;

create extension if not exists pg_trgm;

create index if not exists contacts_type_trgm_idx
  on public.contacts using gin (type gin_trgm_ops);

notify pgrst, 'reload schema';
