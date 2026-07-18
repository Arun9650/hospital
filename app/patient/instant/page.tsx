import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { InstantConsultClient } from "@/components/InstantConsultClient";
import { getSpecialties } from "@/lib/db";

export default async function InstantConsultPage() {
  const specialties = await getSpecialties();
  return (
    <PatientShell>
      <PageHeader
        title="Consult now"
        subtitle="Get matched to the next available doctor — video, audio or chat, in under a minute."
      />
      <InstantConsultClient specialties={specialties.map((s) => s.name)} />
    </PatientShell>
  );
}
