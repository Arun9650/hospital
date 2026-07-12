"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
    const sb = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const bump = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };

    const channel = sb.channel(`refresh:${key}`);
    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        bump
      );
    }
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      sb.removeChannel(channel);
    };
    // `tables` is captured via the stable `key`; router is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
