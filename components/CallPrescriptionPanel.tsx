"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { issuePrescriptionForAppointment } from "@/lib/actions/data";

type Med = { name: string; dose: string; frequency: string; duration: string };

const TEST_OPTIONS = ["CBC", "Lipid Profile", "ECG", "HbA1c", "Thyroid Panel", "Chest X-Ray"];

const emptyMed: Med = { name: "", dose: "", frequency: "", duration: "" };

/* -------------------------------------------------------------------------
   Compact prescription pad shown inside the consultation room (doctor only).
   Writes a structured prescription for the appointment's patient and notifies
   them. `onSent` lets the room drop a line in the call chat so the patient sees
   it happen live. Dark-themed to match the call UI.
   ---------------------------------------------------------------------- */
export function CallPrescriptionPanel({
  appointmentId,
  onSent,
}: {
  appointmentId: string;
  onSent?: (summary: string) => void;
}) {
  const { show } = useToast();
  const [diagnosis, setDiagnosis] = useState("");
  const [meds, setMeds] = useState<Med[]>([{ ...emptyMed }]);
  const [tests, setTests] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  function updateMed(i: number, k: keyof Med, v: string) {
    setMeds((m) => m.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  }
  function addMed() {
    setMeds((m) => [...m, { ...emptyMed }]);
  }
  function toggleTest(t: string) {
    setTests((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]));
  }

  async function send() {
    const cleanMeds = meds.filter((m) => m.name.trim());
    if (!diagnosis.trim() && cleanMeds.length === 0) {
      show("Add a diagnosis or at least one medicine.", "error");
      return;
    }
    setSaving(true);
    const res = await issuePrescriptionForAppointment(appointmentId, {
      diagnosis: diagnosis.trim(),
      medicines: cleanMeds,
      tests,
      notes: notes.trim(),
    });
    setSaving(false);
    if (!res.ok) {
      show("Couldn't send the prescription. Please try again.", "error");
      return;
    }
    setSent(true);
    show("Prescription sent to the patient.", "success");
    onSent?.(diagnosis.trim() || `${cleanMeds.length} medicine(s)`);
  }

  if (sent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#39d98a]/20 text-[#39d98a]">
          <Icon name="check" size={22} strokeWidth={2.4} />
        </span>
        <p className="font-display text-lg font-light">Prescription sent</p>
        <p className="text-sm text-white/50">
          The patient was notified and can view it under Prescriptions.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setDiagnosis("");
            setMeds([{ ...emptyMed }]);
            setTests([]);
            setNotes("");
          }}
          className="mt-2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium hover:bg-white/20"
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
      <Field label="Diagnosis">
        <input
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g. Stage 1 Hypertension"
          className={inputCls}
        />
      </Field>

      <div>
        <span className="mb-2 block font-medium text-white/80">Medicines</span>
        <div className="space-y-3">
          {meds.map((m, i) => (
            <div key={i} className="rounded-lg border border-white/10 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] text-white/40">Medicine {i + 1}</span>
                {meds.length > 1 && (
                  <button
                    onClick={() => setMeds((x) => x.filter((_, idx) => idx !== i))}
                    className="text-[11px] text-warning"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} placeholder="Name" className={inputCls} />
                <input value={m.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} placeholder="Dose" className={inputCls} />
                <input value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} placeholder="Frequency" className={inputCls} />
                <input value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} placeholder="Duration" className={inputCls} />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addMed}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/40 hover:text-white"
        >
          <span className="text-sm leading-none">＋</span> Add another medicine
        </button>
      </div>

      <div>
        <span className="mb-2 block font-medium text-white/80">Recommend tests</span>
        <div className="flex flex-wrap gap-2">
          {TEST_OPTIONS.map((t) => {
            const on = tests.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTest(t)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  on ? "bg-ps text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Advice & follow-up">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Lifestyle advice, follow-up timing…"
          className={`${inputCls} resize-none`}
        />
      </Field>

      <button
        onClick={send}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ps px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ps-pressed disabled:opacity-60"
      >
        {saving ? (
          <>
            <span className="spinner" style={{ width: 15, height: 15 }} /> Sending…
          </>
        ) : (
          <>
            <Icon name="send" size={15} /> Send prescription
          </>
        )}
      </button>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:bg-white/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-medium text-white/80">{label}</span>
      {children}
    </label>
  );
}
