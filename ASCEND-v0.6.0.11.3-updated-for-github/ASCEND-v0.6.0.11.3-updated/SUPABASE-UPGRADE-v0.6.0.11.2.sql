-- ASCEND v0.6.0.11.2 — Circle Contribution XP + Finish/Archive Circle
-- Cumulative, additive upgrade. Safe to run on a database that already has
-- SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql applied. Does NOT drop any table,
-- column, or row. Existing circles, members, items and progress rows are
-- untouched except for new columns defaulting to safe values.

-- 1) Circle Contribution XP lives on the existing idempotent completion
--    record (focus_circle_item_progress already has a primary key of
--    (item_id, user_id), so a user can only ever have one completion row
--    per item — that uniqueness is what makes this XP un-farmable).
alter table public.focus_circle_item_progress
  add column if not exists xp_awarded integer not null default 0
  check (xp_awarded between 0 and 1000);

-- 2) Circle lifecycle: active vs finished (archived). Finishing is a
--    one-way, owner-only, idempotent action — it never grants XP itself.
alter table public.focus_circles
  add column if not exists status text not null default 'active'
  check (status in ('active','finished'));
alter table public.focus_circles
  add column if not exists finished_at timestamptz;

create index if not exists focus_circles_status_idx on public.focus_circles(status);

-- 3) Defense in depth: once a circle is finished, block any further writes
--    to its shared items or completion rows at the database layer too
--    (the backend already enforces this before it ever issues these
--    writes, but a trigger means the rule holds even if a future code
--    path forgets the check).
create or replace function public.enforce_focus_circle_not_finished()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_circle_id uuid;
  circle_status text;
begin
  target_circle_id := coalesce(new.circle_id, old.circle_id);
  select status into circle_status from public.focus_circles where id = target_circle_id;
  if circle_status = 'finished' then
    raise exception 'This Focus Circle is finished and archived. No further changes are allowed.';
  end if;
  return new;
end;
$$;

drop trigger if exists focus_circle_items_finished_guard on public.focus_circle_items;
create trigger focus_circle_items_finished_guard
before insert or update on public.focus_circle_items
for each row execute function public.enforce_focus_circle_not_finished();

drop trigger if exists focus_circle_progress_finished_guard on public.focus_circle_item_progress;
create trigger focus_circle_progress_finished_guard
before insert or update on public.focus_circle_item_progress
for each row execute function public.enforce_focus_circle_not_finished();

revoke all on function public.enforce_focus_circle_not_finished() from public, anon, authenticated;
grant execute on function public.enforce_focus_circle_not_finished() to service_role;

-- Refresh PostgREST after the additive migration. This is idempotent.
notify pgrst, 'reload schema';
