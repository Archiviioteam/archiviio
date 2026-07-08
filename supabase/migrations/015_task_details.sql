-- Task details: notes and urgency

alter table public.tasks
  add column if not exists notes text,
  add column if not exists urgency text check (urgency in ('low', 'medium', 'high', 'critical'));

notify pgrst, 'reload schema';
