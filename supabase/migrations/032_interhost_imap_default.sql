-- Default IMAP host for Interhost / Hosting Solutions

alter table public.mailbox_connections
  alter column imap_host set default 'imaps.interhost.it';

notify pgrst, 'reload schema';
