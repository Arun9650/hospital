-- ===========================================================================
-- Aria Health — close the last permissive write: notifications INSERT.
-- Run AFTER 0011/0012. Safe to re-run.
--
-- Before this, `notifications` INSERT stayed `with check (true)` because a
-- legitimate cross-user write exists: a doctor's action inserts the PATIENT's
-- notification (and a patient's cancel/reschedule inserts the DOCTOR's). That
-- also let any authenticated user POST a spoofed notification to anyone via the
-- REST API. This moves every runtime insert behind a SECURITY DEFINER RPC that
-- authorizes the caller↔target relationship, and locks the table so the client
-- can no longer insert notifications directly. Booking already inserts its
-- doctor notification via the security-definer book_appointment RPC (0007);
-- both bypass RLS the same way.
-- ===========================================================================

-- Does the current user (a patient) share an appointment with the doctor whose
-- auth profile is `target`? Mirror of doctor_sees_patient() for the reverse
-- direction (patient cancel/reschedule notifies their doctor).
create or replace function public.patient_notifies_doctor(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    where a.patient_id = auth.uid() and d.profile_id = target
  );
$$;

-- Authorized cross-user notification write. Bypasses RLS (security definer) but
-- only inserts when the caller is allowed to notify the target:
--   • self, or admin
--   • a doctor notifying one of their own patients   (doctor_sees_patient)
--   • a patient notifying a doctor they've booked     (patient_notifies_doctor)
-- Unauthorized targets are silently dropped — the notification is non-essential
-- and its parent write (prescription/appointment) already committed separately.
create or replace function public.create_notification(
  p_user_id uuid,
  p_title   text,
  p_body    text,
  p_kind    text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then
    if public.profile_role() <> 'admin' then return; end if;   -- global demo rows: admin only
  elsif not (
    p_user_id = auth.uid()
    or public.profile_role() = 'admin'
    or public.doctor_sees_patient(p_user_id)
    or public.patient_notifies_doctor(p_user_id)
  ) then
    return;
  end if;

  insert into public.notifications (id, user_id, sender_id, title, body, time_label, kind, unread)
  values (gen_random_uuid()::text, p_user_id, auth.uid(), p_title, p_body, 'Just now', p_kind, true);
end;
$$;

grant execute on function public.create_notification(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Split the FOR ALL "notifications access" (from 0011) into per-command policies
-- so INSERT is locked while read/mark-as-read stay scoped. SELECT/UPDATE/DELETE
-- keep the null-owner demo rows visible & markable; INSERT is denied to the
-- client entirely (create_notification() + book_appointment() bypass RLS).
-- ---------------------------------------------------------------------------
drop policy if exists "notifications access" on public.notifications;

create policy "notifications select" on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or user_id is null or public.profile_role() = 'admin');

create policy "notifications insert" on public.notifications
  for insert to authenticated
  with check (false);

create policy "notifications update" on public.notifications
  for update to authenticated
  using (user_id = auth.uid() or user_id is null or public.profile_role() = 'admin')
  with check (user_id = auth.uid() or user_id is null or public.profile_role() = 'admin');

create policy "notifications delete" on public.notifications
  for delete to authenticated
  using (user_id = auth.uid() or public.profile_role() = 'admin');
