import Link from "next/link";
import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { Avatar, Badge, Button, Stat } from "@/components/ui";
import { adminStats, adminAppointments, verificationQueue, earnings } from "@/lib/data";

const kpis = [
  { label: "Total patients", value: adminStats.patients.toLocaleString(), sub: "+3.1% this week" },
  { label: "Verified doctors", value: adminStats.doctors.toLocaleString(), sub: "+18 this week" },
  { label: "Appointments", value: adminStats.appointments.toLocaleString(), sub: "62 live now" },
  { label: "Revenue (MTD)", value: `$${(adminStats.revenue / 1000).toFixed(0)}k`, sub: "+8.2% MoM" },
];

export default function AdminDashboard() {
  const max = Math.max(...earnings.breakdown.map((b) => b.value));
  return (
    <AdminShell>
      <PageHeader
        title="Platform overview"
        subtitle="Health of the Aria Health marketplace."
        action={<Button href="/admin/reports" variant="light">Export report</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card-flat p-5">
            <Stat label={k.label} value={k.value} sub={k.sub} />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card-flat p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-normal tracking-tight">Weekly revenue</h2>
              <Link href="/admin/revenue" className="text-sm text-ps hover:underline">Details</Link>
            </div>
            <div className="flex h-52 items-end justify-between gap-3">
              {earnings.breakdown.map((b) => (
                <div key={b.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-t-md bg-ps/90" style={{ height: `${(b.value / max) * 100}%` }} />
                  </div>
                  <span className="text-xs text-mute">{b.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-flat p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-normal tracking-tight">Verification queue</h2>
            <Badge tone="amber">{adminStats.pendingVerifications}</Badge>
          </div>
          <div className="space-y-3">
            {verificationQueue.slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <Avatar initials={v.name.replace("Dr. ", "").slice(0, 2)} color="#7a4bd1" size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.name}</p>
                  <p className="text-xs text-mute">{v.specialty} · {v.submitted}</p>
                </div>
              </div>
            ))}
          </div>
          <Button href="/admin/verification" variant="light" size="sm" full className="mt-4">Review queue</Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-normal tracking-tight">Recent appointments</h2>
          <Link href="/admin/appointments" className="text-sm text-ps hover:underline">View all</Link>
        </div>
        <DataTable
          columns={["Patient", "Doctor", "Schedule", "Mode", "Status", "Fee"]}
          rows={adminAppointments.slice(0, 4).map((a) => [
            a.patient,
            a.doctor,
            a.date,
            a.mode,
            <Badge key="s" tone={a.status === "Completed" ? "green" : "blue"}>{a.status}</Badge>,
            `$${a.fee}`,
          ])}
        />
      </div>
    </AdminShell>
  );
}
