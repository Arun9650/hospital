import { NotificationItem } from "@/lib/data";

const kindMeta: Record<NotificationItem["kind"], { icon: string; bg: string }> = {
  appointment: { icon: "📅", bg: "bg-[#eaf3fc]" },
  prescription: { icon: "℞", bg: "bg-[#e5f5ee]" },
  payment: { icon: "💳", bg: "bg-[#fdf1dc]" },
  system: { icon: "🔔", bg: "bg-surface-card" },
};

export function NotificationsView({ items }: { items: NotificationItem[] }) {
  return (
    <div className="card-flat divide-y divide-[#f0f0f0]">
      {items.map((n) => {
        const meta = kindMeta[n.kind];
        return (
          <div
            key={n.id}
            className={`flex items-start gap-4 p-5 ${n.unread ? "bg-[#f7fbff]" : ""}`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${meta.bg}`}>
              {meta.icon}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{n.title}</p>
                {n.unread && <span className="h-2 w-2 rounded-full bg-ps" />}
              </div>
              <p className="mt-0.5 text-sm text-body-light">{n.body}</p>
              <p className="mt-1 text-xs text-mute">{n.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
