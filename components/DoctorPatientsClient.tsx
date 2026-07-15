"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/DashboardShell";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { loadPatientRecords } from "@/lib/actions/records";
import type { MedicalRecord, Patient } from "@/lib/data";

const recordTypeIcon: Record<string, string> = {
  "Lab Report": "🧪",
  Prescription: "📄",
  Scan: "🩻",
  "Discharge Summary": "🏥",
  Vaccination: "💉",
};

export function DoctorPatientsClient({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState("");
  // Explicit selection. Drives the mobile master/detail toggle: null => show the
  // list, set => show that patient's record (with a back button on small screens).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q)
    );
  }, [patients, query]);

  // On large screens the detail pane always shows something; fall back to the
  // first patient in the (filtered) list when nothing is explicitly selected.
  const active =
    filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null;

  return (
    <>
      <PageHeader
        title="Patient records"
        subtitle="Review histories before and after consultations."
        action={
          <div className="flex w-full items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-4 py-2 sm:w-auto">
            <span className="text-mute">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients"
              className="w-full bg-transparent text-sm outline-none sm:w-40"
            />
          </div>
        }
      />

      {patients.length === 0 ? (
        <EmptyState
          title="No patients yet"
          body="Patients you consult with will appear here for quick access to their history."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* List */}
          <div className={selectedId ? "hidden lg:block" : "block"}>
            {filtered.length === 0 ? (
              <EmptyState
                title="No matches"
                body={`No patients match "${query}".`}
              />
            ) : (
              <div className="card-flat divide-y divide-[#f0f0f0]">
                {filtered.map((p) => {
                  const isActive = active?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`press flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[#f7fbff] ${
                        isActive ? "bg-[#f7fbff]" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <Avatar initials={p.initials} color={p.color} size={44} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-mute">
                            {[p.age > 0 ? `${p.age}` : null, p.gender || null, p.condition]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-mute">Last visit</p>
                        <p className="text-sm font-medium">{p.lastVisit}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected patient detail */}
          <div className={selectedId ? "block" : "hidden lg:block"}>
            {active ? (
              <PatientDetail
                patient={active}
                onBack={() => setSelectedId(null)}
              />
            ) : (
              <div className="card-flat p-6">
                <EmptyState
                  title="Select a patient"
                  body="Choose a patient from the list to view their record."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PatientDetail({
  patient,
  onBack,
}: {
  patient: Patient;
  onBack: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);

  // A treating doctor may read this patient's uploaded records (RLS 0015).
  // Fetch on selection; null = loading. Live-mode only — mock has no patients.
  const [records, setRecords] = useState<MedicalRecord[] | null>(null);
  useEffect(() => {
    let alive = true;
    setRecords(null);
    loadPatientRecords(patient.id).then((r) => alive && setRecords(r));
    return () => {
      alive = false;
    };
  }, [patient.id]);

  function go(href: string, message: string) {
    setTarget(href);
    show(message, "info");
    startTransition(() => router.push(href));
  }

  return (
    <div className="card-flat p-5 sm:p-6">
      {/* Back to list — mobile only (both panes are visible on desktop). */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-mute hover:text-charcoal lg:hidden"
      >
        <Icon name="arrow-left" size={16} /> All patients
      </button>

      <div className="flex items-center gap-4">
        <Avatar initials={patient.initials} color={patient.color} size={56} />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-normal">{patient.name}</p>
          <p className="text-sm text-mute">
            {[
              patient.age > 0 ? `${patient.age}` : null,
              patient.gender || null,
              `${patient.visits} visit${patient.visits === 1 ? "" : "s"}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Info label="Blood group" value={patient.bloodGroup} />
        <Info label="Allergies" value={patient.allergies} />
        <Info label="Height" value={patient.height} />
        <Info label="Weight" value={patient.weight} />
      </div>

      <h3 className="mt-6 text-sm font-medium">Recent history</h3>
      {patient.history.length === 0 ? (
        <p className="mt-2 text-sm text-mute">No recorded history yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {patient.history.map((h) => (
            <div
              key={`${h.date}-${h.title}`}
              className="flex items-start gap-3 rounded-lg bg-surface-card p-3"
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ps" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{h.title}</p>
                <p className="text-xs text-mute">
                  {h.date} · {h.by}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="mt-6 text-sm font-medium">Uploaded documents</h3>
      {records === null ? (
        <p className="mt-2 text-sm text-mute">Loading records…</p>
      ) : records.length === 0 ? (
        <p className="mt-2 text-sm text-mute">No documents uploaded.</p>
      ) : (
        <div className="mt-3 divide-y divide-[#f0f0f0]">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-card text-lg">
                  {recordTypeIcon[r.type] ?? "📄"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-mute">
                    {r.type} · {r.date} · {r.size}
                  </p>
                </div>
              </div>
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-light btn-sm shrink-0"
                >
                  View
                </a>
              ) : (
                <span className="shrink-0 text-xs text-mute">Demo file</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button
          size="sm"
          full
          className="sm:w-auto"
          loading={pending && target === "/doctor/appointments"}
          disabled={pending}
          onClick={() =>
            go("/doctor/appointments", `Opening consultation for ${patient.name}…`)
          }
        >
          Start consultation
        </Button>
        <Button
          variant="light"
          size="sm"
          full
          className="sm:w-auto"
          loading={pending && target === "/doctor/prescriptions"}
          disabled={pending}
          onClick={() =>
            go("/doctor/prescriptions", "Opening prescription pad…")
          }
        >
          Write prescription
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-card p-3">
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-0.5 break-words font-medium">{value}</p>
    </div>
  );
}
