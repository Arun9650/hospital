import { PatientShell } from "@/components/roleShells";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <PatientShell>
      <PageSkeleton />
    </PatientShell>
  );
}
