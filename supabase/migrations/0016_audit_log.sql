-- ===========================================================================
-- Aria Health — audit logging for critical clinical/admin actions (§5.2).
-- Run AFTER 0011. Safe to re-run.
--
-- Append-only trail of who did what: prescription issuance, verification
-- decisions, appointment status changes, record uploads. Writes go through a
-- SECURITY DEFINER RPC that stamps actor_id = auth.uid() server-side (the client
-- can't forge the actor), and the table itself denies direct client INSERT — so
-- a row, once written, reflects a real authenticated action. Reads are
-- admin-only. Same tamper-resistant shape as create_notification (0013).
--
-- At-rest encryption of PHI is the remaining, heavier §5.2 item and is NOT in
-- scope here; audit meta deliberately stores identifiers, not clinical content.
-- ===========================================================================

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  meta        jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id);

alter table public.audit_log enable row level security;

-- Admin-only read; no direct client writes (the RPC below, running as definer,
-- is the only writer — service-role seed/imports bypass RLS as usual).
drop policy if exists "audit_log read"  on public.audit_log;
drop policy if exists "audit_log write" on public.audit_log;
create policy "audit_log read" on public.audit_log
  for select to authenticated
  using (public.profile_role() = 'admin');
create policy "audit_log write" on public.audit_log
  for insert to authenticated
  with check (false);

-- Append one audit row, actor stamped from the caller's session. SECURITY
-- DEFINER so it bypasses the deny-all INSERT policy; nothing else can write.
create or replace function public.log_audit(
  p_action      text,
  p_target_type text,
  p_target_id   text,
  p_meta        jsonb
) returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_meta, '{}'::jsonb));
$$;

grant execute on function public.log_audit(text, text, text, jsonb) to authenticated;
