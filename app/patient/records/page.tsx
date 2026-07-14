import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Tabs } from "@/components/Tabs";
import { Button } from "@/components/ui";
import { getMedicalRecords } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import type { MedicalRecord } from "@/lib/data";
import { UploadRecordButton } from "@/components/UploadRecordButton";

const typeIcon: Record<string, string> = {
  "Lab Report": "🧪",
  Prescription: "📄",
  Scan: "🩻",
  "Discharge Summary": "🏥",
  Vaccination: "💉",
};

function RecordList({ items }: { items: MedicalRecord[] }) {
  if (!items.length)
    return <p className="py-10 text-center text-mute">No records in this category yet.</p>;
  return (
    <div className="divide-y divide-[#f0f0f0]">
      {items.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-card text-xl">
              {typeIcon[r.type]}
            </span>
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-mute">
                {r.type} · {r.by} · {r.date} · {r.size}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {r.url ? (
              <>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-light btn-sm hidden sm:inline-flex"
                >
                  View
                </a>
                <a href={r.url} download className="btn btn-ghost btn-sm">
                  Download
                </a>
              </>
            ) : (
              <span className="text-xs text-mute">Demo file</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function RecordsPage() {
  const userId = await getUserId();
  const medicalRecords = await getMedicalRecords(userId);
  const byType = (t: string) => medicalRecords.filter((r) => r.type === t);
  return (
    <PatientShell>
      <PageHeader
        title="Medical records"
        subtitle="Every report, scan and note in one encrypted timeline."
        action={<UploadRecordButton />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card-dark p-5">
          <p className="text-sm text-white/60">Health Vault</p>
          <p className="mt-1 font-display text-2xl font-light">{medicalRecords.length} documents</p>
          <p className="mt-2 text-xs text-white/50">🔒 End-to-end encrypted</p>
        </div>
        <div className="card-flat p-5">
          <p className="text-sm text-mute">Book a lab test</p>
          <p className="mt-1 font-display text-2xl font-light">Home collection</p>
          <Button size="sm" className="mt-3">Book now</Button>
        </div>
        <div className="card-flat p-5">
          <p className="text-sm text-mute">Share with doctor</p>
          <p className="mt-1 font-display text-2xl font-light">One-tap access</p>
          <Button variant="light" size="sm" className="mt-3">Manage sharing</Button>
        </div>
      </div>

      <div className="card-flat p-6">
        <Tabs
          tabs={[
            { label: "All", content: <RecordList items={medicalRecords} /> },
            { label: "Lab Reports", content: <RecordList items={byType("Lab Report")} /> },
            { label: "Prescriptions", content: <RecordList items={byType("Prescription")} /> },
            { label: "Scans", content: <RecordList items={byType("Scan")} /> },
            { label: "Vaccinations", content: <RecordList items={byType("Vaccination")} /> },
          ]}
        />
      </div>
    </PatientShell>
  );
}
