-- ===========================================================================
-- Aria Health — consultation file sharing (Supabase Storage)
-- Run in the SQL editor. Creates the bucket that in-call file uploads land in
-- and the policies that let signed-in users upload + read them.
--
-- The bucket is PUBLIC so a shared link works for both parties without minting
-- signed URLs. For real medical files, make it private and switch the client to
-- createSignedUrl() before production — see the note in SUPABASE_SETUP.md.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('consultation-files', 'consultation-files', true)
on conflict (id) do nothing;

-- Authenticated users can upload into this bucket.
drop policy if exists "consultation upload" on storage.objects;
create policy "consultation upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'consultation-files');

-- Anyone can read (bucket is public; this also covers listing).
drop policy if exists "consultation read" on storage.objects;
create policy "consultation read"
  on storage.objects for select
  using (bucket_id = 'consultation-files');
