alter table public.workspaces
  add column if not exists postal_code text;

notify pgrst, 'reload schema';
