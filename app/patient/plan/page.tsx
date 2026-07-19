import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { PlanClient } from "@/components/PlanClient";

export default function PlanPage() {
  return (
    <PatientShell>
      <PageHeader
        title="Aria Plus"
        subtitle="Unlimited consults, priority matching and member discounts — one flat monthly fee."
      />
      <PlanClient />
    </PatientShell>
  );
}
