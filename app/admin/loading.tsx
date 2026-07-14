import { AdminShell } from "@/components/roleShells";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <AdminShell>
      <PageSkeleton />
    </AdminShell>
  );
}
