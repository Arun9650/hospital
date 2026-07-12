"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/DashboardShell";
import { Avatar, Badge, Button, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { Appointment } from "@/lib/data";
import { updateAppointmentStatus } from "@/lib/actions/data";

type Status = "Pending" | "Accepted" | "Declined" | "Completed";

export function DoctorRequestsClient({ requests }: { requests: Appointment[] }) {
  const [states, setStates] = useState<Record<string, Status>>(
    Object.fromEntries(
      requests.map((r) => [
        r.id,
        r.status === "Pending"
          ? "Pending"
          : r.status === "Completed"
          ? "Completed"
          : r.status === "Cancelled"
          ? "Declined"
          : "Accepted",
      ])
    )
  );

  function set(id: string, s: Status) {
    setStates((prev) => ({ ...prev, [id]: s }));
    // Persist to Supabase (no-op in mock mode); UI already updated.
    if (s === "Accepted") updateAppointmentStatus(id, "Upcoming");
    if (s === "Declined") updateAppointmentStatus(id, "Cancelled");
  }

  // Finished consultations live in their own section, mirroring the patient view.
  const { active, completed } = useMemo(() => {
    const active: Appointment[] = [];
    const completed: Appointment[] = [];
    for (const r of requests) (states[r.id] === "Completed" ? completed : active).push(r);
    return { active, completed };
  }, [requests, states]);

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
            const s = states[r.id];
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
                      <p className="mt-2 max-w-xl text-sm text-body-light">
                        <span className="font-medium text-charcoal">Reason: </span>{r.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {s === "Pending" ? (
                      <>
                        <Button size="sm" onClick={() => set(r.id, "Accepted")}>Accept</Button>
                        <button className="btn btn-light btn-sm" onClick={() => set(r.id, "Declined")}>Decline</button>
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
                      <p className="text-sm text-mute">{r.mode} · {r.date} · {r.time} · ${r.fee}</p>
                      <p className="mt-2 max-w-xl text-sm text-body-light">
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
