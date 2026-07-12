"use client";

import { useEffect, useState } from "react";
import { NotificationsView } from "./NotificationsView";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { NotificationItem } from "@/lib/data";

/* -------------------------------------------------------------------------
   Renders the notifications list and keeps it live: subscribes to INSERTs on
   the notifications table and prepends new rows to the top (newest first), so
   a booking / accepted request / issued prescription appears the moment it
   happens — no reload. Falls back to the server-rendered list when Supabase or
   Realtime isn't available.
   ---------------------------------------------------------------------- */

type NotificationRow = {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  time_label: string;
  kind: NotificationItem["kind"];
  unread: boolean;
};

function mapRow(r: NotificationRow): NotificationItem {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    time: String(r.time_label ?? "Just now"),
    kind: (r.kind as NotificationItem["kind"]) ?? "system",
    unread: Boolean(r.unread ?? true),
  };
}

export function NotificationsRealtime({
  initial,
  userId,
}: {
  initial: NotificationItem[];
  userId?: string;
}) {
  const [items, setItems] = useState<NotificationItem[]>(initial);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = createClient();
    const channel = sb
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          // Surface only notifications addressed to me, plus global demo rows
          // (user_id null). Skip everyone else's.
          const mine = !row.user_id || (userId ? row.user_id === userId : false);
          if (!mine) return;
          setItems((prev) =>
            prev.some((n) => n.id === String(row.id)) ? prev : [mapRow(row), ...prev]
          );
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [userId]);

  return <NotificationsView items={items} />;
}
