import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { NotificationsRealtime } from "@/components/NotificationsRealtime";
import { PushSubscribe } from "@/components/PushSubscribe";
import { getNotifications } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function PatientNotifications() {
  const userId = await getUserId();
  const notifications = await getNotifications(userId);
  const unread = notifications.filter((n) => n.unread).length;
  return (
    <PatientShell>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread updates`}
        action={
          <div className="flex items-center gap-2">
            <PushSubscribe />
            <button className="btn btn-light btn-sm">Mark all as read</button>
          </div>
        }
      />
      <NotificationsRealtime initial={notifications} userId={userId} />
    </PatientShell>
  );
}
