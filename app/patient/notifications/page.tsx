import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { NotificationsRealtime } from "@/components/NotificationsRealtime";
import { PushSubscribe } from "@/components/PushSubscribe";
import { getNotifications } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function PatientNotifications() {
  const userId = await getUserId();
  const notifications = await getNotifications(userId);
  return (
    <PatientShell>
      <PageHeader
        title="Notifications"
        subtitle="Your appointments, prescriptions and account updates."
        action={<PushSubscribe />}
      />
      <NotificationsRealtime initial={notifications} userId={userId} />
    </PatientShell>
  );
}
