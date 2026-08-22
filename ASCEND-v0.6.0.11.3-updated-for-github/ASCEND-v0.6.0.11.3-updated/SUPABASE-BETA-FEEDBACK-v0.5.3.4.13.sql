-- ASCEND v0.5.3.4.13 // PRIVATE BETA FEEDBACK
-- Run once in Supabase SQL Editor. Testers never run this and never receive keys.

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tester_email text not null default '',
  category text not null check (category in ('bug','ux','idea','other')),
  message text not null check (char_length(message) between 8 and 2000),
  app_version text not null default '',
  page text not null default '',
  diagnostics jsonb,
  created_at timestamptz not null default now()
);

alter table public.beta_feedback enable row level security;
revoke all on table public.beta_feedback from anon, authenticated;
grant usage on schema public to service_role;
grant insert on table public.beta_feedback to service_role;

-- The server secret bypasses RLS for insertion. Browser roles have no policies,
-- so testers cannot list, read, edit, or delete anyone's feedback.
drop policy if exists "No browser feedback reads" on public.beta_feedback;
drop policy if exists "No browser feedback writes" on public.beta_feedback;

create index if not exists beta_feedback_created_at_idx on public.beta_feedback (created_at desc);

-- Refresh PostgREST after creating/granting a new API-facing table.
notify pgrst, 'reload schema';
