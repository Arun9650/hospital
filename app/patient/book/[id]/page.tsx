import Link from "next/link";
import { PatientShell } from "@/components/roleShells";
import { BookingWizardClient } from "@/components/BookingWizardClient";
import { getDoctor, getDoctorAvailability } from "@/lib/db";
import { buildBookingDays } from "@/lib/booking";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getDoctor(id);
  const availability = doctor ? await getDoctorAvailability(doctor.id) : [];
  const days = buildBookingDays(availability);

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
      <BookingWizardClient doctor={doctor} days={days} />
    </PatientShell>
  );
}
