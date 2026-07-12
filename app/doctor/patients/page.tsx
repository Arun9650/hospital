import { DoctorShell } from "@/components/roleShells";
import { DoctorPatientsClient } from "@/components/DoctorPatientsClient";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { getCurrentDoctor, getDoctorPatients } from "@/lib/db";

export default async function DoctorPatients() {
  const doctor = await getCurrentDoctor();
  const patients = await getDoctorPatients(doctor?.id ?? "");

  return (
    <DoctorShell>
      <RealtimeRefresh tables={["appointments"]} />
      <DoctorPatientsClient patients={patients} />
    </DoctorShell>
  );
}
