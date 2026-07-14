import { DoctorShell } from "@/components/roleShells";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <DoctorShell>
      <PageSkeleton />
    </DoctorShell>
  );
}
