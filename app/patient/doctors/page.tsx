import { PatientShell } from "@/components/roleShells";
import { DoctorSearchClient } from "@/components/DoctorSearchClient";
import { getSpecialties, searchDoctors } from "@/lib/db";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const specialties = await getSpecialties();
  const initialSpecialty = sp.specialty
    ? specialties.find((s) => s.slug === sp.specialty)?.name ?? ""
    : "";
  const initialQuery = sp.q ?? "";

  // SSR the first page with the same filters the client initializes with, so the
  // client can skip its opening fetch and there's no loading flash.
  const page = await searchDoctors({
    q: initialQuery || undefined,
    specialties: initialSpecialty ? [initialSpecialty] : undefined,
  });

  return (
    <PatientShell>
      <DoctorSearchClient
        specialties={specialties}
        initialDoctors={page.doctors}
        initialTotal={page.total}
        initialQuery={initialQuery}
        initialSpecialty={initialSpecialty}
      />
    </PatientShell>
  );
}
