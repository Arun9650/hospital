import { DoctorShell } from "@/components/roleShells";
import { DoctorRequestsClient } from "@/components/DoctorRequestsClient";
import { getDoctorAppointments, getDoctors } from "@/lib/db";
import { getSessionUser, getUserId } from "@/lib/auth";

export default async function DoctorAppointments() {
  const userId = await getSessionUser();
  const doctors = await getDoctors();
  const doctor = doctors.find((d) => d.profile_id === userId?.id);
  const requests = await getDoctorAppointments(doctor?.id as string);
  return (
    <DoctorShell>
      <DoctorRequestsClient requests={requests} />
    </DoctorShell>
  );
}
