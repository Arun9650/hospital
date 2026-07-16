-- ===========================================================================
-- Aria Health — server-side rate limiting for write actions (§5.2, §4.1.1).
-- Run AFTER 0013. Safe to re-run.
--
-- Fixed-window counter shared across serverless instances (in-memory wouldn't
-- survive multiple lambdas / cold starts). A SECURITY DEFINER RPC stamps the
-- actor from auth.uid() and atomically increments the current window's count,
-- returning whether the caller is still under the limit. The table denies all
-- direct client access — only the RPC (running as definer) touches it.
--
-- Only our Server Actions call check_rate_limit, with limits baked into server
-- code (the client can't raise them). Keying on auth.uid() inside the RPC means
-- a client hitting the RPC directly can only spend its OWN budget.
--
-- ponytail: fixed window (not sliding) — a burst can straddle a boundary and
-- briefly allow up to 2× the limit. Fine for abuse prevention; swap to a
-- sliding-window/token-bucket RPC if precise smoothing is ever needed.
-- ===========================================================================

create table if not exists public.rate_limit (
  key          text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (key, window_start)
);

-- Old windows are dead weight; index the sweep and delete opportunistically.
create index if not exists rate_limit_window_idx on public.rate_limit (window_start);

alter table public.rate_limit enable row level security;
-- No policies → no direct client read/write. The definer RPC below is the only
-- accessor (service-role/seed bypass RLS as usual).

-- Increment the caller's counter for the current fixed window and report whether
-- they're still within `p_limit`. Returns true = allowed, false = throttled.
create or replace function public.check_rate_limit(
  p_action         text,
  p_limit          int,
  p_window_seconds int
) returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_key    text;
  v_window timestamptz;
  v_count  int;
begin
  if p_window_seconds <= 0 or p_limit <= 0 then
    return true; -- misconfigured caller → don't block
  end if;
  v_key := coalesce(auth.uid()::text, 'anon') || ':' || p_action;
  -- Floor now() to the window boundary so a whole window shares one row.
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  insert into public.rate_limit (key, window_start, count)
  values (v_key, v_window, 1)
  on conflict (key, window_start)
    do update set count = public.rate_limit.count + 1
  returning count into v_count;

  -- Opportunistic cleanup of stale windows for this key (cheap, bounded).
  delete from public.rate_limit
  where key = v_key and window_start < v_window;

  return v_count <= p_limit;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to authenticated;
