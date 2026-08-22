-- ASCEND v0.6.0.8 — private Focus Circles
-- Run once in the Supabase SQL Editor. Existing player_state data is untouched.

create extension if not exists pgcrypto;

create table if not exists public.focus_circles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 60),
  invite_hash text not null unique check (invite_hash ~ '^[a-f0-9]{64}$'),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.focus_circle_members (
  circle_id uuid not null references public.focus_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  display_name text not null check (char_length(display_name) between 1 and 50),
  rank_stage text not null default 'E' check (char_length(rank_stage) between 1 and 8),
  level integer not null default 1 check (level between 1 and 999),
  total_xp integer not null default 0 check (total_xp between 0 and 100000000),
  seven_day_xp integer not null default 0 check (seven_day_xp between 0 and 10000000),
  active_days integer not null default 0 check (active_days between 0 and 100000),
  joined_at timestamptz not null default now(),
  stats_updated_at timestamptz not null default now(),
  primary key (circle_id,user_id)
);

create table if not exists public.focus_circle_items (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.focus_circles(id) on delete cascade,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  kind text not null check (kind in ('lecture','session','assignment')),
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.focus_circle_item_progress (
  circle_id uuid not null references public.focus_circles(id) on delete cascade,
  item_id uuid not null references public.focus_circle_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (item_id,user_id)
);

create index if not exists focus_circle_members_user_idx on public.focus_circle_members(user_id);
create index if not exists focus_circle_items_circle_start_idx on public.focus_circle_items(circle_id,starts_at);
create index if not exists focus_circle_progress_circle_idx on public.focus_circle_item_progress(circle_id);

alter table public.focus_circles enable row level security;
alter table public.focus_circle_members enable row level security;
alter table public.focus_circle_items enable row level security;
alter table public.focus_circle_item_progress enable row level security;

-- This subsystem is intentionally server-mediated. Browser roles cannot query,
-- insert or mutate social rows directly, even if a future client contains a bug.
revoke all on table public.focus_circles from anon, authenticated;
revoke all on table public.focus_circle_members from anon, authenticated;
revoke all on table public.focus_circle_items from anon, authenticated;
revoke all on table public.focus_circle_item_progress from anon, authenticated;
grant all on table public.focus_circles to service_role;
grant all on table public.focus_circle_members to service_role;
grant all on table public.focus_circle_items to service_role;
grant all on table public.focus_circle_item_progress to service_role;

-- Defense in depth if table grants are changed later: no browser policy is
-- created. Service-role requests bypass RLS and the backend verifies the caller.

create or replace function public.enforce_focus_circle_owner_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.owner_user_id::text, 0));
  if (select count(*) from public.focus_circles where owner_user_id = new.owner_user_id) >= 5 then
    raise exception 'focus circle owner limit reached';
  end if;
  return new;
end;
$$;

drop trigger if exists focus_circle_owner_limit_guard on public.focus_circles;
create trigger focus_circle_owner_limit_guard
before insert on public.focus_circles
for each row execute function public.enforce_focus_circle_owner_limit();

create or replace function public.enforce_focus_circle_member_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Let an idempotent join reach its ON CONFLICT handler even when full.
  if exists (
    select 1 from public.focus_circle_members
    where circle_id = new.circle_id and user_id = new.user_id
  ) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.circle_id::text, 0));
  if (select count(*) from public.focus_circle_members where circle_id = new.circle_id) >= 30 then
    raise exception 'focus circle member limit reached';
  end if;
  return new;
end;
$$;

drop trigger if exists focus_circle_member_limit_guard on public.focus_circle_members;
create trigger focus_circle_member_limit_guard
before insert on public.focus_circle_members
for each row execute function public.enforce_focus_circle_member_limit();

create or replace function public.enforce_focus_circle_owner_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'owner' and not exists (
    select 1 from public.focus_circles c
    where c.id = new.circle_id and c.owner_user_id = new.user_id
  ) then
    raise exception 'owner membership must match circle owner';
  end if;
  return new;
end;
$$;

drop trigger if exists focus_circle_owner_member_guard on public.focus_circle_members;
create trigger focus_circle_owner_member_guard
before insert or update on public.focus_circle_members
for each row execute function public.enforce_focus_circle_owner_member();

create or replace function public.enforce_focus_circle_progress_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.focus_circle_members m
    where m.circle_id = new.circle_id and m.user_id = new.user_id
  ) then
    raise exception 'progress user is not a circle member';
  end if;
  if not exists (
    select 1 from public.focus_circle_items i
    where i.id = new.item_id and i.circle_id = new.circle_id
  ) then
    raise exception 'progress item does not belong to circle';
  end if;
  return new;
end;
$$;

drop trigger if exists focus_circle_progress_guard on public.focus_circle_item_progress;
create trigger focus_circle_progress_guard
before insert or update on public.focus_circle_item_progress
for each row execute function public.enforce_focus_circle_progress_membership();

revoke all on function public.enforce_focus_circle_owner_member() from public, anon, authenticated;
revoke all on function public.enforce_focus_circle_progress_membership() from public, anon, authenticated;
revoke all on function public.enforce_focus_circle_owner_limit() from public, anon, authenticated;
revoke all on function public.enforce_focus_circle_member_limit() from public, anon, authenticated;
grant execute on function public.enforce_focus_circle_owner_member() to service_role;
grant execute on function public.enforce_focus_circle_progress_membership() to service_role;
grant execute on function public.enforce_focus_circle_owner_limit() to service_role;
grant execute on function public.enforce_focus_circle_member_limit() to service_role;

-- Refresh PostgREST after the owner-only migration. This is idempotent.
notify pgrst, 'reload schema';
