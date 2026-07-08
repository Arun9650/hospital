"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Avatar, Button } from "@/components/ui";

type Med = { name: string; dose: string; frequency: string; duration: string };

const tabs = ["History", "Diagnosis", "Prescription", "Tests"] as const;
type Tab = (typeof tabs)[number];

const testOptions = ["CBC", "Lipid Profile", "ECG", "HbA1c", "Thyroid Panel", "Chest X-Ray", "Vitamin D", "Liver Function"];

export default function DoctorConsultation() {
  const [tab, setTab] = useState<Tab>("History");
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [meds, setMeds] = useState<Med[]>([
    { name: "Amlodipine", dose: "5 mg", frequency: "Once daily", duration: "30 days" },
  ]);
  const [tests, setTests] = useState<string[]>(["ECG"]);
  const [completed, setCompleted] = useState(false);

  function addMed() {
    setMeds((m) => [...m, { name: "", dose: "", frequency: "", duration: "" }]);
  }
  function updateMed(i: number, key: keyof Med, val: string) {
    setMeds((m) => m.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)));
  }
  function removeMed(i: number) {
    setMeds((m) => m.filter((_, idx) => idx !== i));
  }
  function toggleTest(t: string) {
    setTests((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  if (completed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-soft p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e5f5ee] text-3xl">✓</div>
          <h1 className="mt-5 font-display text-3xl font-light">Consultation complete</h1>
          <p className="mt-2 text-body-light">
            Prescription and test recommendations have been sent to the patient. Payment of $45 will be released to your account.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button href="/doctor/dashboard">Back to dashboard</Button>
            <Button href="/doctor/appointments" variant="light">Next patient</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white lg:h-dvh">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <Logo dark />
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#39d98a]" /> In consultation · Rohan Mehta
        </div>
        <Link href="/doctor/dashboard" className="text-sm text-white/60 hover:text-white">Exit</Link>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Video */}
        <div className="flex flex-col p-4 lg:w-1/2">
          <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a2540] to-[#04101f]">
            <div className="text-center">
              <Avatar initials="RM" color="#7a4bd1" size={100} />
              <p className="mt-4 font-display text-xl font-light">Rohan Mehta</p>
              <p className="text-sm text-white/50">34 · Male · Chest tightness</p>
            </div>
            <div className="absolute bottom-4 right-4 flex h-24 w-32 items-center justify-center rounded-xl border border-white/15 bg-[#111]">
              <Avatar initials="AR" color="#0070d1" size={44} />
              <span className="absolute bottom-1.5 left-2 text-[11px] text-white/70">You</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">🎙️</button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">🎥</button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">🖥️</button>
            <button
              onClick={() => setCompleted(true)}
              className="flex h-11 items-center gap-2 rounded-full bg-warning px-5 text-sm font-semibold"
            >
              End & complete
            </button>
          </div>
        </div>

        {/* Clinical workspace */}
        <aside className="flex min-h-[50dvh] flex-1 flex-col border-t border-white/10 bg-white text-black lg:min-h-0 lg:border-l lg:border-t-0">
          <div className="flex border-b border-[#eee]">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium ${tab === t ? "border-b-2 border-ps text-ps" : "text-mute"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {tab === "History" && (
              <div className="space-y-4 text-sm">
                <InfoBlock label="Chief complaint" value="Intermittent chest tightness for 5 days, worse on exertion." />
                <InfoBlock label="Medical history" value="Hypertension (2 yrs). Non-smoker. Father had CAD." />
                <InfoBlock label="Allergies" value="Penicillin" />
                <InfoBlock label="Current medications" value="Amlodipine 5mg OD" />
                <div>
                  <p className="mb-2 font-medium">Shared reports</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-lg bg-surface-card p-3">📄 Lipid Profile.pdf</div>
                    <div className="flex items-center gap-2 rounded-lg bg-surface-card p-3">📄 Previous ECG.pdf</div>
                  </div>
                </div>
              </div>
            )}

            {tab === "Diagnosis" && (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Diagnosis</span>
                  <input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Stable angina, suspected"
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Clinical notes & advice</span>
                  <textarea
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                    rows={6}
                    placeholder="Observations, lifestyle advice, follow-up plan…"
                    className="field"
                  />
                </label>
              </div>
            )}

            {tab === "Prescription" && (
              <div className="space-y-4">
                {meds.map((m, i) => (
                  <div key={i} className="rounded-lg border border-[#eee] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-mute">Medicine {i + 1}</span>
                      <button onClick={() => removeMed(i)} className="text-xs text-warning">Remove</button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} placeholder="Name" className="field" />
                      <input value={m.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} placeholder="Dose" className="field" />
                      <input value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} placeholder="Frequency" className="field" />
                      <input value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} placeholder="Duration" className="field" />
                    </div>
                  </div>
                ))}
                <button onClick={addMed} className="btn btn-light btn-sm w-full">+ Add medicine</button>
              </div>
            )}

            {tab === "Tests" && (
              <div>
                <p className="mb-3 text-sm font-medium">Recommend diagnostic tests</p>
                <div className="flex flex-wrap gap-2">
                  {testOptions.map((t) => (
                    <button key={t} onClick={() => toggleTest(t)} className={`chip ${tests.includes(t) ? "chip-active" : ""}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-mute">{tests.length} test(s) selected</p>
              </div>
            )}
          </div>

          <div className="border-t border-[#eee] p-4">
            <Button full onClick={() => setCompleted(true)}>
              Generate prescription & complete
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-card p-3">
      <p className="text-xs uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
