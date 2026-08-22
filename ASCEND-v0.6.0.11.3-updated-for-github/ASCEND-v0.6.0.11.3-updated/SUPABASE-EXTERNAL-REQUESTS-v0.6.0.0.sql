-- ASCEND v0.6.0.0 // END-TO-END ENCRYPTED EXTERNAL REQUESTS
-- Run once in the Supabase SQL Editor. Browser roles receive no direct table
-- access. Only the ASCEND server-side Secret/Service Role can use this layer.

create extension if not exists pgcrypto;

create table if not exists public.external_inboxes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  public_key jsonb not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_requests (
  id uuid primary key default gen_random_uuid(),
  inbox_id uuid not null references public.external_inboxes(id) on delete cascade,
  envelope jsonb not null,
  envelope_hash text not null check (envelope_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending','accepted','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '90 days')
);

-- Safe upgrade path if an early v0.6 preview created the table before replay
-- protection was added.
alter table public.external_requests add column if not exists envelope_hash text;
update public.external_requests
set envelope_hash = encode(digest(envelope::text, 'sha256'), 'hex')
where envelope_hash is null;
alter table public.external_requests alter column envelope_hash set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'external_requests_envelope_hash_check') then
    alter table public.external_requests add constraint external_requests_envelope_hash_check check (envelope_hash ~ '^[0-9a-f]{64}$');
  end if;
end $$;

create index if not exists external_requests_inbox_status_created_idx
  on public.external_requests (inbox_id, status, created_at desc);
create index if not exists external_requests_ip_created_idx
  on public.external_requests (ip_hash, created_at desc);
create index if not exists external_requests_expiry_idx
  on public.external_requests (expires_at);
create unique index if not exists external_requests_inbox_envelope_hash_idx
  on public.external_requests (inbox_id, envelope_hash);

alter table public.external_inboxes enable row level security;
alter table public.external_requests enable row level security;
revoke all on table public.external_inboxes, public.external_requests from public, anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.external_inboxes, public.external_requests to service_role;

drop function if exists public.submit_external_request(uuid,text,jsonb);
create or replace function public.submit_external_request(
  p_inbox_id uuid,
  p_ip_hash text,
  p_envelope_hash text,
  p_envelope jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  -- Keep the table bounded without a separate scheduler.
  delete from public.external_requests where expires_at < now();

  perform pg_advisory_xact_lock(hashtextextended(p_inbox_id::text || ':' || p_ip_hash, 0));

  if not exists (select 1 from public.external_inboxes where id = p_inbox_id and enabled = true) then
    raise exception 'request inbox unavailable';
  end if;

  if (select count(*) from public.external_requests
      where inbox_id = p_inbox_id and ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate limit exceeded';
  end if;

  if (select count(*) from public.external_requests
      where inbox_id = p_inbox_id and created_at > now() - interval '1 day') >= 50 then
    raise exception 'inbox rate limit exceeded';
  end if;

  if (select count(*) from public.external_requests
      where inbox_id = p_inbox_id and status = 'pending') >= 250 then
    raise exception 'inbox pending limit exceeded';
  end if;

  if p_ip_hash !~ '^[0-9a-f]{64}$'
     or p_envelope_hash !~ '^[0-9a-f]{64}$'
     or jsonb_typeof(p_envelope) <> 'object'
     or pg_column_size(p_envelope) > 24576 then
    raise exception 'invalid encrypted envelope';
  end if;

  if exists (select 1 from public.external_requests where inbox_id = p_inbox_id and envelope_hash = p_envelope_hash) then
    raise exception 'duplicate request';
  end if;

  insert into public.external_requests (inbox_id, envelope, envelope_hash, ip_hash)
  values (p_inbox_id, p_envelope, p_envelope_hash, p_ip_hash)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_external_request(uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.submit_external_request(uuid,text,text,jsonb) to service_role;

notify pgrst, 'reload schema';
