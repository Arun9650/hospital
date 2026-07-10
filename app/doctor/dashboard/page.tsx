import Link from "next/link";
import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Avatar, Badge, Button, Stat } from "@/components/ui";
import { earnings } from "@/lib/data";
import { getDoctorAppointments } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const todayStats = [
  { label: "Today's appointments", value: "8", sub: "2 upcoming" },
  { label: "Pending requests", value: "3", sub: "Action needed" },
  { label: "Today's earnings", value: `$${earnings.today}`, sub: "+12% vs avg" },
  { label: "Avg. rating", value: earnings.avgRating, sub: "512 reviews" },
];

const schedule = [
  { time: "9:00 AM", patient: "Rohan Mehta", type: "Video", status: "Completed" },
  { time: "10:30 AM", patient: "Sara Iqbal", type: "Audio", status: "Completed" },
  { time: "4:30 PM", patient: "Grace Lin", type: "Video", status: "Upcoming" },
  { time: "5:15 PM", patient: "Ahmed Farah", type: "Video", status: "Upcoming" },
];

export default async function DoctorDashboard() {
  const user  = await getSessionUser();
  console.log("🚀 ~ DoctorDashboard ~ user:", user)
  const appointmentRequests = await getDoctorAppointments(user?.name as string);
  return (
    <DoctorShell>
      <PageHeader
        title={"Welcome back, Dr. " + user?.name}
        subtitle="Here's your practice at a glance."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="green">Available</Badge>
            <Button href="/doctor/availability" variant="light">Manage availability</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {todayStats.map((s) => (
          <div key={s.label} className="card-flat p-5">
            <Stat label={s.label} value={s.value} sub={s.sub} />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Today schedule */}
        <div className="lg:col-span-2">
          <div className="card-flat p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-normal tracking-tight">Today’s schedule</h2>
              <Link href="/doctor/appointments" className="text-sm text-ps hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {schedule.map((s) => (
                <div key={s.time} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-4">
                    <span className="w-20 text-sm font-medium text-mute">{s.time}</span>
                    <div>
                      <p className="font-medium">{s.patient}</p>
                      <p className="text-xs text-mute">{s.type} consultation</p>
                    </div>
                  </div>
                  {s.status === "Upcoming" ? (
                    <Button href="/doctor/appointments" size="sm">Start</Button>
                  ) : (
                    <Badge tone="green">Done</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requests */}
        <div className="card-flat p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-normal tracking-tight">New requests</h2>
            <Badge tone="amber">{appointmentRequests.filter((r) => r.status === "Pending").length}</Badge>
          </div>
          <div className="space-y-3">
            {appointmentRequests.filter((r) => r.status === "Pending").map((r) => (
              <div key={r.id} className="rounded-lg border border-[#f0f0f0] p-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={r.patientName.slice(0, 2)} color="#7a4bd1" size={38} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.patientName}</p>
                    <p className="text-xs text-mute">{r.time} · {r.mode}</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-body-light">{r.reason}</p>
              </div>
            ))}
          </div>
          <Button href="/doctor/appointments" variant="light" size="sm" full className="mt-4">
            Review requests
          </Button>
        </div>
      </div>
    </DoctorShell>
  );
}
