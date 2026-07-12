-- ===========================================================================
-- Aria Health — notification ordering
-- Run AFTER 0001_schema.sql. Adds a timestamp so freshly generated
-- notifications (new booking, accepted request, issued prescription, …) sort
-- to the top of each user's list.
-- ===========================================================================

alter table public.notifications
  add column if not exists created_at timestamptz default now();

create index if not exists notifications_user_id_idx on public.notifications (user_id);
