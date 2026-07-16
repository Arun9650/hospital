import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { Avatar, Badge, Button, Stat, Stars } from "@/components/ui";
import { getDoctors, getAdminStats } from "@/lib/db";

export default async function AdminDoctors() {
  const [doctors, stats] = await Promise.all([getDoctors(), getAdminStats()]);
  const avgRating = doctors.length
    ? (doctors.reduce((s, d) => s + d.rating, 0) / doctors.length).toFixed(1)
    : "0";
  const specialties = new Set(doctors.map((d) => d.specialty)).size;
  return (
    <AdminShell>
      <PageHeader
        title="Doctors"
        subtitle="Verified specialists on the platform."
        action={<Button href="/admin/verification">Verification queue</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-flat p-5"><Stat label="Total doctors" value={stats.doctors.toLocaleString()} /></div>
        <div className="card-flat p-5"><Stat label="Pending review" value={stats.pendingVerifications} sub="Action needed" /></div>
        <div className="card-flat p-5"><Stat label="Specialties" value={specialties} /></div>
        <div className="card-flat p-5"><Stat label="Avg. rating" value={avgRating} /></div>
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
          <Badge key="s" tone={d.verified ? "green" : "amber"}>{d.verified ? "Verified" : "Pending"}</Badge>,
          <button key="a" className="text-ps hover:underline">Manage</button>,
        ])}
      />
    </AdminShell>
  );
}
