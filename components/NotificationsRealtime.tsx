"use client";

import { useEffect, useState } from "react";
import { NotificationsView } from "./NotificationsView";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { relativeTime } from "@/lib/time";
import { markNotificationsRead } from "@/lib/actions/data";
import type { NotificationItem } from "@/lib/data";

/* -------------------------------------------------------------------------
   Live notifications list. It:
     • renders the server-fetched list (SSR, no flash),
     • subscribes to INSERTs on the notifications table and prepends new rows
       (newest first) — a booking appears the instant it happens, no reload,
     • recomputes each relative "time" label from createdAt on a 60s tick,
     • shows a live unread count and marks notifications read (records read_at).
   ---------------------------------------------------------------------- */

type NotificationRow = {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  kind: NotificationItem["kind"];
  unread: boolean;
  created_at?: string;
  appointment_id?: string | null;
};

function mapRow(r: NotificationRow): NotificationItem {
  const createdAt = r.created_at ? String(r.created_at) : undefined;
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    time: createdAt ? relativeTime(createdAt) : "just now",
    createdAt,
    kind: (r.kind as NotificationItem["kind"]) ?? "system",
    unread: Boolean(r.unread ?? true),
    appointmentId: r.appointment_id ? String(r.appointment_id) : undefined,
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
  // A ticking clock (null until mounted) so relative times stay fresh without
  // reading the clock during render. Until it's set we show the server-computed
  // labels, which keeps SSR and the first client render identical.
  const [now, setNow] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);

  // Live INSERTs → prepend to the top.
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
          // Only surface notifications addressed to me, plus global demo rows.
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

  // Keep relative times ("2m ago") fresh while the page stays open. The server
  // already rendered correct labels at load, so refreshing on the interval is
  // enough — no need to recompute synchronously on mount.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const unread = items.filter((n) => n.unread).length;

  // Once mounted, recompute the display time from createdAt against `now`.
  const view =
    now == null
      ? items
      : items.map((n) => (n.createdAt ? { ...n, time: relativeTime(n.createdAt, now) } : n));

  async function markAll() {
    if (!unread || marking) return;
    setMarking(true);
    setItems((prev) => prev.map((n) => ({ ...n, unread: false }))); // optimistic
    await markNotificationsRead();
    setMarking(false);
  }

  function markOne(id: string) {
    setItems((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target || !target.unread) return prev; // already read — no write
      markNotificationsRead([id]);
      return prev.map((n) => (n.id === id ? { ...n, unread: false } : n));
    });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-mute">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        <button
          className="btn btn-light btn-sm"
          onClick={markAll}
          disabled={!unread || marking}
        >
          Mark all as read
        </button>
      </div>
      <NotificationsView items={view} onItemClick={markOne} />
    </>
  );
}
