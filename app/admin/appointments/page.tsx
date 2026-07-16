import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { Badge, Stat } from "@/components/ui";
import { getAdminAppointments } from "@/lib/db";

export default async function AdminAppointments() {
  const adminAppointments = await getAdminAppointments();
  const by = (s: string) => adminAppointments.filter((a) => a.status === s).length;
  const total = adminAppointments.length;
  const cancelRate = total ? ((by("Cancelled") / total) * 100).toFixed(1) : "0";
  return (
    <AdminShell>
      <PageHeader
        title="Appointments"
        subtitle="All consultations across the platform."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-flat p-5"><Stat label="Total" value={total.toLocaleString()} /></div>
        <div className="card-flat p-5"><Stat label="Upcoming" value={by("Upcoming").toLocaleString()} sub="Scheduled" /></div>
        <div className="card-flat p-5"><Stat label="Completed" value={by("Completed").toLocaleString()} /></div>
        <div className="card-flat p-5"><Stat label="Cancellation rate" value={`${cancelRate}%`} /></div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["All", "Upcoming", "Completed", "Cancelled", "Video", "Audio", "Chat"].map((f, i) => (
          <button key={f} className={`chip ${i === 0 ? "chip-active" : ""}`}>{f}</button>
        ))}
      </div>

      <DataTable
        columns={["ID", "Patient", "Doctor", "Schedule", "Mode", "Status", "Fee"]}
        rows={adminAppointments.map((a) => [
          <span key="id" className="font-mono text-xs text-mute">{a.id.toUpperCase()}</span>,
          a.patient,
          a.doctor,
          a.date,
          a.mode,
          <Badge key="s" tone={a.status === "Completed" ? "green" : "blue"}>{a.status}</Badge>,
          `$${a.fee}`,
        ])}
      />
    </AdminShell>
  );
}
