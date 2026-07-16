-- ===========================================================================
-- Aria Health — chat file/image attachments (§4.1.3).
-- Run AFTER 0017. Safe to re-run.
--
-- Adds attachment columns to chat_messages and a PRIVATE `chat-attachments`
-- bucket. Files land under `<thread_id>/…`; storage RLS mirrors chat_messages
-- (0014) — only a participant of that thread (or admin) may upload/read — and
-- URLs are minted per-read via createSignedUrl, like medical-records (0011).
--
-- The recent_chat_messages RPC (0017) returns `setof chat_messages`, so its
-- explicit column list must be widened to include the new columns.
-- ===========================================================================

alter table public.chat_messages add column if not exists attachment_path text;
alter table public.chat_messages add column if not exists attachment_name text;
alter table public.chat_messages add column if not exists attachment_type text; -- mime

-- Widen the paginator to the new row shape (column order matches the table).
create or replace function public.recent_chat_messages(p_thread_ids uuid[], p_limit int default 50)
returns setof public.chat_messages
language sql stable security invoker set search_path = public as $$
  select id, thread_id, sender, body, created_at, read_at,
         attachment_path, attachment_name, attachment_type
  from (
    select m.*, row_number() over (partition by m.thread_id order by m.created_at desc) as rn
    from public.chat_messages m
    where m.thread_id = any(p_thread_ids)
  ) ranked
  where ranked.rn <= greatest(p_limit, 1)
$$;

grant execute on function public.recent_chat_messages(uuid[], int) to authenticated;

-- ---------------------------------------------------------------------------
-- Private bucket + participant-scoped storage policies (path: <thread_id>/…).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

drop policy if exists "chat attach read"   on storage.objects;
drop policy if exists "chat attach insert" on storage.objects;

create policy "chat attach read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (
      public.profile_role() = 'admin'
      or exists (
        select 1 from public.chat_threads t
        where t.id::text = (storage.foldername(name))[1]
          and (t.patient_id = auth.uid() or public.is_doctor_profile(t.doctor_id))
      )
    )
  );

create policy "chat attach insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.chat_threads t
      where t.id::text = (storage.foldername(name))[1]
        and (
          t.patient_id = auth.uid()
          or public.is_doctor_profile(t.doctor_id)
          or public.profile_role() = 'admin'
        )
    )
  );
