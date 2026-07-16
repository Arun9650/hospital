-- ===========================================================================
-- Aria Health — race-safe slot booking (PRD 6.4.1, §10 consistency).
-- Run AFTER 0007. Safe to re-run.
--
-- Two layers:
--   1. HARD guarantee — a partial unique index so at most ONE active
--      (Pending/Upcoming) appointment can exist per doctor+slot. This makes
--      concurrent bookings race-safe at the DB level: the first insert wins,
--      the second raises unique_violation (23505). book_appointment already
--      inserts inside one transaction, so this needs no app-level locking.
--   2. SOFT-LOCK — a 5-minute hold taken when a patient selects a slot, so two
--      people don't both fill out the form and one loses at the very end. This
--      is UX only; the unique index is the real guarantee.
--
-- The slot key is (doctor_id, date_label, time_label). date_label/time_label are
-- free text today ("Today, Jul 16" / "4:15 PM"); they are the de-facto slot key
-- the booking flow already uses, so uniqueness keys off them.
-- ===========================================================================

-- Defensive: if legacy duplicate active slots already exist (pre-constraint),
-- keep the oldest and cancel the rest so the unique index can be created.
update public.appointments a
set status = 'Cancelled'
where a.status in ('Pending', 'Upcoming')
  and exists (
    select 1 from public.appointments b
    where b.doctor_id = a.doctor_id
      and b.date_label = a.date_label
      and b.time_label = a.time_label
      and b.status in ('Pending', 'Upcoming')
      and b.created_at < a.created_at
  );

create unique index if not exists appointments_active_slot_uniq
  on public.appointments (doctor_id, date_label, time_label)
  where status in ('Pending', 'Upcoming');

-- ---------------------------------------------------------------------------
-- Soft-lock table: a short hold on a slot during checkout. No client policies —
-- only the SECURITY DEFINER RPCs below touch it.
-- ---------------------------------------------------------------------------
create table if not exists public.slot_locks (
  doctor_id    text        not null,
  slot_key     text        not null,          -- date_label || '|' || time_label
  locked_by    uuid,
  locked_until timestamptz not null,
  primary key (doctor_id, slot_key)
);

alter table public.slot_locks enable row level security;

-- Acquire or renew a 5-minute lock on a slot. Returns true if the caller holds
-- it afterwards, false if someone else holds an unexpired lock or it's already
-- booked. Atomic: the INSERT ... ON CONFLICT resolves concurrent lockers.
create or replace function public.lock_slot(
  p_doctor_id  text,
  p_date_label text,
  p_time_label text
) returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_key   text        := p_date_label || '|' || p_time_label;
  v_uid   uuid        := auth.uid();
  v_until timestamptz := now() + interval '5 minutes';
begin
  if v_uid is null then
    return false;
  end if;
  -- Already booked by anyone → not lockable.
  if exists (
    select 1 from public.appointments
    where doctor_id = p_doctor_id and date_label = p_date_label
      and time_label = p_time_label and status in ('Pending', 'Upcoming')
  ) then
    return false;
  end if;
  insert into public.slot_locks (doctor_id, slot_key, locked_by, locked_until)
  values (p_doctor_id, v_key, v_uid, v_until)
  on conflict (doctor_id, slot_key) do update
    set locked_by = v_uid, locked_until = v_until
    where public.slot_locks.locked_until < now()   -- expired → takeable
       or public.slot_locks.locked_by = v_uid;      -- our own → renew
  -- Did we end up holding it?
  return exists (
    select 1 from public.slot_locks
    where doctor_id = p_doctor_id and slot_key = v_key
      and locked_by = v_uid and locked_until > now()
  );
end;
$$;

grant execute on function public.lock_slot(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- book_appointment: release the caller's soft-lock once the booking commits.
-- (Same body as 0007 plus the cleanup; the unique index enforces race-safety —
-- a taken slot raises 23505, which the booking action surfaces to the user.)
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

  -- Booking committed → the soft-lock is no longer needed.
  delete from public.slot_locks
  where doctor_id = p_doctor_id and slot_key = p_date_label || '|' || p_time_label;

  return query select v_appt, v_notif;
end;
$$;

grant execute on function public.book_appointment(
  text, text, text, uuid, text, text, text, text, int, text
) to anon, authenticated;
