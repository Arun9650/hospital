import type { createServerSupabase } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

/**
 * Append an audit row via the security-definer log_audit RPC (0016), which
 * stamps the actor from the session. Best-effort: an audit failure must never
 * break the primary action, so this swallows errors. Pass the caller's existing
 * client — callers only reach their write path when Supabase is configured.
 */
export async function logAudit(
  sb: ServerClient,
  action: string,
  targetType: string,
  targetId: string | null,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await sb.rpc("log_audit", {
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_meta: meta,
    });
  } catch {
    // best-effort
  }
}
