import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Button, Stat } from "@/components/ui";
import { getCurrentDoctor, getDoctorEarnings } from "@/lib/db";

export default async function EarningsPage() {
  const doctor = await getCurrentDoctor();
  const earnings = await getDoctorEarnings(doctor?.id ?? "");
  const max = Math.max(1, ...earnings.breakdown.map((b) => b.value));
  return (
    <DoctorShell>
      <PageHeader
        title="Earnings"
        subtitle="Track consultations, payouts and growth."
        action={<Button variant="light">Download statement</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-dark p-5">
          <p className="text-sm text-white/60">This month</p>
          <p className="mt-1 font-display text-3xl font-light">${earnings.month.toLocaleString()}</p>
          <p className="mt-2 text-xs text-white/50">Completed consultations</p>
        </div>
        <div className="card-flat p-5"><Stat label="This week" value={`$${earnings.week.toLocaleString()}`} /></div>
        <div className="card-flat p-5"><Stat label="Pending (upcoming)" value={`$${earnings.pending.toLocaleString()}`} /></div>
        <div className="card-flat p-5"><Stat label="Consultations" value={earnings.consultations} sub={`${doctor?.rating ?? 0}★ avg`} /></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Chart */}
        <div className="card-flat p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-normal tracking-tight">This week</h2>
            <div className="flex gap-1">
              {["Week", "Month", "Year"].map((t, i) => (
                <button key={t} className={`chip ${i === 0 ? "chip-active" : ""}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex h-52 items-end justify-between gap-3">
            {earnings.breakdown.map((b) => (
              <div key={b.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-ps/90 transition-all"
                    style={{ height: `${(b.value / max) * 100}%` }}
                    title={`$${b.value}`}
                  />
                </div>
                <span className="text-xs text-mute">{b.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payouts — no source until the payments integration lands (§4.4). */}
        <div className="card-flat p-6">
          <h2 className="mb-4 font-display text-xl font-normal tracking-tight">Payouts</h2>
          <div className="rounded-lg bg-surface-card p-5 text-center text-sm text-mute">
            <p>Payouts aren’t available yet.</p>
            <p className="mt-1 text-xs">They’ll appear here once online payments are enabled.</p>
          </div>
          <Button variant="light" size="sm" full className="mt-4" disabled>Payout settings</Button>
        </div>
      </div>
    </DoctorShell>
  );
}
