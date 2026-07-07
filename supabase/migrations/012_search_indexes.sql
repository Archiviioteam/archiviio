-- Phase 10.3 — Global search indexes
-- Requires 001_core_tables.sql, 002_module_tables.sql, 009_document_tags.sql
-- Optimizes ilike substring search used by the global search service.

create extension if not exists pg_trgm;

-- Projects: name, code
create index if not exists projects_name_trgm_idx
  on public.projects using gin (name gin_trgm_ops);

create index if not exists projects_code_trgm_idx
  on public.projects using gin (code gin_trgm_ops);

-- Contacts: name, company
create index if not exists contacts_name_trgm_idx
  on public.contacts using gin (name gin_trgm_ops);

create index if not exists contacts_company_trgm_idx
  on public.contacts using gin (company gin_trgm_ops);

-- Documents: name
create index if not exists documents_name_trgm_idx
  on public.documents using gin (name gin_trgm_ops);

-- Tags: array tag values (name search across contacts, suppliers, documents)
create or replace function public.tags_search_text(tags text[])
returns text
language sql
immutable
parallel safe
as $$
  select coalesce(
    (
      select string_agg(lower(tag), ' ')
      from unnest(coalesce(tags, '{}'::text[])) as tag
    ),
    ''
  );
$$;

create index if not exists contacts_tags_idx
  on public.contacts using gin (tags);

create index if not exists contacts_tags_name_trgm_idx
  on public.contacts using gin (public.tags_search_text(tags) gin_trgm_ops);

create index if not exists suppliers_tags_idx
  on public.suppliers using gin (tags);

create index if not exists suppliers_tags_name_trgm_idx
  on public.suppliers using gin (public.tags_search_text(tags) gin_trgm_ops);

create index if not exists documents_tags_name_trgm_idx
  on public.documents using gin (public.tags_search_text(tags) gin_trgm_ops);
