-- ===========================================================================
-- Aria Health — chat (doctor ↔ patient messaging) with realtime
-- Run AFTER 0001_schema.sql. Safe to re-run.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- chat_threads  (one conversation between a doctor and a patient)
-- Demo/seeded threads use a NULL patient_id + patient_name 'Alex Morgan' so
-- they show for any signed-in user, mirroring the other seeded personal rows.
-- ---------------------------------------------------------------------------
create table if not exists public.chat_threads (
  id               uuid primary key default gen_random_uuid(),
  doctor_id        text references public.doctors(id) on delete cascade,
  patient_id       uuid references public.profiles(id) on delete set null,
  patient_name     text,
  patient_initials text,
  patient_color    text default '#0070d1',
  online           boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- chat_messages  (one message in a thread; sender is the party who wrote it)
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid references public.chat_threads(id) on delete cascade,
  sender     text not null check (sender in ('patient','doctor')),
  body       text not null,
  created_at timestamptz default now()
);

create index if not exists chat_messages_thread_idx
  on public.chat_messages (thread_id, created_at);
create index if not exists chat_threads_doctor_idx
  on public.chat_threads (doctor_id);

-- ===========================================================================
-- Row Level Security (demo-permissive, matching the operational tables in
-- 0001_schema.sql: readable by everyone so seeded demo rows show, writable by
-- authenticated users). Tighten with participant checks before production.
-- ===========================================================================
alter table public.chat_threads  enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "read chat_threads"  on public.chat_threads;
drop policy if exists "write chat_threads" on public.chat_threads;
drop policy if exists "read chat_messages"  on public.chat_messages;
drop policy if exists "write chat_messages" on public.chat_messages;

create policy "read chat_threads"  on public.chat_threads  for select using (true);
create policy "write chat_threads" on public.chat_threads  for all to authenticated using (true) with check (true);

create policy "read chat_messages"  on public.chat_messages for select using (true);
create policy "write chat_messages" on public.chat_messages for all to authenticated using (true) with check (true);

-- ===========================================================================
-- Realtime: broadcast INSERTs on both tables. Idempotent — only add when the
-- table isn't already a member of the supabase_realtime publication.
-- ===========================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_threads'
  ) then
    alter publication supabase_realtime add table public.chat_threads;
  end if;
end $$;
