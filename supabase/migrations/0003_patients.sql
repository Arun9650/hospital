-- ===========================================================================
-- Aria Health — doctor's patient records
-- Run this AFTER 0001_schema.sql (and 0002_chat.sql). Seed with seed_patients.sql.
--
-- Each row is a patient on a specific doctor's panel. `history` holds recent
-- clinical notes inline as jsonb ({ date, title, by }[]) so the record screen
-- can render a timeline without an extra table.
-- ===========================================================================

create table if not exists public.patients (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   text references public.doctors(id) on delete cascade,
  profile_id  uuid references public.profiles(id) on delete set null,
  name        text not null,
  initials    text,
  age         int,
  gender      text,
  condition   text,
  visits      int  default 0,
  last_visit  text,
  blood_group text,
  allergies   text,
  height      text,
  weight      text,
  color       text default '#0070d1',
  history     jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);

create index if not exists patients_doctor_id_idx on public.patients (doctor_id);

-- Row Level Security ---------------------------------------------------------
-- Demo-permissive (mirrors the operational tables): readable by everyone so
-- seeded rows show, writable by authenticated users. Tighten before production.
alter table public.patients enable row level security;

create policy "read patients"  on public.patients for select using (true);
create policy "write patients" on public.patients for all to authenticated using (true) with check (true);
