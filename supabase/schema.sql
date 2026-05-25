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

create policy "anon read bookings"     on bookings      for select using (true);
create policy "anon insert bookings"   on bookings      for insert with check (true);
create policy "anon read blocked"      on blocked_slots for select using (true);
create policy "anon insert blocked"    on blocked_slots for insert with check (true);
create policy "anon delete blocked"    on blocked_slots for delete using (true);
