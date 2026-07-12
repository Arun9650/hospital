import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { NotificationsRealtime } from "@/components/NotificationsRealtime";
import { PushSubscribe } from "@/components/PushSubscribe";
import { getDoctorNotifications } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function DoctorNotifications() {
  const userId = await getUserId();
  const notifications = await getDoctorNotifications(userId);
  return (
    <DoctorShell>
      <PageHeader
        title="Notifications"
        subtitle="Requests, confirmations and account updates."
        action={<PushSubscribe />}
      />
      <NotificationsRealtime initial={notifications} userId={userId} perspective="doctor" />
    </DoctorShell>
  );
}
