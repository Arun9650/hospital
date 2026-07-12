import { DoctorShell } from "@/components/roleShells";
import { AvailabilityClient } from "@/components/AvailabilityClient";
import { getCurrentDoctor, getDoctorAvailability } from "@/lib/db";

export default async function AvailabilityPage() {
  // Resolve the signed-in doctor's real catalog id (was hardcoded to
  // "dr-anaya-rao", which failed the availability FK for every other doctor and
  // silently dropped the save). Load their saved hours so the editor reflects
  // what's actually stored instead of resetting to defaults on every reload.
  const doctor = await getCurrentDoctor();
  const initial = doctor ? await getDoctorAvailability(doctor.id) : [];

  return (
    <DoctorShell>
      <AvailabilityClient doctorId={doctor?.id ?? ""} initial={initial} />
    </DoctorShell>
  );
}
