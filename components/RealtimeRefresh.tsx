"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/* -------------------------------------------------------------------------
   Drop-in live refresher. Mount it on any Server-Component page and pass the
   tables whose changes should re-render that page:

     <RealtimeRefresh tables={["appointments"]} />

   It subscribes to Postgres changes on those tables and calls router.refresh()
   — which re-runs the server component and streams fresh data down — so lists
   update the moment a row is inserted/updated/deleted, with no manual reload.

   The refresh is debounced so a burst of changes (e.g. an appointment plus its
   notification) triggers a single refetch. No-ops when Supabase isn't wired up.

   Requires the tables to be on the `supabase_realtime` publication — see
   migration 0009_realtime_tables.sql.
   ---------------------------------------------------------------------- */
export function RealtimeRefresh({ tables }: { tables: string[] }) {
  const router = useRouter();
  // Join the list so the effect re-subscribes only when the set truly changes,
  // not on every render (a new array literal each time would thrash it).
  const key = tables.join(",");

  useEffect(() => {
    if (!isSupabaseConfigured || tables.length === 0) return;
    // Import the Supabase client lazily (inside the effect) rather than at module
    // top level. That keeps the ~240KB realtime library off the page's initial
    // hydration path — it loads after first paint, so taps stay responsive on
    // slow mobile devices instead of waiting for that JS to parse/execute.
    let cancelled = false;
    let sb: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    import("@/lib/supabase/client").then(({ createClient }) => {
      if (cancelled) return;
      sb = createClient();

      const bump = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 250);
      };

      channel = sb.channel(`refresh:${key}`);
      for (const table of tables) {
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          bump
        );
      }
      channel.subscribe();
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (sb && channel) sb.removeChannel(channel);
    };
    // `tables` is captured via the stable `key`; router is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
