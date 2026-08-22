-- ASCEND v0.5.0 // multi-user isolation audit
-- Run in Supabase SQL Editor. Safe to re-run after dropping/recreating only the listed policies.

alter table public.player_state enable row level security;
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
