-- Remove IMAP email archiving feature

drop table if exists public.archived_emails cascade;
drop table if exists public.project_email_keywords cascade;
drop table if exists public.mailbox_connections cascade;

drop type if exists public.email_direction;
drop type if exists public.email_match_status;

notify pgrst, 'reload schema';
