-- ===========================================================================
-- Aria Health — Web Push subscriptions
-- Run AFTER 0001_schema.sql. Stores one row per device/browser that opted in to
-- push notifications, so the server can deliver a notification to every device
-- a user has enabled (e.g. a doctor's phone when a patient books).
-- ===========================================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

-- Row Level Security ---------------------------------------------------------
-- Demo-permissive: readable so the server can look up a recipient's devices
-- when sending, writable by authenticated users (they manage their own device).
-- Tighten to `auth.uid() = user_id` before production.
alter table public.push_subscriptions enable row level security;

create policy "read push subscriptions"  on public.push_subscriptions for select using (true);
create policy "write push subscriptions" on public.push_subscriptions for all to authenticated using (true) with check (true);
