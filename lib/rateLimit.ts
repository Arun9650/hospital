import type { createServerSupabase } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

/**
 * Consume one unit of the caller's budget for `action` and report whether they
 * are still within `limit` per `windowSec` (fixed window, keyed on the session
 * actor inside the check_rate_limit RPC — 0019). Fail-OPEN: a rate-limiter
 * outage must not lock users out of the app, so any error allows the action.
 * Pass the caller's existing auth-aware client (limits are only enforced when
 * Supabase is configured, i.e. when there's a real client to pass).
 */
export async function allowAction(
  sb: ServerClient,
  action: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  try {
    const { data, error } = await sb.rpc("check_rate_limit", {
      p_action: action,
      p_limit: limit,
      p_window_seconds: windowSec,
    });
    if (error) return true; // fail-open on infra error
    return data !== false;
  } catch {
    return true;
  }
}
