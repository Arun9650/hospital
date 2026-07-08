import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { Badge, Stat } from "@/components/ui";
import { adminAppointments } from "@/lib/data";

export default function AdminAppointments() {
  return (
    <AdminShell>
      <PageHeader
        title="Appointments"
        subtitle="All consultations across the platform."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-flat p-5"><Stat label="Today" value="1,204" /></div>
        <div className="card-flat p-5"><Stat label="Live now" value="62" sub="In consultation" /></div>
        <div className="card-flat p-5"><Stat label="Completed (MTD)" value="8,410" /></div>
        <div className="card-flat p-5"><Stat label="Cancellation rate" value="2.4%" /></div>
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
