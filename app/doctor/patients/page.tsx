import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Avatar, Button } from "@/components/ui";

const patients = [
  { name: "Rohan Mehta", age: 34, gender: "Male", last: "Today", condition: "Hypertension", visits: 6, color: "#7a4bd1" },
  { name: "Grace Lin", age: 41, gender: "Female", last: "Today", condition: "Palpitations", visits: 3, color: "#2e7cc2" },
  { name: "Ahmed Farah", age: 58, gender: "Male", last: "Jun 30", condition: "Post-angioplasty", visits: 11, color: "#c25b2e" },
  { name: "Sara Iqbal", age: 29, gender: "Female", last: "Jun 12", condition: "Anxiety, palpitations", visits: 2, color: "#b03a6a" },
  { name: "Tom Becker", age: 47, gender: "Male", last: "May 28", condition: "High cholesterol", visits: 8, color: "#1f6f5c" },
];

export default function DoctorPatients() {
  return (
    <DoctorShell>
      <PageHeader
        title="Patient records"
        subtitle="Review histories before and after consultations."
        action={
          <div className="flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-4 py-2">
            <span className="text-mute">🔍</span>
            <input placeholder="Search patients" className="w-40 bg-transparent text-sm outline-none" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* List */}
        <div className="card-flat divide-y divide-[#f0f0f0]">
          {patients.map((p, i) => (
            <div key={p.name} className={`flex items-center justify-between gap-4 p-4 ${i === 0 ? "bg-[#f7fbff]" : ""}`}>
              <div className="flex items-center gap-4">
                <Avatar initials={p.name.slice(0, 2)} color={p.color} size={44} />
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-mute">{p.age} · {p.gender} · {p.condition}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-mute">Last visit</p>
                <p className="text-sm font-medium">{p.last}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Selected patient detail */}
        <div className="card-flat p-6">
          <div className="flex items-center gap-4">
            <Avatar initials="RM" color="#7a4bd1" size={56} />
            <div>
              <p className="font-display text-xl font-normal">Rohan Mehta</p>
              <p className="text-sm text-mute">34 · Male · 6 visits</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Info label="Blood group" value="B+" />
            <Info label="Allergies" value="Penicillin" />
            <Info label="Height" value="178 cm" />
            <Info label="Weight" value="82 kg" />
          </div>

          <h3 className="mt-6 text-sm font-medium">Recent history</h3>
          <div className="mt-3 space-y-3">
            {[
              { d: "Jul 8, 2026", t: "Hypertension follow-up", by: "You" },
              { d: "Jun 2, 2026", t: "Lipid profile review", by: "You" },
              { d: "Apr 18, 2026", t: "Chest X-ray — clear", by: "City Imaging" },
            ].map((h) => (
              <div key={h.d} className="flex items-start gap-3 rounded-lg bg-surface-card p-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-ps" />
                <div>
                  <p className="text-sm font-medium">{h.t}</p>
                  <p className="text-xs text-mute">{h.d} · {h.by}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button href="/doctor/consultation" size="sm">Start consultation</Button>
            <Button href="/doctor/prescriptions" variant="light" size="sm">Write prescription</Button>
          </div>
        </div>
      </div>
    </DoctorShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-card p-3">
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
