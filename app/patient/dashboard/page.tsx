import Link from "next/link";
import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { AppointmentCard } from "@/components/AppointmentCard";
import { DoctorCard } from "@/components/DoctorCard";
import { Button, Badge } from "@/components/ui";
import {
  getPatientAppointments,
  getFeaturedDoctors,
  getMedicalRecords,
  getNotifications,
} from "@/lib/db";
import { getUserId } from "@/lib/auth";

const quickActions = [
  { icon: "💬", label: "Message a doctor", href: "/patient/messages" },
  { icon: "🔍", label: "Find a doctor", href: "/patient/doctors" },
  { icon: "💊", label: "Order medicines", href: "/patient/prescriptions" },
  { icon: "✨", label: "Ask AI assistant", href: "/patient/assistant" },
];

const vitals = [
  { label: "Blood pressure", value: "122/80", unit: "mmHg", tone: "green" as const },
  { label: "Heart rate", value: "72", unit: "bpm", tone: "green" as const },
  { label: "BMI", value: "23.4", unit: "kg/m²", tone: "green" as const },
  { label: "Glucose", value: "104", unit: "mg/dL", tone: "amber" as const },
];

export default async function PatientDashboard() {
  const userId = await getUserId();
  const [appointments, featuredDoctors, medicalRecords, notifications] = await Promise.all([
    getPatientAppointments(userId),
    getFeaturedDoctors(),
    getMedicalRecords(userId),
    getNotifications(userId),
  ]);
  const upcoming = appointments.filter((a) => a.status === "Upcoming");
  return (
    <PatientShell>
      <PageHeader
        title="Good afternoon, Alex"
        subtitle="Here's a calm overview of your health today."
        action={
          <div className="flex gap-2">
            <Button href="/patient/messages">💬 Message a doctor</Button>
            <Button href="/patient/doctors" variant="light">Book appointment</Button>
          </div>
        }
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((a) => (
          <Link key={a.label} href={a.href} className="card-flat lift flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf3fc] text-xl">
              {a.icon}
            </span>
            <span className="text-sm font-medium">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-normal tracking-tight">Upcoming appointments</h2>
              <Link href="/patient/appointments" className="text-sm text-ps hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {upcoming.map((a) => (
                <AppointmentCard key={a.id} appt={a} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-normal tracking-tight">Your vitals</h2>
              <Badge tone="green">Up to date</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {vitals.map((v) => (
                <div key={v.label} className="card-flat p-4">
                  <p className="text-xs text-mute">{v.label}</p>
                  <p className="mt-1 font-display text-2xl font-light">
                    {v.value} <span className="text-xs text-mute">{v.unit}</span>
                  </p>
                  <span className={`mt-2 inline-block h-1.5 w-1.5 rounded-full ${v.tone === "green" ? "bg-success" : "bg-[#e0a020]"}`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-normal tracking-tight">Recommended for you</h2>
              <Link href="/patient/doctors" className="text-sm text-ps hover:underline">
                See more
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featuredDoctors.slice(0, 2).map((d) => (
                <DoctorCard key={d.id} doctor={d} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="card-flat p-5">
            <h3 className="font-display text-lg font-normal tracking-tight">Recent records</h3>
            <ul className="mt-3 divide-y divide-[#f0f0f0]">
              {medicalRecords.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-mute">{r.type} · {r.date}</p>
                  </div>
                  <span className="text-lg">📄</span>
                </li>
              ))}
            </ul>
            <Button href="/patient/records" variant="light" size="sm" full className="mt-4">
              Open records
            </Button>
          </div>

          <div className="card-flat p-5">
            <h3 className="font-display text-lg font-normal tracking-tight">Notifications</h3>
            <ul className="mt-3 space-y-3">
              {notifications.slice(0, 3).map((n) => (
                <li key={n.id} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? "bg-ps" : "bg-[#ddd]"}`} />
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-mute">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button href="/patient/notifications" variant="light" size="sm" full className="mt-4">
              View all
            </Button>
          </div>

          <div className="card-dark p-5">
            <span className="text-2xl">✨</span>
            <h3 className="mt-3 font-display text-lg font-normal">AI Health Assistant</h3>
            <p className="mt-1 text-sm text-white/60">
              Not sure which specialist you need? Describe your symptoms and get pointed the right way.
            </p>
            <Button href="/patient/assistant" size="sm" className="mt-4">
              Ask now
            </Button>
          </div>
        </div>
      </div>
    </PatientShell>
  );
}
