-- ===========================================================================
-- Aria Health — scope chat_* and verification_queue writes (last §5.2 items).
-- Run AFTER 0011. Safe to re-run.
--
-- 0011 scoped chat READS but left `with check (true)` on the FOR ALL policies,
-- so any authenticated user could insert a message into ANY thread — or a
-- message with sender='doctor' into their own thread, impersonating the doctor.
-- verification_queue was still fully world-readable + world-writable from 0001.
-- This splits chat writes per-command (binding message sender to the caller's
-- role in the thread) and makes verification_queue admin-only.
--
-- Verified against every write path in lib/actions/data.ts:
--   • chat_threads   — created ONLY by the patient (getOrCreatePatientThread,
--                       patient_id = auth.uid()); updated_at bumped by either
--                       participant on send.
--   • chat_messages  — inserted by sendChatMessage; sender is the caller.
--   • verification   — updated ONLY by decideVerification (admin); rows seeded.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- chat_threads
-- ---------------------------------------------------------------------------
drop policy if exists "chat_threads access" on public.chat_threads;

create policy "chat_threads select" on public.chat_threads
  for select to authenticated
  using (
    patient_id = auth.uid()
    or patient_id is null
    or public.is_doctor_profile(doctor_id)
    or public.profile_role() = 'admin'
  );

-- Only a patient opens their own thread (the sole creator today); admin override.
create policy "chat_threads insert" on public.chat_threads
  for insert to authenticated
  with check (patient_id = auth.uid() or public.profile_role() = 'admin');

-- Either participant bumps updated_at on send.
create policy "chat_threads update" on public.chat_threads
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

create policy "chat_threads delete" on public.chat_threads
  for delete to authenticated
  using (public.profile_role() = 'admin');

-- ---------------------------------------------------------------------------
-- chat_messages  (thread participation + sender bound to caller identity)
-- ---------------------------------------------------------------------------
drop policy if exists "chat_messages access" on public.chat_messages;

create policy "chat_messages select" on public.chat_messages
  for select to authenticated
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
  );

-- A patient in the thread may only post as 'patient'; the thread's doctor only
-- as 'doctor'. Blocks cross-thread injection AND same-thread impersonation.
create policy "chat_messages insert" on public.chat_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (
          (t.patient_id = auth.uid() and chat_messages.sender = 'patient')
          or (public.is_doctor_profile(t.doctor_id) and chat_messages.sender = 'doctor')
          or public.profile_role() = 'admin'
        )
    )
  );

create policy "chat_messages update" on public.chat_messages
  for update to authenticated
  using (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (
          t.patient_id = auth.uid()
          or public.is_doctor_profile(t.doctor_id)
          or public.profile_role() = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (
          t.patient_id = auth.uid()
          or public.is_doctor_profile(t.doctor_id)
          or public.profile_role() = 'admin'
        )
    )
  );

create policy "chat_messages delete" on public.chat_messages
  for delete to authenticated
  using (public.profile_role() = 'admin');

-- ---------------------------------------------------------------------------
-- verification_queue  (admin-only table: read AND write). 0011 left the read
-- world-open; only decideVerification (admin) writes, rows are seeded.
-- ---------------------------------------------------------------------------
drop policy if exists "read verification"       on public.verification_queue;
drop policy if exists "auth write verification" on public.verification_queue;

create policy "verification admin" on public.verification_queue
  for all to authenticated
  using (public.profile_role() = 'admin')
  with check (public.profile_role() = 'admin');
