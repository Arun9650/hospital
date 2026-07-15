import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { AuditLogClient } from "@/components/AuditLogClient";
import { getAuditLog } from "@/lib/db";

export default async function AdminAudit() {
  const { entries, total } = await getAuditLog();
  return (
    <AdminShell>
      <PageHeader
        title="Audit log"
        subtitle={`${total} recorded action${total === 1 ? "" : "s"} across the platform`}
      />
      <AuditLogClient initial={entries} total={total} />
    </AdminShell>
  );
}
