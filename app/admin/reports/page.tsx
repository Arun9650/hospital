import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Button } from "@/components/ui";

const reports = [
  { title: "Monthly revenue report", desc: "Full P&L breakdown for June 2026.", icon: "📊", date: "Generated Jul 1" },
  { title: "Doctor performance", desc: "Ratings, response times & completion rates.", icon: "🩺", date: "Weekly" },
  { title: "Patient acquisition", desc: "Signups, activation and retention cohorts.", icon: "📈", date: "Weekly" },
  { title: "Consultation analytics", desc: "Volume by mode, specialty and geography.", icon: "🎥", date: "Daily" },
  { title: "Compliance & audit log", desc: "Access logs and data-sharing consents.", icon: "🛡️", date: "On demand" },
  { title: "Payouts reconciliation", desc: "Doctor payouts vs platform commission.", icon: "💳", date: "Monthly" },
];

const highlights = [
  { label: "Patient satisfaction", value: "94%", trend: "+2 pts" },
  { label: "Avg. wait time", value: "8 min", trend: "-1 min" },
  { label: "Consult completion", value: "97.6%", trend: "+0.4%" },
  { label: "Repeat bookings", value: "61%", trend: "+3%" },
];

export default function AdminReports() {
  return (
    <AdminShell>
      <PageHeader
        title="Reports"
        subtitle="Generate and download platform analytics."
        action={<Button>New custom report</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {highlights.map((h) => (
          <div key={h.label} className="card-flat p-5">
            <p className="text-sm text-mute">{h.label}</p>
            <p className="mt-1 font-display text-3xl font-light">{h.value}</p>
            <p className="mt-1 text-xs text-success">{h.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.title} className="card-flat lift flex flex-col p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3fc] text-2xl">{r.icon}</span>
            <h3 className="mt-4 font-display text-lg font-normal tracking-tight">{r.title}</h3>
            <p className="mt-1 flex-1 text-sm text-body-light">{r.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-mute">{r.date}</span>
              <button className="btn btn-light btn-sm">Download</button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
