"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Result = { ok: boolean };

/** The shape a browser PushSubscription serializes to via `.toJSON()`. */
type SerializedSubscription = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

/* Persist the current user's push subscription so the server can reach this
   device later. No-ops when Supabase isn't configured or nobody is signed in. */
export async function savePushSubscription(
  sub: SerializedSubscription,
  userAgent?: string
): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { ok: false }; // RLS: only authenticated users may subscribe

    await sb.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent ?? null,
      },
      { onConflict: "endpoint" }
    );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* Remove a subscription (e.g. the user turns notifications off). */
export async function deletePushSubscription(endpoint: string): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  if (!endpoint) return { ok: false };
  try {
    const sb = await createServerSupabase();
    await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
