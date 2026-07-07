-- Phase 9.6 — Document tagging
-- Requires 006_documents.sql

alter table public.documents
  add column if not exists tags text[] not null default '{}';

create index if not exists documents_tags_idx on public.documents using gin (tags);
