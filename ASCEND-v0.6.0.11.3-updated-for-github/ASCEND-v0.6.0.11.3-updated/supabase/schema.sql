-- ASCEND v0.6.0.0 // SHAREABLE ENCRYPTED PRIVATE BETA
-- This matches the player_state table used by the application.

create table if not exists public.player_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_state text not null,
  state_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.player_state enable row level security;

revoke all on table public.player_state from anon;
grant select, insert, update, delete on table public.player_state to authenticated;

drop policy if exists "Users can read own state" on public.player_state;
create policy "Users can read own state" on public.player_state
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own state" on public.player_state;
create policy "Users can insert own state" on public.player_state
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own state" on public.player_state;
create policy "Users can update own state" on public.player_state
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own state" on public.player_state;
create policy "Users can delete own state" on public.player_state
for delete to authenticated using ((select auth.uid()) = user_id);

-- Private Beta feedback is accepted only through the authenticated ASCEND
-- server endpoint. Browser roles receive no table permissions or RLS policies.
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
create index if not exists beta_feedback_created_at_idx on public.beta_feedback (created_at desc);
notify pgrst, 'reload schema';

-- Apply ../SUPABASE-EXTERNAL-REQUESTS-v0.6.0.0.sql for the optional public
-- request link. It keeps encrypted request envelopes completely separate from
-- player_state and denies direct browser access to both inbox tables.

-- Apply ../SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql for optional private Circles.
-- Circle tables expose no direct anon/authenticated grants; signed-in members
-- use ASCEND's authenticated server endpoints. Circle activity never mutates XP,
-- Rank, Quest completion, player_state, or the encrypted recovery vault.
