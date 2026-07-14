-- ===========================================================================
-- Aria Health — patient-uploaded medical records (Supabase Storage)
-- Run AFTER 0001_schema.sql. Safe to re-run.
-- Adds file columns to medical_records and a bucket for patient uploads.
-- ===========================================================================

alter table public.medical_records add column if not exists file_url  text;
alter table public.medical_records add column if not exists file_path text;

-- Public bucket, matching consultation-files (0008). Uploads are namespaced by
-- the uploader's user id (first path segment), and the insert policy enforces
-- that so a user can only write into their own folder.
-- ponytail: public bucket = anyone with the URL can read. Real PHI should move to
-- a PRIVATE bucket + createSignedUrl() on read before production (pairs with the
-- role-aware RLS work). Kept public here for the demo, consistent with 0008.
insert into storage.buckets (id, name, public)
values ('medical-records', 'medical-records', true)
on conflict (id) do nothing;

drop policy if exists "records upload" on storage.objects;
create policy "records upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'medical-records'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "records read" on storage.objects;
create policy "records read"
  on storage.objects for select
  using (bucket_id = 'medical-records');
