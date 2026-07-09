import Link from "next/link";
import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Tabs } from "@/components/Tabs";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button } from "@/components/ui";
import { RateButton } from "@/components/RateButton";
import { getPatientAppointments } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function AppointmentsPage() {
  const userId = await getUserId();
  console.log("🚀 ~ AppointmentsPage ~ userId:", userId)
  const appointments = await getPatientAppointments(userId);
  const upcoming = appointments.filter((a) => a.status === "Upcoming");
  const completed = appointments.filter((a) => a.status === "Completed");

  return (
    <PatientShell>
      <PageHeader
        title="Appointments"
        subtitle="Your consultations, past and upcoming."
        action={<Button href="/patient/doctors">Book new</Button>}
      />

      <div className="card-flat p-6">
        <Tabs
          tabs={[
            {
              label: `Upcoming (${upcoming.length})`,
              content: (
                <div className="space-y-3">
                  {upcoming.map((a) => (
                    <AppointmentCard key={a.id} appt={a} />
                  ))}
                </div>
              ),
            },
            {
              label: `Completed (${completed.length})`,
              content: (
                <div className="space-y-3">
                  {completed.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appt={a}
                      actions={
                        <>
                          <Link href="/patient/prescriptions" className="btn btn-light btn-sm">
                            Prescription
                          </Link>
                          <RateButton doctorName={a.doctorName} />
                        </>
                      }
                    />
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>
    </PatientShell>
  );
}
