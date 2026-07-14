-- ===========================================================================
-- Aria Health — role-aware RLS for the PHI/operational tables + private
-- medical-records bucket. Run AFTER 0001/0002/0010. Safe to re-run.
--
-- Scope of THIS migration: READ isolation. It replaces the demo-permissive
-- "everything world-readable" policies with participant/role-scoped SELECT so a
-- patient sees only their own rows (plus the seeded NULL-patient demo rows that
-- keep the mock experience intact), a doctor sees rows tied to them, and an
-- admin sees everything. Seeded demo rows (patient_id / user_id IS NULL) stay
-- visible to any signed-in user.
--
-- Authorisation source is public.profiles.role (set by the sign-up trigger with
-- a CHECK constraint), NOT auth.jwt user_metadata (which is user-editable).
--
-- DEFERRED (documented, not done here): tightening WRITES. The insert/update
-- checks stay permissive (`with check (true)`) because several legitimate flows
-- write cross-user — a doctor's action inserts the PATIENT's notification, and
-- booking goes through a security-definer RPC. Scoping writes safely is a
-- separate step; this migration closes the confidentiality (read) leak.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Security-definer helpers. SECURITY DEFINER means they bypass RLS on the
-- tables they read, so using them inside policies can't recurse.
-- ---------------------------------------------------------------------------
create or replace function public.profile_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Is the current user the doctor behind this catalog doctor_id?
create or replace function public.is_doctor_profile(doc_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.doctors d
    where d.id = doc_id and d.profile_id = auth.uid()
  );
$$;

-- Is the current user the doctor on this appointment? (for prescriptions)
create or replace function public.is_my_appointment_doctor(appt_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    where a.id = appt_id and d.profile_id = auth.uid()
  );
$$;

-- Does the current user (a doctor) have any appointment with this patient?
-- Lets a doctor read the profile fields of their own patients (panel join).
create or replace function public.doctor_sees_patient(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    where a.patient_id = pid and d.profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
drop policy if exists "read appointments"  on public.appointments;
drop policy if exists "write appointments" on public.appointments;
create policy "appointments access" on public.appointments
  for all to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.is_doctor_profile(doctor_id)
    or public.profile_role() = 'admin'
  )
  with check (true);

-- ---------------------------------------------------------------------------
-- prescriptions
-- ---------------------------------------------------------------------------
drop policy if exists "read prescriptions"  on public.prescriptions;
drop policy if exists "write prescriptions" on public.prescriptions;
create policy "prescriptions access" on public.prescriptions
  for all to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.is_my_appointment_doctor(appointment_id)
    or public.profile_role() = 'admin'
  )
  with check (true);

-- ---------------------------------------------------------------------------
-- medical_records  (doctor-side access deferred; owner + admin + demo only)
-- ---------------------------------------------------------------------------
drop policy if exists "read records"  on public.medical_records;
drop policy if exists "write records" on public.medical_records;
create policy "records access" on public.medical_records
  for all to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.profile_role() = 'admin'
  )
  with check (true);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
drop policy if exists "read notifications"  on public.notifications;
drop policy if exists "write notifications" on public.notifications;
create policy "notifications access" on public.notifications
  for all to authenticated
  using (
    user_id = auth.uid()
    or user_id is null
    or public.profile_role() = 'admin'
  )
  with check (true);

-- ---------------------------------------------------------------------------
-- chat_threads / chat_messages  (policies from 0002 were world-readable)
-- ---------------------------------------------------------------------------
drop policy if exists "read chat_threads"  on public.chat_threads;
drop policy if exists "write chat_threads" on public.chat_threads;
create policy "chat_threads access" on public.chat_threads
  for all to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.is_doctor_profile(doctor_id)
    or public.profile_role() = 'admin'
  )
  with check (true);

drop policy if exists "read chat_messages"  on public.chat_messages;
drop policy if exists "write chat_messages" on public.chat_messages;
create policy "chat_messages access" on public.chat_messages
  for all to authenticated
  using (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (
          t.patient_id = auth.uid()
          or t.patient_id is null
          or public.is_doctor_profile(t.doctor_id)
          or public.profile_role() = 'admin'
        )
    )
  )
  with check (true);

-- ---------------------------------------------------------------------------
-- profiles: self + admin + a doctor who treats this patient (panel join).
-- Keeps the existing owner insert/update policies from 0001.
-- ---------------------------------------------------------------------------
drop policy if exists "read profiles" on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.profile_role() = 'admin'
    or public.doctor_sees_patient(id)
  );

-- ===========================================================================
-- Medical records storage → private bucket + owner/admin read.
-- Uploads stay owner-scoped (0010). URLs are now minted per-read via
-- createSignedUrl() in lib/db.getMedicalRecords.
-- ===========================================================================
update storage.buckets set public = false where id = 'medical-records';

drop policy if exists "records read" on storage.objects;
create policy "records read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'medical-records'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.profile_role() = 'admin'
    )
  );
