import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Badge, Button, Stat } from "@/components/ui";
import { earnings } from "@/lib/data";

export default function EarningsPage() {
  const max = Math.max(...earnings.breakdown.map((b) => b.value));
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
          <p className="mt-2 text-xs text-[#39d98a]">▲ 8.2% vs last month</p>
        </div>
        <div className="card-flat p-5"><Stat label="This week" value={`$${earnings.week.toLocaleString()}`} sub="+12% vs avg" /></div>
        <div className="card-flat p-5"><Stat label="Pending payout" value={`$${earnings.pending}`} /></div>
        <div className="card-flat p-5"><Stat label="Consultations" value={earnings.consultations} sub={`${earnings.avgRating}★ avg`} /></div>
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

        {/* Payouts */}
        <div className="card-flat p-6">
          <h2 className="mb-4 font-display text-xl font-normal tracking-tight">Payouts</h2>
          <div className="divide-y divide-[#f0f0f0]">
            {earnings.payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">${p.amount.toLocaleString()}</p>
                  <p className="text-xs text-mute">{p.date}</p>
                </div>
                <Badge tone={p.status === "Paid" ? "green" : "amber"}>{p.status}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-surface-card p-4 text-sm">
            <p className="text-mute">Next payout</p>
            <p className="mt-1 font-display text-lg">$640 · Aug 1, 2026</p>
            <Button variant="light" size="sm" full className="mt-3">Payout settings</Button>
          </div>
        </div>
      </div>
    </DoctorShell>
  );
}
