import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Badge, Button } from "@/components/ui";
import { specialties, services, faqs } from "@/lib/data";

export default function AdminContent() {
  return (
    <AdminShell>
      <PageHeader
        title="Content management"
        subtitle="Manage what patients see across the marketing site."
        action={<Button>Publish changes</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hero banner */}
        <div className="card-flat p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-normal tracking-tight">Homepage hero</h2>
            <Badge tone="green">Live</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Headline</span>
              <input className="field" defaultValue="Healthcare that begins with one conversation." />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Primary CTA</span>
              <input className="field" defaultValue="Book Appointment" />
            </label>
          </div>
        </div>

        {/* Specialties */}
        <div className="card-flat p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-normal tracking-tight">Specialties</h2>
            <button className="btn btn-light btn-sm">+ Add</button>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {specialties.slice(0, 6).map((s) => (
              <div key={s.slug} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm font-medium">{s.name}</span>
                </span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-mute">{s.doctors}</span>
                  <button className="text-ps hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="card-flat p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-normal tracking-tight">Services</h2>
            <button className="btn btn-light btn-sm">+ Add</button>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {services.map((s) => (
              <div key={s.title} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm font-medium">{s.title}</span>
                </span>
                <button className="text-sm text-ps hover:underline">Edit</button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="card-flat p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-normal tracking-tight">FAQ entries</h2>
            <button className="btn btn-light btn-sm">+ Add question</button>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {faqs.map((f) => (
              <div key={f.q} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm">{f.q}</span>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <Badge tone="green">Published</Badge>
                  <button className="text-ps hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
