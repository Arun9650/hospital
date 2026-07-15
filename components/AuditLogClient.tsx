"use client";

import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { loadAuditLog } from "@/lib/actions/data";
import type { AuditEntry } from "@/lib/data";

const roleTone: Record<string, "green" | "amber" | "red"> = {
  admin: "red",
  doctor: "green",
  patient: "amber",
};

function metaText(meta: Record<string, unknown>): string {
  return Object.entries(meta)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

export function AuditLogClient({
  initial,
  total,
}: {
  initial: AuditEntry[];
  total: number;
}) {
  const [entries, setEntries] = useState<AuditEntry[]>(initial);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const page = await loadAuditLog(entries.length);
    setEntries((prev) => [...prev, ...page.entries]);
    setLoading(false);
  }

  if (entries.length === 0) {
    return (
      <div className="card-flat p-12 text-center text-mute">
        No audited activity yet. Prescriptions, verification decisions, appointment
        changes and record uploads will appear here.
      </div>
    );
  }

  return (
    <>
      <div className="card-flat divide-y divide-[#f0f0f0]">
        {entries.map((e) => (
          <div key={e.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-surface-card px-1.5 py-0.5 text-xs font-medium">{e.action}</code>
                {e.actorRole && <Badge tone={roleTone[e.actorRole] ?? "amber"}>{e.actorRole}</Badge>}
              </div>
              <p className="mt-1 truncate text-sm">
                <span className="font-medium">{e.actor}</span>
                {e.target && <span className="text-mute"> → {e.target}</span>}
              </p>
              {metaText(e.meta) && <p className="truncate text-xs text-mute">{metaText(e.meta)}</p>}
            </div>
            <span className="shrink-0 text-xs text-mute">{e.time}</span>
          </div>
        ))}
      </div>

      {entries.length < total && (
        <div className="mt-6 text-center">
          <Button variant="light" onClick={loadMore} loading={loading} disabled={loading}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
