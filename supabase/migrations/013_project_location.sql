-- Phase 11.4 — Project location for card display

alter table public.projects
  add column if not exists location text;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
