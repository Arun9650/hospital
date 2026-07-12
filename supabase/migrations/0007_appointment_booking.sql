
-- ===========================================================================
-- Aria Health — atomic appointment booking + richer notification schema
-- Run AFTER 0001–0006. Safe to re-run.
--
-- Fixes: a booking used to insert the appointment and the doctor's notification
-- as two separate, non-atomic statements. This wraps both in a single Postgres
-- function (one transaction) so a notification can never exist without its
-- appointment, and the notification now references the appointment it's about.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Timestamps & relationships the notification schema was missing.
--    (created_at may already exist from 0004 — add-if-not-exists is idempotent.)
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists created_at     timestamptz default now(),
  add column if not exists updated_at     timestamptz default now(),
  add column if not exists read_at        timestamptz,
  add column if not exists appointment_id uuid references public.appointments(id) on delete cascade,
  add column if not exists sender_id      uuid references public.profiles(id)     on delete set null;

alter table public.appointments
  add column if not exists updated_at timestamptz default now();

create index if not exists notifications_appointment_idx on public.notifications (appointment_id);

-- ---------------------------------------------------------------------------
-- 2. Keep updated_at fresh automatically (native trigger, not app-generated).
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notifications_touch on public.notifications;
create trigger notifications_touch before update on public.notifications
  for each row execute function public.touch_updated_at();

drop trigger if exists appointments_touch on public.appointments;
create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Atomic booking: insert the appointment AND the doctor's notification in a
--    single transaction. The function returns the new appointment id. Realtime
--    (logical replication) only publishes COMMITTED rows, so the doctor's
--    postgres_changes subscription fires exactly once, and only on success.
-- ---------------------------------------------------------------------------
create or replace function public.book_appointment(
  p_doctor_id    text,
  p_doctor_name  text,
  p_specialty    text,
  p_patient_id   uuid,
  p_patient_name text,
  p_date_label   text,
  p_time_label   text,
  p_mode         text,
  p_fee          int,
  p_reason       text
)
returns table (appointment_id uuid, notification_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt           uuid;
  v_notif          text := gen_random_uuid()::text;
  v_doctor_profile uuid;
begin
  -- Target the notification at the doctor's auth profile when they have one;
  -- seed catalog doctors have none, so it stays a global (NULL) demo row.
  select profile_id into v_doctor_profile from public.doctors where id = p_doctor_id;

  insert into public.appointments
    (doctor_id, doctor_name, specialty, patient_id, patient_name,
     date_label, time_label, mode, status, fee, reason)
  values
    (p_doctor_id, p_doctor_name, p_specialty, p_patient_id, p_patient_name,
     p_date_label, p_time_label, p_mode, 'Pending', p_fee,
     coalesce(nullif(p_reason, ''), 'General consultation'))
  returning id into v_appt;

  insert into public.notifications
    (id, user_id, sender_id, appointment_id, title, body, kind, unread)
  values
    (v_notif, v_doctor_profile, p_patient_id, v_appt,
     'New appointment request',
     p_patient_name || ' booked a ' || p_mode || ' consultation for '
       || p_date_label || ' at ' || p_time_label || '.',
     'appointment', true);

  return query select v_appt, v_notif;
end;
$$;

grant execute on function public.book_appointment(
  text, text, text, uuid, text, text, text, text, int, text
) to anon, authenticated;
