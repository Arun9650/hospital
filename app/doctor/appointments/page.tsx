import { DoctorShell } from "@/components/roleShells";
import { DoctorRequestsClient } from "@/components/DoctorRequestsClient";
import { getDoctorAppointments, getCurrentDoctor } from "@/lib/db";

export default async function DoctorAppointments() {
  const doctor = await getCurrentDoctor();
  const requests = doctor ? await getDoctorAppointments(doctor.id) : [];
  return (
    <DoctorShell>
      <DoctorRequestsClient requests={requests} />
    </DoctorShell>
  );
}
