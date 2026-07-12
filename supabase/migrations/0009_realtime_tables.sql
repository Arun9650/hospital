-- ===========================================================================
-- Aria Health — stream appointments & prescriptions over Realtime
-- Run AFTER 0001. Safe to re-run. Lets the app live-refresh the doctor's
-- requests/patients lists and the patient's appointments/prescriptions the
-- moment a row changes, instead of requiring a manual page reload.
-- ===========================================================================

do $$
declare
  t text;
begin
  foreach t in array array['appointments', 'prescriptions'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
