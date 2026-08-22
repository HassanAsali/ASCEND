-- ASCEND v0.5.3.2 // SECURITY HARDENING I
-- Run in Supabase SQL Editor as project owner. Safe to re-run.

alter table public.player_state enable row level security;
alter table public.player_state force row level security;

revoke all on table public.player_state from public;
revoke all on table public.player_state from anon;
grant select, insert, update, delete on table public.player_state to authenticated;

drop policy if exists "Users can read own state" on public.player_state;
drop policy if exists "Users can insert own state" on public.player_state;
drop policy if exists "Users can update own state" on public.player_state;
drop policy if exists "Users can delete own state" on public.player_state;

create policy "Users can read own state" on public.player_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own state" on public.player_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own state" on public.player_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own state" on public.player_state for delete to authenticated using ((select auth.uid()) = user_id);

-- Prevent oversized encrypted payload abuse at the database boundary.
alter table public.player_state drop constraint if exists player_state_encrypted_state_size;
alter table public.player_state add constraint player_state_encrypted_state_size check (octet_length(encrypted_state) <= 1000000);

-- Verify expected policies after running:
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname='public' and tablename='player_state' order by policyname;
