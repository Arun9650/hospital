import Link from "next/link";
import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Avatar, Badge, Button, Stat } from "@/components/ui";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { getDoctorAppointments, getCurrentDoctor, getDoctorEarnings } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/** "Dr. Anaya Rao" / "Anaya Rao" → "Dr. Anaya Rao" without doubling the title. */
function withDoctorTitle(name?: string) {
  const n = (name ?? "Doctor").trim();
  return /^dr\.?\s/i.test(n) ? n : `Dr. ${n}`;
}

/** "3:15 PM" / "9:00 AM" → minutes past midnight, so the day's consultations
 *  sort in chronological order. Unparseable labels sort last. */
function minutesOfLabel(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  let h = Number(m[1]);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + Number(m[2]);
}

export default async function DoctorDashboard() {
  const user = await getSessionUser();
  const doctor = await getCurrentDoctor();
  // Was passing the doctor's *name* where a doctor_id is required → never matched
  // and silently fell back to mock data. Resolve the real catalog id instead.
  const appointmentRequests = doctor ? await getDoctorAppointments(doctor.id) : [];
  const earnings = doctor ? await getDoctorEarnings(doctor.id) : null;
  // Today's schedule = the doctor's real accepted/finished consultations, in
  // time order. Pending ones are still requests → they live in "New requests".
  const schedule = appointmentRequests
    .filter((a) => a.status === "Upcoming" || a.status === "Completed")
    .sort((a, b) => minutesOfLabel(a.time) - minutesOfLabel(b.time));
  const upcomingCount = appointmentRequests.filter((a) => a.status === "Upcoming").length;
  const pendingCount = appointmentRequests.filter((r) => r.status === "Pending").length;
  const todayStats = [
    { label: "Consultations", value: String(schedule.length), sub: `${upcomingCount} upcoming` },
    { label: "Pending requests", value: String(pendingCount), sub: pendingCount ? "Action needed" : "All clear" },
    { label: "Earnings (mo.)", value: `$${(earnings?.month ?? 0).toLocaleString()}`, sub: `${earnings?.consultations ?? 0} completed` },
    { label: "Avg. rating", value: doctor?.rating ?? 0, sub: `${doctor?.reviews ?? 0} reviews` },
  ];
  return (
    <DoctorShell>
      <RealtimeRefresh tables={["appointments"]} />
      <PageHeader
        title={`Welcome back, ${withDoctorTitle(user?.name)}`}
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
            {schedule.length === 0 ? (
              <p className="py-8 text-center text-sm text-mute">
                No consultations scheduled yet. Requests you accept will appear here.
              </p>
            ) : (
              <div className="divide-y divide-[#f0f0f0]">
                {schedule.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-4">
                      <span className="w-24 shrink-0 text-sm font-medium text-mute">{s.time || "—"}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.patientName}</p>
                        <p className="text-xs text-mute">{s.mode} consultation</p>
                      </div>
                    </div>
                    {s.status === "Upcoming" ? (
                      <Button href={`/consultation/${s.id}?mode=${s.mode}`} size="sm">Start</Button>
                    ) : (
                      <Badge tone="green">Done</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
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
