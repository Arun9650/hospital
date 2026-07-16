import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { AdminVerificationClient } from "@/components/AdminVerificationClient";
import { getVerificationQueue } from "@/lib/db";

export default async function AdminVerification() {
  const queue = await getVerificationQueue();
  return (
    <AdminShell>
      <PageHeader
        title="Verification queue"
        subtitle={`${queue.length} doctors awaiting review`}
      />
      <AdminVerificationClient queue={queue} />
    </AdminShell>
  );
}
