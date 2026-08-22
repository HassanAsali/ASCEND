-- ASCEND v0.6.0.11.3 — private Friends and collaboration plans
-- Additive migration. It does not change player_state, account XP, ranks,
-- Focus Circles, quests, or existing social data.

create extension if not exists pgcrypto;

create table if not exists public.friend_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  invite_hash text unique,
  invite_enabled boolean not null default false,
  share_collaboration boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Friend leaderboard progress fields. These are shared only when share_collaboration is enabled.
alter table public.friend_profiles
  add column if not exists rank_stage text not null default 'E',
  add column if not exists total_xp bigint not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'friend_profiles_rank_stage_check'
      and conrelid = 'public.friend_profiles'::regclass
  ) then
    alter table public.friend_profiles
      add constraint friend_profiles_rank_stage_check
      check (rank_stage ~ '^[EDCBAS](?:-[IVX]+)?$');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'friend_profiles_total_xp_check'
      and conrelid = 'public.friend_profiles'::regclass
  ) then
    alter table public.friend_profiles
      add constraint friend_profiles_total_xp_check
      check (total_xp between 0 and 1000000000);
  end if;
end $$;

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked','removed')),
  blocked_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  acted_at timestamptz,
  constraint friendship_distinct_users check (user_low <> user_high),
  constraint friendship_canonical_pair check (user_low::text < user_high::text),
  constraint friendship_unique_pair unique (user_low,user_high),
  constraint friendship_requester_is_member check (requested_by in (user_low,user_high)),
  constraint friendship_blocker_is_member check (blocked_by is null or blocked_by in (user_low,user_high))
);

create table if not exists public.friend_plans (
  id uuid primary key default gen_random_uuid(),
  friendship_id uuid not null references public.friendships(id) on delete cascade,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  kind text not null default 'task' check (kind in ('task','study','meeting')),
  starts_at timestamptz,
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 480),
  status text not null default 'active' check (status in ('active','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friend_plan_progress (
  plan_id uuid not null references public.friend_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (plan_id,user_id)
);

create index if not exists friendships_low_idx on public.friendships(user_low,status);
create index if not exists friendships_high_idx on public.friendships(user_high,status);
create index if not exists friend_plans_friendship_idx on public.friend_plans(friendship_id,created_at desc);
create index if not exists friend_plan_progress_user_idx on public.friend_plan_progress(user_id,completed_at desc);

-- Database-side membership guard. Even a future backend regression cannot add
-- a plan or completion for a stranger or for a non-accepted relationship.
create or replace function public.enforce_friend_plan_membership()
returns trigger language plpgsql security definer set search_path=public as $$
declare rel public.friendships%rowtype;
declare target_friendship uuid;
begin
  if tg_table_name = 'friend_plans' then
    target_friendship := new.friendship_id;
  else
    select friendship_id into target_friendship from public.friend_plans where id=new.plan_id;
  end if;
  select * into rel from public.friendships where id=target_friendship;
  if rel.id is null or rel.status <> 'accepted' then
    raise exception 'An accepted friendship is required.';
  end if;
  if tg_table_name = 'friend_plans' and new.creator_user_id not in (rel.user_low,rel.user_high) then
    raise exception 'Plan creator is not a member of this friendship.';
  end if;
  if tg_table_name = 'friend_plan_progress' and new.user_id not in (rel.user_low,rel.user_high) then
    raise exception 'Progress user is not a member of this friendship.';
  end if;
  return new;
end;
$$;

drop trigger if exists friend_plan_membership_guard on public.friend_plans;
create trigger friend_plan_membership_guard before insert or update on public.friend_plans
for each row execute function public.enforce_friend_plan_membership();

drop trigger if exists friend_progress_membership_guard on public.friend_plan_progress;
create trigger friend_progress_membership_guard before insert or update on public.friend_plan_progress
for each row execute function public.enforce_friend_plan_membership();

alter table public.friend_profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_plans enable row level security;
alter table public.friend_plan_progress enable row level security;

revoke all on table public.friend_profiles, public.friendships, public.friend_plans, public.friend_plan_progress from public, anon, authenticated;
grant select, insert, update, delete on table public.friend_profiles, public.friendships, public.friend_plans, public.friend_plan_progress to service_role;
revoke all on function public.enforce_friend_plan_membership() from public, anon, authenticated;
grant execute on function public.enforce_friend_plan_membership() to service_role;

notify pgrst, 'reload schema';
