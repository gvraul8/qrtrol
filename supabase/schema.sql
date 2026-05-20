-- ============================================================
-- QRtrol v2 — Supabase Database Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- -------------------------------------------------------
-- 1. COMPANIES  (multi-tenant root)
-- -------------------------------------------------------
create table if not exists public.companies (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  logo_url             text,
  address              text,
  qr_duration_seconds  integer not null default 20,
  created_at           timestamptz not null default now()
);

-- -------------------------------------------------------
-- 2. USERS  (extends auth.users)
-- -------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  company_id  uuid not null references public.companies (id) on delete cascade,
  role        text not null default 'employee'
              check (role in ('admin', 'employee')),
  full_name   text not null,
  email       text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a user row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, company_id, full_name, email, role)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'company_id')::uuid,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'employee')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------------------------------------
-- 3. QR SESSIONS  (short-lived, single-use)
-- -------------------------------------------------------
create table if not exists public.qr_sessions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  token       text not null unique,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists qr_sessions_token_idx  on public.qr_sessions (token);
create index if not exists qr_sessions_company_idx on public.qr_sessions (company_id, used, expires_at);

-- -------------------------------------------------------
-- 4. TIME ENTRIES  (attendance records)
-- -------------------------------------------------------
create table if not exists public.time_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  company_id     uuid not null references public.companies (id) on delete cascade,
  qr_session_id  uuid references public.qr_sessions (id),
  type           text not null check (type in ('entry', 'exit')),
  created_at     timestamptz not null default now()
);

create index if not exists time_entries_company_ts_idx on public.time_entries (company_id, created_at desc);
create index if not exists time_entries_user_ts_idx    on public.time_entries (user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.companies    enable row level security;
alter table public.users        enable row level security;
alter table public.qr_sessions  enable row level security;
alter table public.time_entries enable row level security;

-- companies: members can read their own company; admins can update
create policy "companies_select_own" on public.companies
  for select using (
    id in (select company_id from public.users where id = auth.uid())
  );

create policy "companies_update_admin" on public.companies
  for update using (
    id in (select company_id from public.users where id = auth.uid() and role = 'admin')
  );

-- users: any company member can read, users can update own row
create policy "users_select_own_company" on public.users
  for select using (
    company_id in (select company_id from public.users where id = auth.uid())
  );

create policy "users_update_own" on public.users
  for update using (id = auth.uid());

-- Admins can insert users in their company
create policy "users_insert_admin" on public.users
  for insert with check (
    company_id in (
      select company_id from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete users from their company (not themselves)
create policy "users_delete_admin" on public.users
  for delete using (
    id <> auth.uid()
    and company_id in (
      select company_id from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- qr_sessions: admins insert/update; any company member can read
create policy "qr_sessions_insert_admin" on public.qr_sessions
  for insert with check (
    company_id in (
      select company_id from public.users where id = auth.uid() and role = 'admin'
    )
  );

create policy "qr_sessions_select_own_company" on public.qr_sessions
  for select using (
    company_id in (select company_id from public.users where id = auth.uid())
  );

create policy "qr_sessions_update_admin" on public.qr_sessions
  for update using (
    company_id in (
      select company_id from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- time_entries: employees insert own; admins & employee reads own
create policy "time_entries_insert_own" on public.time_entries
  for insert with check (user_id = auth.uid());

create policy "time_entries_select" on public.time_entries
  for select using (
    user_id = auth.uid()
    or
    company_id in (
      select company_id from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- REALTIME  (enable for live admin dashboard)
-- ============================================================
-- Run in Supabase Dashboard → Database → Replication → Supabase Realtime
-- and add table: public.time_entries
--
-- Or uncomment:
-- alter publication supabase_realtime add table public.time_entries;

-- ============================================================
-- HELPER VIEW: active_workers
-- Returns users whose most recent time_entry is type='entry'
-- ============================================================
create or replace view public.active_workers as
select
  u.id,
  u.company_id,
  u.full_name,
  u.email,
  u.avatar_url,
  te.created_at as checked_in_at
from public.users u
join lateral (
  select type, created_at
  from public.time_entries
  where user_id = u.id
  order by created_at desc
  limit 1
) te on te.type = 'entry';


