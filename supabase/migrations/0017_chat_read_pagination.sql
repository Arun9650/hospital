-- ===========================================================================
-- Aria Health — chat read receipts + message pagination (§4.1.3, §5.3).
-- Run AFTER 0014. Safe to re-run.
--
-- Adds `read_at` for read receipts, and a `recent_chat_messages` RPC that
-- returns only the most-recent N messages per thread in ONE round trip (window
-- function) so a long history no longer loads in full. Older messages are
-- fetched on demand by a plain range query in loadOlderChatMessages (RLS on
-- chat_messages already scopes both to thread participants).
--
-- Read status propagates live via a Realtime *broadcast* event (same channel as
-- typing), not a postgres UPDATE subscription — so no publication change here.
-- Marking read is a normal participant UPDATE, already permitted by the
-- "chat_messages update" policy in 0014.
-- ===========================================================================

alter table public.chat_messages add column if not exists read_at timestamptz;

-- Most-recent p_limit messages per thread, one query. SECURITY INVOKER so the
-- caller's RLS still applies (they only see threads they participate in).
create or replace function public.recent_chat_messages(p_thread_ids uuid[], p_limit int default 50)
returns setof public.chat_messages
language sql stable security invoker set search_path = public as $$
  select id, thread_id, sender, body, created_at, read_at
  from (
    select m.*, row_number() over (partition by m.thread_id order by m.created_at desc) as rn
    from public.chat_messages m
    where m.thread_id = any(p_thread_ids)
  ) ranked
  where ranked.rn <= greatest(p_limit, 1)
$$;

grant execute on function public.recent_chat_messages(uuid[], int) to authenticated;
