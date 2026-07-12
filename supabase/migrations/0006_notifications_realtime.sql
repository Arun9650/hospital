-- ===========================================================================
-- Aria Health — stream notifications over Realtime
-- Run AFTER 0001_schema.sql (and ideally 0004_notifications.sql). Safe to re-run.
-- Adds the notifications table to the supabase_realtime publication so newly
-- inserted rows (a new booking, an accepted request, an issued prescription…)
-- push to open notification screens live, without a reload.
-- ===========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
