-- ===========================================================================
-- Aria Health — write authorization for the clinical tables.
-- Run AFTER 0011. Safe to re-run. Complements 0011 (which scoped READS) by
-- splitting the permissive `... access` policies into per-command policies so
-- INSERT/UPDATE/DELETE are constrained to who may actually perform them.
--
-- Verified against every write path in lib/actions/*:
--   • appointments   — created ONLY via the security-definer book_appointment
--                       RPC (bypasses RLS); direct inserts are locked to the
--                       booking patient. Updates (accept/decline, cancel,
--                       reschedule) are limited to the patient or the doctor.
--   • prescriptions  — issued ONLY by doctors (issuePrescription*).
--   • medical_records— uploaded ONLY by the owning patient (uploadMedicalRecord).
--
-- Intentionally left permissive (documented): notifications INSERT, because a
-- doctor's action legitimately inserts the PATIENT's notification (notify()).
-- Moving that to a security-definer RPC is the next hardening step. chat_* and
-- catalog write policies are unchanged.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
drop policy if exists "appointments access" on public.appointments;

create policy "appointments select" on public.appointments
  for select to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.is_doctor_profile(doctor_id)
    or public.profile_role() = 'admin'
  );

create policy "appointments insert" on public.appointments
  for insert to authenticated
  with check (patient_id = auth.uid() or public.profile_role() in ('doctor', 'admin'));

create policy "appointments update" on public.appointments
  for update to authenticated
  using (
    patient_id = auth.uid()
    or public.is_doctor_profile(doctor_id)
    or public.profile_role() = 'admin'
  )
  with check (
    patient_id = auth.uid()
    or public.is_doctor_profile(doctor_id)
    or public.profile_role() = 'admin'
  );

create policy "appointments delete" on public.appointments
  for delete to authenticated
  using (public.profile_role() = 'admin');

-- ---------------------------------------------------------------------------
-- prescriptions  (issued by doctors; patients/admin read)
-- ---------------------------------------------------------------------------
drop policy if exists "prescriptions access" on public.prescriptions;

create policy "prescriptions select" on public.prescriptions
  for select to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.is_my_appointment_doctor(appointment_id)
    or public.profile_role() = 'admin'
  );

create policy "prescriptions insert" on public.prescriptions
  for insert to authenticated
  with check (public.profile_role() in ('doctor', 'admin'));

create policy "prescriptions update" on public.prescriptions
  for update to authenticated
  using (public.is_my_appointment_doctor(appointment_id) or public.profile_role() = 'admin')
  with check (public.profile_role() in ('doctor', 'admin'));

create policy "prescriptions delete" on public.prescriptions
  for delete to authenticated
  using (public.profile_role() = 'admin');

-- ---------------------------------------------------------------------------
-- medical_records  (owner uploads/manages; admin oversight)
-- ---------------------------------------------------------------------------
drop policy if exists "records access" on public.medical_records;

create policy "records select" on public.medical_records
  for select to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.profile_role() = 'admin'
  );

create policy "records insert" on public.medical_records
  for insert to authenticated
  with check (patient_id = auth.uid());

create policy "records update" on public.medical_records
  for update to authenticated
  using (patient_id = auth.uid() or public.profile_role() = 'admin')
  with check (patient_id = auth.uid() or public.profile_role() = 'admin');

create policy "records delete" on public.medical_records
  for delete to authenticated
  using (patient_id = auth.uid() or public.profile_role() = 'admin');
