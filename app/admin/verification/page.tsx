"use client";

import { useState } from "react";
import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Avatar, Badge, Button } from "@/components/ui";
import { verificationQueue } from "@/lib/data";

type Decision = "pending" | "approved" | "rejected";

export default function AdminVerification() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>(
    Object.fromEntries(verificationQueue.map((v) => [v.id, "pending"]))
  );

  function decide(id: string, d: Decision) {
    setDecisions((prev) => ({ ...prev, [id]: d }));
  }

  const pending = Object.values(decisions).filter((d) => d === "pending").length;

  return (
    <AdminShell>
      <PageHeader
        title="Verification queue"
        subtitle={`${pending} doctors awaiting review`}
      />

      <div className="space-y-4">
        {verificationQueue.map((v) => {
          const d = decisions[v.id];
          return (
            <div key={v.id} className="card-flat p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar initials={v.name.replace("Dr. ", "").slice(0, 2)} color="#7a4bd1" size={48} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{v.name}</p>
                      <Badge tone={d === "pending" ? "amber" : d === "approved" ? "green" : "red"}>
                        {d === "pending" ? v.status : d}
                      </Badge>
                    </div>
                    <p className="text-sm text-mute">{v.specialty} · submitted {v.submitted}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["License", "Government ID", "Degree", "Board Reg."].slice(0, v.docs).map((doc) => (
                        <span key={doc} className="flex items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 text-xs">
                          📄 {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {d === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => decide(v.id, "approved")}>Approve</Button>
                      <button className="btn btn-light btn-sm">Documents</button>
                      <button className="btn btn-sm bg-[#fbe7ea] text-warning" onClick={() => decide(v.id, "rejected")}>
                        Reject
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => decide(v.id, "pending")}>Undo</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
