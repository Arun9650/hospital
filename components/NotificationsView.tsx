import { NotificationItem } from "@/lib/data";
import { EmptyState } from "./ui";

const kindMeta: Record<NotificationItem["kind"], { icon: string; bg: string }> = {
  appointment: { icon: "📅", bg: "bg-[#eaf3fc]" },
  prescription: { icon: "℞", bg: "bg-[#e5f5ee]" },
  payment: { icon: "💳", bg: "bg-[#fdf1dc]" },
  system: { icon: "🔔", bg: "bg-surface-card" },
};

export function NotificationsView({
  items,
  onItemClick,
}: {
  items: NotificationItem[];
  /** When provided, each row is clickable (used to mark it as read). */
  onItemClick?: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        body="Appointment requests, confirmations and account updates will appear here."
      />
    );
  }

  return (
    <div className="card-flat divide-y divide-[#f0f0f0]">
      {items.map((n) => {
        const meta = kindMeta[n.kind];
        const inner = (
          <>
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${meta.bg}`}
            >
              {meta.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{n.title}</p>
                {n.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-ps" />}
              </div>
              <p className="mt-0.5 text-sm text-body-light">{n.body}</p>
              <p className="mt-1 text-xs text-mute">{n.time}</p>
            </div>
          </>
        );
        const base = `flex w-full items-start gap-4 p-5 text-left ${n.unread ? "bg-[#f7fbff]" : ""}`;
        return onItemClick ? (
          <button
            key={n.id}
            onClick={() => onItemClick(n.id)}
            className={`${base} transition-colors hover:bg-[#eef6ff]`}
          >
            {inner}
          </button>
        ) : (
          <div key={n.id} className={base}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
