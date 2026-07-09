import Link from "next/link";
import { PatientShell } from "@/components/roleShells";
import { BookingWizardClient } from "@/components/BookingWizardClient";
import { getDoctor } from "@/lib/db";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getDoctor(id);

  if (!doctor) {
    return (
      <PatientShell>
        <p className="text-mute">
          Doctor not found.{" "}
          <Link href="/patient/doctors" className="text-ps">
            Browse doctors
          </Link>
        </p>
      </PatientShell>
    );
  }

  return (
    <PatientShell>
      <BookingWizardClient doctor={doctor} />
    </PatientShell>
  );
}
