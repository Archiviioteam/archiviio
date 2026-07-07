-- Phase 1.2 — Update projects table fields
-- Run only if 001_core_tables.sql was applied with the older projects schema.

drop trigger if exists projects_updated_at on public.projects;
drop index if exists projects_tags_idx;

alter table public.projects
  drop column if exists description,
  drop column if exists tags,
  drop column if exists updated_at;

alter table public.projects
  drop constraint if exists projects_code_format_check;

alter table public.projects
  add constraint projects_code_format_check
  check (code ~ '^rif#[0-9]{4}$');
