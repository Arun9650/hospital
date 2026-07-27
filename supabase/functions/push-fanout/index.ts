// push-fanout — delivers a new `notifications` row to the target user's phones
// via the Expo Push service. Triggered by a Database Webhook on
// public.notifications INSERT (see README.md). Runs out-of-client because it
// needs the service role key to read every device the user signed in on.
//
// Web browsers are handled separately by lib/push/send.ts (Web Push / VAPID);
// this function only touches native Expo rows in public.push_subscriptions —
// those with the key columns null (the Expo token lives in `endpoint`). One
// notification INSERT therefore reaches both transports without double-sending.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Set only if your Expo project enforces push security (Expo access token).
const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");

type NotificationRow = {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  kind: string;
};

Deno.serve(async (req) => {
  const payload = await req.json().catch(() => null);
  const row: NotificationRow | undefined = payload?.record;
  // Global demo rows (user_id null) target no specific device — skip.
  if (!row?.user_id) return new Response("no target", { status: 200 });

  // Expo rows only: web rows have p256dh/auth set and are sent via web-push.
  const { data: tokens } = await supabase
    .from("push_subscriptions")
    .select("endpoint")
    .eq("user_id", row.user_id)
    .is("p256dh", null);
  if (!tokens?.length) return new Response("no devices", { status: 200 });

  // No PHI in the payload — title/body are already generic; details live behind
  // auth. `data.kind` lets the app deep-link to the right screen on tap.
  const messages = tokens.map((t) => ({
    to: t.endpoint as string,
    title: row.title,
    body: row.body,
    sound: "default",
    data: { kind: row.kind, notificationId: row.id },
  }));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (expoToken) headers.Authorization = `Bearer ${expoToken}`;

  // Expo accepts up to 100 messages per request.
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(chunk),
    });
    const json = await res.json().catch(() => null);
    const tickets: Array<{ status?: string; details?: { error?: string } }> = json?.data ?? [];
    // Prune tokens Expo reports as retired so we stop pushing to dead devices.
    await Promise.all(
      tickets.map((tk, j) =>
        tk?.status === "error" && tk?.details?.error === "DeviceNotRegistered"
          ? supabase.from("push_subscriptions").delete().eq("endpoint", chunk[j].to)
          : Promise.resolve(),
      ),
    );
  }

  return new Response("ok", { status: 200 });
});
