import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Badge, Button } from "@/components/ui";
import { getPrescriptions } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function PrescriptionsPage() {
  const userId = await getUserId();
  const prescriptions = await getPrescriptions(userId);
  return (
    <PatientShell>
      <PageHeader
        title="Digital prescriptions"
        subtitle="Secure, shareable and ready the moment your consultation ends."
      />

      <div className="space-y-6">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="card-flat overflow-hidden">
            {/* Rx header */}
            <div className="flex flex-col gap-3 border-b border-[#f0f0f0] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eaf3fc] text-xl">℞</span>
                <div>
                  <p className="font-medium">{rx.diagnosis}</p>
                  <p className="text-xs text-mute">{rx.doctorName} · {rx.specialty} · {rx.date}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="light" size="sm">Download PDF</Button>
                <Button size="sm">Order medicines</Button>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Medicines */}
              <div>
                <p className="text-sm font-medium">Medicines</p>
                <div className="mt-3 overflow-hidden rounded-lg border border-[#f0f0f0]">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-card text-left text-xs text-mute">
                      <tr>
                        <th className="p-3 font-medium">Medicine</th>
                        <th className="p-3 font-medium">Dose</th>
                        <th className="p-3 font-medium">Frequency</th>
                        <th className="p-3 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2f2f2]">
                      {rx.medicines.map((m) => (
                        <tr key={m.name}>
                          <td className="p-3 font-medium">{m.name}</td>
                          <td className="p-3 text-mute">{m.dose}</td>
                          <td className="p-3 text-mute">{m.frequency}</td>
                          <td className="p-3 text-mute">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tests + notes */}
              <div className="space-y-4">
                {rx.tests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Recommended tests</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rx.tests.map((t) => (
                        <Badge key={t} tone="soft">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Doctor’s advice</p>
                  <p className="mt-1 text-sm text-body-light">{rx.notes}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PatientShell>
  );
}
