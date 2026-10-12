-- Run this once in your Supabase SQL editor

create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text not null,
  address text not null,
  service_details jsonb not null,
  price integer not null,
  date date not null,
  time_slot text not null,
  created_at timestamptz default now()
);

create table if not exists blocked_slots (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  time_slot text not null,
  unique(date, time_slot)
);

alter table bookings enable row level security;
alter table blocked_slots enable row level security;

-- Public (anon / publishable key):
--   * may create bookings, but can NOT read them back (customer PII stays private)
--   * may read blocked_slots (needed for availability)
-- Admin reads/writes go through server routes using SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS. Never expose that key to the browser.
create policy "anon insert bookings"   on bookings      for insert with check (true);
create policy "anon read blocked"      on blocked_slots for select using (true);

-- Availability: expose only date + time_slot of bookings (no personal data).
-- security_invoker = false so it runs as the owner (postgres) and is not blocked by RLS.
create or replace view public.booked_slots with (security_invoker = false) as
  select date, time_slot from public.bookings;
alter view public.booked_slots owner to postgres;
revoke all on public.booked_slots from anon, authenticated;
grant select on public.booked_slots to anon, authenticated;

-- Upgrading an older install? Drop the old wide-open policies:
-- drop policy if exists "anon read bookings"  on bookings;
-- drop policy if exists "anon insert blocked" on blocked_slots;
-- drop policy if exists "anon delete blocked" on blocked_slots;
