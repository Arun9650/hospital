import { DoctorShell } from "@/components/roleShells";
import { DoctorRequestsClient } from "@/components/DoctorRequestsClient";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { getDoctorAppointments, getCurrentDoctor } from "@/lib/db";

export default async function DoctorAppointments() {
  const doctor = await getCurrentDoctor();
  const requests = doctor ? await getDoctorAppointments(doctor.id) : [];
  return (
    <DoctorShell>
      <RealtimeRefresh tables={["appointments"]} />
      <DoctorRequestsClient requests={requests} />
    </DoctorShell>
  );
}
