import "server-only";
import webpush from "web-push";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/* -------------------------------------------------------------------------
   Server-side Web Push delivery. Sends a notification to every device a user
   has subscribed. No-ops (and never throws) when VAPID keys or Supabase are
   not configured, so the rest of the app keeps working without push.
   ---------------------------------------------------------------------- */

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const subject = process.env.VAPID_SUBJECT || "mailto:notifications@ariahealth.app";

/** Push is only live when both Supabase and a VAPID keypair are present. */
export const isPushConfigured = Boolean(
  isSupabaseConfigured && publicKey && privateKey
);

let vapidReady = false;
function ensureVapid() {
  if (!vapidReady) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
  }
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Deliver `payload` to all of `userId`'s subscribed devices. Best-effort. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isPushConfigured || !userId) return;
  try {
    console.log("🚀 ~ sendPushToUser ~ userId:", userId, "payload:", payload)
    ensureVapid();
    const sb = createPublicClient();
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (!subs?.length) return;

    const body = JSON.stringify(payload);
    console.log("🚀 ~ sendPushToUser ~ subs:", subs, "body:", body)
    await Promise.all(
      subs.map(async (s) => {
        try {
          console.log("🚀 ~ sendPushToUser ~ sending push to user", userId, "endpoint", s.endpoint);
          await webpush.sendNotification(
            { endpoint: String(s.endpoint), keys: { p256dh: String(s.p256dh), auth: String(s.auth) } },
            body
          );
        } catch (err) {
          console.log("⚠️ Push delivery failed for user", userId, "endpoint", s.endpoint, err);
          // Prune subscriptions the push service has retired (410 Gone / 404).
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 410 || code === 404) {
            await sb.from("push_subscriptions").delete().eq("endpoint", String(s.endpoint));
          }
        }
      })
    );
  } catch {
    /* push failures are non-fatal */
    console.log("⚠️ Push delivery failed for user", userId);
  }
}
