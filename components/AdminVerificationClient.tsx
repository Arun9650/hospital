"use client";

import { useState } from "react";
import { Avatar, Badge, Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { decideVerification } from "@/lib/actions/data";

type Decision = "pending" | "approved" | "rejected";
type QueueItem = {
  id: string;
  name: string;
  specialty: string;
  submitted: string;
  docs: number;
  status: string;
};

export function AdminVerificationClient({ queue }: { queue: QueueItem[] }) {
  const { show } = useToast();
  const [decisions, setDecisions] = useState<Record<string, Decision>>(
    Object.fromEntries(queue.map((v) => [v.id, "pending"]))
  );
  // Which row is mid-request, so we can spin the button and block double-clicks.
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  async function decide(id: string, d: Decision, name?: string) {
    // Undo (back to pending) is local-only — the action persists decisions.
    if (d === "pending") {
      setDecisions((prev) => ({ ...prev, [id]: d }));
      return;
    }
    if (busy[id]) return;
    setBusy((prev) => ({ ...prev, [id]: true }));
    const res = await decideVerification(id, d);
    setBusy((prev) => ({ ...prev, [id]: false }));
    if (res.ok) {
      setDecisions((prev) => ({ ...prev, [id]: d }));
      show(`${name ?? "Doctor"} ${d === "approved" ? "approved" : "rejected"}`, d === "approved" ? "success" : "info");
    } else {
      show("Couldn't save that decision. Please try again.", "error");
    }
  }

  if (queue.length === 0) {
    return <p className="card-flat p-8 text-center text-sm text-mute">No doctors awaiting verification.</p>;
  }

  return (
    <div className="space-y-4">
      {queue.map((v) => {
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
                    <Button
                      size="sm"
                      loading={busy[v.id]}
                      disabled={busy[v.id]}
                      onClick={() => decide(v.id, "approved", v.name)}
                    >
                      Approve
                    </Button>
                    <button className="btn btn-light btn-sm">Documents</button>
                    <button
                      className="btn btn-sm bg-[#fbe7ea] text-warning disabled:opacity-60"
                      disabled={busy[v.id]}
                      onClick={() => decide(v.id, "rejected", v.name)}
                    >
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
  );
}
