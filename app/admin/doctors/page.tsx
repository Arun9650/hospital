import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { Avatar, Badge, Button, Stat, Stars } from "@/components/ui";
import { doctors, adminStats } from "@/lib/data";

export default function AdminDoctors() {
  return (
    <AdminShell>
      <PageHeader
        title="Doctors"
        subtitle="Verified specialists on the platform."
        action={<Button href="/admin/verification">Verification queue</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-flat p-5"><Stat label="Verified doctors" value={adminStats.doctors.toLocaleString()} /></div>
        <div className="card-flat p-5"><Stat label="Pending review" value={adminStats.pendingVerifications} sub="Action needed" /></div>
        <div className="card-flat p-5"><Stat label="Active today" value="642" /></div>
        <div className="card-flat p-5"><Stat label="Avg. rating" value="4.8" /></div>
      </div>

      <DataTable
        columns={["Doctor", "Specialty", "Experience", "Rating", "Fee", "Status", ""]}
        rows={doctors.map((d) => [
          <span key="n" className="flex items-center gap-3">
            <Avatar initials={d.initials} color={d.photo} size={34} />
            <span className="font-medium">{d.name}</span>
          </span>,
          d.specialty,
          `${d.experience} yrs`,
          <span key="r" className="flex items-center gap-1"><Stars value={d.rating} /> {d.rating}</span>,
          `$${d.fee}`,
          <Badge key="s" tone="green">Verified</Badge>,
          <button key="a" className="text-ps hover:underline">Manage</button>,
        ])}
      />
    </AdminShell>
  );
}
