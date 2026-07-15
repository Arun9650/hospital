-- ===========================================================================
-- Aria Health — doctor-side access to a treated patient's medical records.
-- Run AFTER 0011/0012. Safe to re-run.
--
-- 0011/0012 scoped medical_records to the owning patient + admin. A doctor
-- needs to review a patient's uploaded reports/scans during a consultation, so
-- this extends the row SELECT and the private-bucket storage read to any doctor
-- who has an appointment with that patient — reusing the existing
-- doctor_sees_patient() helper (a doctor ↔ patient appointment exists). Uploads
-- stay owner-only (0010/0012); this grants READ only.
-- ===========================================================================

drop policy if exists "records select" on public.medical_records;
create policy "records select" on public.medical_records
  for select to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.doctor_sees_patient(patient_id)
    or public.profile_role() = 'admin'
  );

-- Storage: signed-URL reads of the file objects. Paths are `<patient_uid>/<file>`
-- (0010), so the first folder segment is the owning patient's id.
drop policy if exists "records read" on storage.objects;
create policy "records read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'medical-records'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.doctor_sees_patient((storage.foldername(name))[1]::uuid)
      or public.profile_role() = 'admin'
    )
  );
