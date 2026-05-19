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

-- OMIT (original v1 schema below – replaced) --
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------
-- 2. PROFILES  (extends auth.users — one row per user)
-- -------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name       text not null,
  email           text not null,
  role            text not null default 'employee'
                  check (role in ('admin', 'employee')),
  created_at      timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
-- Requires the invitation flow to pass organization_id + role via user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, organization_id, full_name, email, role)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'organization_id')::uuid,
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
-- 3. QR TOKENS  (short-lived, one-use)
-- -------------------------------------------------------
create table if not exists public.qr_tokens (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  token           text not null unique,
  expires_at      timestamptz not null,
  created_by      uuid not null references public.profiles (id),
  is_used         boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Index for fast token lookups during scan
create index if not exists qr_tokens_token_idx on public.qr_tokens (token);
create index if not exists qr_tokens_org_idx   on public.qr_tokens (organization_id, is_used, expires_at);

-- -------------------------------------------------------
-- 4. ATTENDANCE RECORDS
-- -------------------------------------------------------
create table if not exists public.attendance_records (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  qr_token_id     uuid references public.qr_tokens (id),
  type            text not null check (type in ('check_in', 'check_out')),
  timestamp       timestamptz not null default now(),
  location_lat    numeric(10, 7),
  location_lng    numeric(10, 7)
);

-- Index for dashboard queries
create index if not exists attendance_org_ts_idx      on public.attendance_records (organization_id, timestamp desc);
create index if not exists attendance_employee_ts_idx on public.attendance_records (employee_id, timestamp desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.organizations      enable row level security;
alter table public.profiles           enable row level security;
alter table public.qr_tokens          enable row level security;
alter table public.attendance_records enable row level security;

-- -------------------------------------------------------
-- organizations: only members of the org can read
-- -------------------------------------------------------
create policy "org_select_own" on public.organizations
  for select using (
    id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------
-- Any authenticated user can read profiles in their org
create policy "profiles_select_own_org" on public.profiles
  for select using (
    organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- -------------------------------------------------------
-- qr_tokens
-- -------------------------------------------------------
-- Admins can insert tokens for their org
create policy "qr_tokens_insert_admin" on public.qr_tokens
  for insert with check (
    organization_id in (
      select organization_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Any org member can read tokens (needed for scan validation)
create policy "qr_tokens_select_own_org" on public.qr_tokens
  for select using (
    organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

-- Only admins can update tokens (e.g., mark as used)
create policy "qr_tokens_update_admin" on public.qr_tokens
  for update using (
    organization_id in (
      select organization_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- -------------------------------------------------------
-- attendance_records
-- -------------------------------------------------------
-- Employees can insert their own records
create policy "attendance_insert_own" on public.attendance_records
  for insert with check (employee_id = auth.uid());

-- Employees see only their own records; admins see entire org
create policy "attendance_select" on public.attendance_records
  for select using (
    employee_id = auth.uid()
    or
    organization_id in (
      select organization_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- REALTIME  (enable for live dashboard)
-- ============================================================
-- Run in Supabase Dashboard → Database → Replication
-- or uncomment:
-- alter publication supabase_realtime add table public.attendance_records;
