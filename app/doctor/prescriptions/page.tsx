"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Avatar, Badge, Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { issuePrescription, issuePrescriptionForAppointment } from "@/lib/actions/data";
import { downloadPrescriptionPdf } from "@/lib/prescriptionPdf";

type Med = { name: string; dose: string; frequency: string; duration: string };

const testOptions = ["CBC", "Lipid Profile", "ECG", "HbA1c", "Thyroid Panel", "Chest X-Ray", "Vitamin D", "Liver Function"];

export default function PrescriptionBuilder() {
  const [diagnosis, setDiagnosis] = useState("Stage 1 Hypertension");
  const [meds, setMeds] = useState<Med[]>([
    { name: "Amlodipine", dose: "5 mg", frequency: "Once daily", duration: "30 days" },
    { name: "Aspirin", dose: "75 mg", frequency: "Once daily", duration: "30 days" },
  ]);
  const [tests, setTests] = useState<string[]>(["Lipid Profile", "ECG"]);
  const [notes, setNotes] = useState("Reduce salt, 30 min walk daily. Follow-up in 4 weeks.");
  const [issued, setIssued] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { show } = useToast();
  // When opened from a completed consultation (…?appointmentId=…) the prescription
  // is tied to that appointment's real patient — the server action resolves the
  // patient and doctor from the appointment. Without it, this is the demo builder.
  const appointmentId = useSearchParams().get("appointmentId");

  // Demo patient for the standalone builder (mirrors the header badge).
  const patientName = "Rohan Mehta";

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPrescriptionPdf(
        {
          id: `rx-${Date.now()}`,
          doctorName: "Dr. Anaya Rao",
          specialty: "Cardiology",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          diagnosis,
          medicines: meds.filter((m) => m.name),
          tests,
          notes,
        },
        patientName
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleIssue() {
    setSaving(true);
    const clinical = { diagnosis, medicines: meds.filter((m) => m.name), tests, notes };
    const res = appointmentId
      ? await issuePrescriptionForAppointment(appointmentId, clinical)
      : await issuePrescription({ doctorName: "Dr. Anaya Rao", specialty: "Cardiology", ...clinical });
    setSaving(false);
    if (res.ok) {
      setIssued(true);
      show("Prescription issued & sent to the patient.", "success");
    } else {
      show("Couldn't issue the prescription. Please try again.", "error");
    }
  }

  function addMed() {
    setMeds((m) => [...m, { name: "", dose: "", frequency: "", duration: "" }]);
  }
  function updateMed(i: number, k: keyof Med, v: string) {
    setMeds((m) => m.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  }
  function removeMed(i: number) {
    setMeds((m) => m.filter((_, idx) => idx !== i));
  }
  function toggleTest(t: string) {
    setTests((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]));
  }

  return (
    <DoctorShell>
      <PageHeader
        title="Prescription builder"
        subtitle={
          appointmentId
            ? "Create a digital prescription for this consultation."
            : `Create a digital prescription for ${patientName}.`
        }
        action={
          appointmentId ? undefined : <Badge tone="soft">Patient: {patientName}</Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Builder */}
        <div className="space-y-5">
          <div className="card-flat p-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Diagnosis</span>
              <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="field" />
            </label>
          </div>

          <div className="card-flat p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium">Medicines</h3>
              <button onClick={addMed} className="btn btn-light btn-sm">+ Add</button>
            </div>
            <div className="space-y-3">
              {meds.map((m, i) => (
                <div key={i} className="rounded-lg border border-[#eee] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-mute">Medicine {i + 1}</span>
                    <button onClick={() => removeMed(i)} className="text-xs text-warning">Remove</button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} placeholder="Medicine name" className="field" />
                    <input value={m.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} placeholder="Dose (e.g. 5 mg)" className="field" />
                    <input value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} placeholder="Frequency" className="field" />
                    <input value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} placeholder="Duration" className="field" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-flat p-6">
            <h3 className="mb-3 font-medium">Recommend tests</h3>
            <div className="flex flex-wrap gap-2">
              {testOptions.map((t) => (
                <button key={t} onClick={() => toggleTest(t)} className={`chip ${tests.includes(t) ? "chip-active" : ""}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="card-flat p-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Advice & follow-up</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="field" />
            </label>
          </div>
        </div>

        {/* Live preview */}
        <aside>
          <div className="card-flat sticky top-24 overflow-hidden">
            <div className="flex items-center justify-between bg-black px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-ps">℞</span>
                <span className="font-display font-light">Aria Health</span>
              </div>
              <span className="text-xs text-white/60">Preview</span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 border-b border-[#eee] pb-4">
                <Avatar initials="AR" color="#0070d1" size={40} />
                <div>
                  <p className="text-sm font-medium">Dr. Anaya Rao</p>
                  <p className="text-xs text-mute">Cardiology · MD, DM</p>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <p className="text-xs text-mute">Patient</p>
                <p className="font-medium">Rohan Mehta · 34 · Male</p>
                <p className="mt-3 text-xs text-mute">Diagnosis</p>
                <p className="font-medium">{diagnosis || "—"}</p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-mute">Rx</p>
                <ul className="mt-1 space-y-1.5 text-sm">
                  {meds.filter((m) => m.name).map((m, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-mute">{m.dose} · {m.frequency}</span>
                    </li>
                  ))}
                  {meds.filter((m) => m.name).length === 0 && <li className="text-mute">No medicines added</li>}
                </ul>
              </div>
              {tests.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-mute">Tests</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {tests.map((t) => <span key={t} className="badge badge-soft">{t}</span>)}
                  </div>
                </div>
              )}
              <p className="mt-4 text-xs text-body-light">{notes}</p>
            </div>
            <div className="border-t border-[#eee] p-4">
              {issued ? (
                <div className="flex items-center gap-2">
                  <span className="flex flex-1 items-center justify-center gap-1.5 text-sm font-medium text-success">
                    ✓ Issued &amp; sent
                  </span>
                  <Button variant="light" size="sm" loading={downloading} onClick={handleDownload}>
                    Download PDF
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="light" size="sm" className="flex-1" loading={downloading} onClick={handleDownload}>
                    Download PDF
                  </Button>
                  <Button size="sm" className="flex-1" loading={saving} onClick={handleIssue}>Issue Rx</Button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </DoctorShell>
  );
}
