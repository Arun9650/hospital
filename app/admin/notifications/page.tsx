import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { NotificationsView } from "@/components/NotificationsView";
import { Button } from "@/components/ui";
import { NotificationItem } from "@/lib/data";

const adminNotifications: NotificationItem[] = [
  { id: "an1", title: "5 doctors awaiting verification", body: "New credential submissions need review in the verification queue.", time: "20 min ago", kind: "system", unread: true },
  { id: "an2", title: "Revenue milestone reached", body: "Platform crossed $420k in monthly revenue — a new record.", time: "3 hours ago", kind: "payment", unread: true },
  { id: "an3", title: "Cancellation rate stable", body: "Weekly cancellation rate held at 2.4%, within target.", time: "Yesterday", kind: "appointment", unread: false },
  { id: "an4", title: "New content published", body: "The updated homepage hero and 2 FAQ entries are now live.", time: "2 days ago", kind: "system", unread: false },
];

export default function AdminNotifications() {
  return (
    <AdminShell>
      <PageHeader
        title="Notifications"
        subtitle="Platform alerts and operational updates."
        action={<Button>Compose broadcast</Button>}
      />
      <NotificationsView items={adminNotifications} />
    </AdminShell>
  );
}
