import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Button, Stat } from "@/components/ui";
import { getAdminRevenue } from "@/lib/db";

export default async function AdminRevenue() {
  const revenue = await getAdminRevenue();
  const bySpecialty = revenue.bySpecialty;
  const max = Math.max(1, ...revenue.byDay.map((b) => b.value));
  const maxSpec = Math.max(1, ...bySpecialty.map((s) => s.value));
  return (
    <AdminShell>
      <PageHeader
        title="Revenue"
        subtitle="Marketplace earnings and commission."
        action={<Button variant="light">Export CSV</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-dark p-5">
          <p className="text-sm text-white/60">Revenue (MTD)</p>
          <p className="mt-1 font-display text-3xl font-light">${(revenue.mtd / 1000).toFixed(1)}k</p>
          <p className="mt-2 text-xs text-white/50">Completed consultations</p>
        </div>
        <div className="card-flat p-5"><Stat label="Platform commission" value={`$${(revenue.commission / 1000).toFixed(1)}k`} sub="15%" /></div>
        <div className="card-flat p-5"><Stat label="Payouts to doctors" value={`$${(revenue.payouts / 1000).toFixed(1)}k`} sub="85%" /></div>
        <div className="card-flat p-5"><Stat label="Avg. order value" value={`$${revenue.avgOrderValue.toFixed(2)}`} /></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-flat p-6">
          <h2 className="mb-6 font-display text-xl font-normal tracking-tight">Daily revenue</h2>
          <div className="flex h-52 items-end justify-between gap-3">
            {revenue.byDay.map((b) => (
              <div key={b.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md bg-ps/90" style={{ height: `${(b.value / max) * 100}%` }} />
                </div>
                <span className="text-xs text-mute">{b.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-flat p-6">
          <h2 className="mb-6 font-display text-xl font-normal tracking-tight">Revenue by specialty</h2>
          {bySpecialty.length === 0 && (
            <p className="py-8 text-center text-sm text-mute">No completed consultations yet.</p>
          )}
          <div className="space-y-4">
            {bySpecialty.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-mute">${(s.value / 1000).toFixed(0)}k</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-card">
                  <div className="h-full rounded-full bg-ps" style={{ width: `${(s.value / maxSpec) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
