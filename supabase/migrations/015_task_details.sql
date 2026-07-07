-- Task details: notes, urgency, reminder

alter table public.tasks
  add column if not exists notes text,
  add column if not exists urgency text check (urgency in ('low', 'medium', 'high', 'critical')),
  add column if not exists reminder_at timestamptz;

notify pgrst, 'reload schema';
