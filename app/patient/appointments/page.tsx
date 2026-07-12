import Link from "next/link";
import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Tabs } from "@/components/Tabs";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button, EmptyState } from "@/components/ui";
import { RateButton } from "@/components/RateButton";
import { getPatientAppointments } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function AppointmentsPage() {
  const userId = await getUserId();
  console.log("🚀 ~ AppointmentsPage ~ userId:", userId)
  const appointments = await getPatientAppointments(userId);
  console.log("🚀 ~ AppointmentsPage ~ appointments:", appointments)
  const pending = appointments.filter((a) => a.status === "Pending");
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
              label: `Pending (${pending.length})`,
              content:
                pending.length === 0 ? (
                  <EmptyState
                    title="No pending appointments"
                    body="Your appointments will appear here once you book them."
                  />
                ) : (
                  <div className="stagger space-y-3">
                    {pending.map((a) => (
                      <AppointmentCard key={a.id} appt={a} />
                    ))}
                  </div>
                ),
            },
            {
              label: `Upcoming (${upcoming.length})`,
              content:
                upcoming.length === 0 ? (
                  <EmptyState
                    title="No upcoming appointments"
                    body="Book a consultation with a verified specialist to get started."
                    action={<Button href="/patient/doctors" size="sm">Find a doctor</Button>}
                  />
                ) : (
                  <div className="stagger space-y-3">
                    {upcoming.map((a) => (
                      <AppointmentCard key={a.id} appt={a} />
                    ))}
                  </div>
                ),
            },
            {
              label: `Completed (${completed.length})`,
              content:
                completed.length === 0 ? (
                  <EmptyState
                    title="No completed consultations yet"
                    body="Once a consultation call ends, it moves here with its prescription."
                  />
                ) : (
                  <div className="stagger space-y-3">
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
