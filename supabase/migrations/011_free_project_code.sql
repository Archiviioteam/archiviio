-- Allow any project code format (remove rif#0001 constraint)
-- 001 creates an inline check named projects_code_check;
-- 003 may rename it to projects_code_format_check.

alter table public.projects
  drop constraint if exists projects_code_check,
  drop constraint if exists projects_code_format_check;
