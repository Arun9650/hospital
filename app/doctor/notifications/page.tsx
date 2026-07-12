import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { NotificationsView } from "@/components/NotificationsView";
import { PushSubscribe } from "@/components/PushSubscribe";
import { getDoctorNotifications } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function DoctorNotifications() {
  const userId = await getUserId();
  const notifications = await getDoctorNotifications(userId);
  const unread = notifications.filter((n) => n.unread).length;
  return (
    <DoctorShell>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread update${unread === 1 ? "" : "s"}`}
        action={
          <div className="flex items-center gap-2">
            <PushSubscribe />
            <button className="btn btn-light btn-sm">Mark all as read</button>
          </div>
        }
      />
      <NotificationsView items={notifications} />
    </DoctorShell>
  );
}
