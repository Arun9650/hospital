import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { NotificationsRealtime } from "@/components/NotificationsRealtime";
import { PushSubscribe } from "@/components/PushSubscribe";
import { getDoctorNotifications } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function DoctorNotifications() {
  const userId = await getUserId();
  console.log("🚀 ~ DoctorNotifications ~ userId:", userId)
  const notifications = await getDoctorNotifications(userId);
  console.log("🚀 ~ DoctorNotifications ~ notifications:", notifications)
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
      <NotificationsRealtime initial={notifications} userId={userId} />
    </DoctorShell>
  );
}
