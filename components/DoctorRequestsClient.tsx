"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/DashboardShell";
import { Avatar, Badge, Button, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import type { Appointment } from "@/lib/data";
import { updateAppointmentStatus } from "@/lib/actions/data";

type Status = "Pending" | "Accepted" | "Declined" | "Completed";

// The row's display status, derived from the appointment's DB status. Kept as a
// pure function of props so a live refresh (router.refresh) that brings new or
// updated requests is reflected immediately — nothing is frozen in state.
function statusFromRequest(r: Appointment): Status {
  return r.status === "Pending"
    ? "Pending"
    : r.status === "Completed"
    ? "Completed"
    : r.status === "Cancelled"
    ? "Declined"
    : "Accepted";
}

export function DoctorRequestsClient({ requests }: { requests: Appointment[] }) {
  const { show } = useToast();
  // Optimistic local changes, layered over the server-derived status. Only ids
  // the doctor just acted on live here; everything else follows the props, so
  // realtime refreshes surface new requests and status changes on their own.
  const [overrides, setOverrides] = useState<Record<string, Status>>({});
  // Which row is mid-request, so we can show a spinner and block double-clicks.
  const [pending, setPending] = useState<Record<string, Status | undefined>>({});

  const statusOf = (r: Appointment): Status => overrides[r.id] ?? statusFromRequest(r);

  async function set(id: string, s: Status, patient?: string) {
    if (pending[id]) return;
    setPending((prev) => ({ ...prev, [id]: s }));
    // Persist to Supabase (no-op in mock mode) and reflect the result once done.
    if (s === "Accepted") await updateAppointmentStatus(id, "Upcoming");
    if (s === "Declined") await updateAppointmentStatus(id, "Cancelled");
    setOverrides((prev) => ({ ...prev, [id]: s }));
    setPending((prev) => ({ ...prev, [id]: undefined }));
    if (s === "Accepted") show(`Request from ${patient ?? "patient"} accepted`, "success");
    if (s === "Declined") show(`Request from ${patient ?? "patient"} declined`, "info");
  }

  // Finished consultations live in their own section, mirroring the patient view.
  const { active, completed } = useMemo(() => {
    const active: Appointment[] = [];
    const completed: Appointment[] = [];
    for (const r of requests) (statusOf(r) === "Completed" ? completed : active).push(r);
    return { active, completed };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, overrides]);

  return (
    <>
      <PageHeader
        title="Appointment requests"
        subtitle="Accept, decline or start consultations."
      />

      {active.length === 0 ? (
        <EmptyState
          title="No pending requests"
          body="New consultation requests from patients will appear here."
        />
      ) : (
        <div className="stagger space-y-4">
          {active.map((r) => {
            const s = statusOf(r);
            return (
              <div key={r.id} className="card-flat lift p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <Avatar initials={r.patientName.slice(0, 2)} color="#7a4bd1" size={48} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{r.patientName}</p>
                        <Badge tone={s === "Pending" ? "amber" : s === "Accepted" ? "green" : "red"}>{s}</Badge>
                      </div>
                      <p className="text-sm text-mute">{r.mode} · {r.date} · {r.time} · ${r.fee}</p>
                      <p className="mt-2 max-w-xl text-xs text-body-light">
                        <span className="font-medium text-charcoal">Reason: </span>{r.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {s === "Pending" ? (
                      <>
                        <Button
                          size="sm"
                          loading={pending[r.id] === "Accepted"}
                          disabled={!!pending[r.id]}
                          onClick={() => set(r.id, "Accepted", r.patientName)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          loading={pending[r.id] === "Declined"}
                          disabled={!!pending[r.id]}
                          onClick={() => set(r.id, "Declined", r.patientName)}
                        >
                          Decline
                        </Button>
                      </>
                    ) : s === "Accepted" ? (
                      <>
                        <Link href={`/consultation/${r.id}`} className="btn btn-primary btn-sm">Start</Link>
                        <Link href="/doctor/patients" className="btn btn-light btn-sm">History</Link>
                      </>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => set(r.id, "Pending")}>Undo</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-light tracking-tight">
            <Icon name="check" size={18} className="text-success" /> Completed consultations
          </h2>
          <div className="stagger space-y-4">
            {completed.map((r) => (
              <div key={r.id} className="card-flat p-5 opacity-90">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <Avatar initials={r.patientName.slice(0, 2)} color="#7a4bd1" size={48} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{r.patientName}</p>
                        <Badge tone="green">Completed</Badge>
                      </div>
                      <p className="text-xs text-mute">{r.mode} · {r.date} · {r.time} · ${r.fee}</p>
                      <p className="mt-2 max-w-xl text-xs text-body-light">
                        <span className="font-medium text-charcoal">Reason: </span>{r.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href="/doctor/prescriptions" className="btn btn-light btn-sm">Prescription</Link>
                    <Link href="/doctor/patients" className="btn btn-ghost btn-sm">History</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
