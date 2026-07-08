import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { Avatar, Badge, Stat } from "@/components/ui";
import { adminPatients, adminStats } from "@/lib/data";

export default function AdminPatients() {
  return (
    <AdminShell>
      <PageHeader
        title="Patients"
        subtitle="Manage patient accounts and activity."
        action={
          <div className="flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-4 py-2">
            <span className="text-mute">🔍</span>
            <input placeholder="Search patients" className="w-44 bg-transparent text-sm outline-none" />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-flat p-5"><Stat label="Total patients" value={adminStats.patients.toLocaleString()} /></div>
        <div className="card-flat p-5"><Stat label="Active this month" value="31,204" sub="+3.1%" /></div>
        <div className="card-flat p-5"><Stat label="New this week" value="1,482" /></div>
        <div className="card-flat p-5"><Stat label="Avg. visits" value="4.2" /></div>
      </div>

      <DataTable
        columns={["Patient", "Email", "Joined", "Appointments", "Status", ""]}
        rows={adminPatients.map((p) => [
          <span key="n" className="flex items-center gap-3">
            <Avatar initials={p.name.slice(0, 2)} color="#0070d1" size={34} />
            <span className="font-medium">{p.name}</span>
          </span>,
          <span key="e" className="text-mute">{p.email}</span>,
          p.joined,
          p.appts,
          <Badge key="s" tone={p.status === "Active" ? "green" : "amber"}>{p.status}</Badge>,
          <button key="a" className="text-ps hover:underline">View</button>,
        ])}
      />
    </AdminShell>
  );
}
