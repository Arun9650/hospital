import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { NotificationsView } from "@/components/NotificationsView";
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
        action={<button className="btn btn-light btn-sm">Mark all as read</button>}
      />
      <NotificationsView items={notifications} />
    </PatientShell>
  );
}
