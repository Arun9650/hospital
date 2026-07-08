import { DoctorShell } from "@/components/roleShells";
import { DoctorRequestsClient } from "@/components/DoctorRequestsClient";
import { getDoctorAppointments } from "@/lib/db";

export default async function DoctorAppointments() {
  const requests = await getDoctorAppointments("dr-anaya-rao");
  return (
    <DoctorShell>
      <DoctorRequestsClient requests={requests} />
    </DoctorShell>
  );
}
