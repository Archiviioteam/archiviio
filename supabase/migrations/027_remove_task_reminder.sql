-- Remove unused task reminder field

alter table public.tasks
  drop column if exists reminder_at;

notify pgrst, 'reload schema';
