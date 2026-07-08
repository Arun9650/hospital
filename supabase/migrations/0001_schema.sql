-- ===========================================================================
-- Aria Health — schema + row level security
-- Run this in the Supabase SQL editor (or `supabase db push`) before seed.sql.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles  (extends auth.users; created automatically on sign up via trigger)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  role         text not null default 'patient' check (role in ('patient','doctor','admin')),
  initials     text,
  avatar_color text default '#0070d1',
  phone        text,
  dob          date,
  gender       text,
  created_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- specialties
-- ---------------------------------------------------------------------------
create table if not exists public.specialties (
  slug          text primary key,
  name          text not null,
  icon          text,
  doctors_count int  default 0,
  blurb         text
);

-- ---------------------------------------------------------------------------
-- doctors  (catalog; id is a slug so /doctors/[id] URLs stay stable)
-- ---------------------------------------------------------------------------
create table if not exists public.doctors (
  id             text primary key,
  profile_id     uuid references public.profiles(id) on delete set null,
  name           text not null,
  specialty      text not null,
  specialty_slug text references public.specialties(slug),
  qualifications text,
  experience     int    default 0,
  rating         numeric(2,1) default 5.0,
  reviews        int    default 0,
  fee            int    default 0,
  location       text,
  languages      text[] default '{}',
  photo          text   default '#0070d1',
  initials       text,
  verified       boolean default true,
  next_slot      text,
  modes          text[] default '{}',
  about          text,
  tags           text[] default '{}',
  created_at     timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id         text primary key,
  doctor_id  text references public.doctors(id) on delete cascade,
  patient    text,
  initials   text,
  rating     int  default 5,
  date_label text,
  body       text
);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    text references public.doctors(id) on delete set null,
  doctor_name  text,
  specialty    text,
  patient_id   uuid references public.profiles(id) on delete set null,
  patient_name text,
  date_label   text,
  time_label   text,
  mode         text check (mode in ('Video','Audio','Chat','In-person')),
  status       text default 'Pending' check (status in ('Upcoming','Completed','Pending','Cancelled')),
  fee          int  default 0,
  reason       text,
  created_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- prescriptions  (medicines inline as jsonb; tests as text[])
-- ---------------------------------------------------------------------------
create table if not exists public.prescriptions (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id     uuid references public.profiles(id) on delete set null,
  doctor_name    text,
  specialty      text,
  date_label     text,
  diagnosis      text,
  medicines      jsonb  default '[]'::jsonb,
  tests          text[] default '{}',
  notes          text,
  created_at     timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- medical_records
-- ---------------------------------------------------------------------------
create table if not exists public.medical_records (
  id         text primary key,
  patient_id uuid references public.profiles(id) on delete set null,
  title      text,
  type       text,
  date_label text,
  issued_by  text,
  size       text
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         text primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  title      text,
  body       text,
  time_label text,
  kind       text default 'system' check (kind in ('appointment','prescription','payment','system')),
  unread     boolean default true
);

-- ---------------------------------------------------------------------------
-- availability  (per doctor per weekday)
-- ---------------------------------------------------------------------------
create table if not exists public.availability (
  doctor_id text references public.doctors(id) on delete cascade,
  day       text,
  enabled   boolean default true,
  slots     text[] default '{}',
  primary key (doctor_id, day)
);

-- ---------------------------------------------------------------------------
-- verification_queue
-- ---------------------------------------------------------------------------
create table if not exists public.verification_queue (
  id        text primary key,
  name      text,
  specialty text,
  submitted text,
  docs      int default 0,
  status    text default 'Pending'
);

-- ===========================================================================
-- Auto-create a profile row when a new auth user signs up.
-- role / full_name / initials come from the sign-up metadata.
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, initials, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(new.raw_user_meta_data->>'initials', upper(substr(coalesce(new.email,'A'),1,2))),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#0070d1')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Row Level Security
-- NOTE: operational tables use demo-permissive policies so the admin and
-- doctor portals can read across users. Tighten these with role checks before
-- going to production.
-- ===========================================================================
alter table public.profiles           enable row level security;
alter table public.specialties        enable row level security;
alter table public.doctors            enable row level security;
alter table public.reviews            enable row level security;
alter table public.appointments       enable row level security;
alter table public.prescriptions      enable row level security;
alter table public.medical_records    enable row level security;
alter table public.notifications      enable row level security;
alter table public.availability       enable row level security;
alter table public.verification_queue enable row level security;

-- Public catalog: readable by everyone (incl. anon) --------------------------
create policy "read specialties"  on public.specialties        for select using (true);
create policy "read doctors"      on public.doctors            for select using (true);
create policy "read reviews"      on public.reviews            for select using (true);
create policy "read availability" on public.availability       for select using (true);
create policy "read verification" on public.verification_queue for select using (true);
create policy "read profiles"     on public.profiles           for select using (true);

-- profiles: owner writes -----------------------------------------------------
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- Authenticated users can manage catalog rows they need (doctor/admin flows) --
create policy "auth write doctors"      on public.doctors            for all to authenticated using (true) with check (true);
create policy "auth write availability" on public.availability       for all to authenticated using (true) with check (true);
create policy "auth write verification" on public.verification_queue for all to authenticated using (true) with check (true);

-- Operational tables: readable by everyone (so seeded demo rows show), and
-- writable by authenticated users. ------------------------------------------
create policy "read appointments"  on public.appointments    for select using (true);
create policy "write appointments" on public.appointments    for all to authenticated using (true) with check (true);

create policy "read prescriptions"  on public.prescriptions  for select using (true);
create policy "write prescriptions" on public.prescriptions  for all to authenticated using (true) with check (true);

create policy "read records"  on public.medical_records      for select using (true);
create policy "write records" on public.medical_records      for all to authenticated using (true) with check (true);

create policy "read notifications"  on public.notifications  for select using (true);
create policy "write notifications" on public.notifications  for all to authenticated using (true) with check (true);
