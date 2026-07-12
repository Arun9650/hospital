/* -------------------------------------------------------------------------
   Pure, client-safe time formatting. Kept dependency-free so both server code
   (lib/db.ts) and client components can import it.

   Timestamps are stored in the database as UTC (Postgres `timestamptz`). These
   helpers parse that value and render it in the viewer's LOCAL timezone — we
   never store a formatted / relative string, only compute it at display time.
   ---------------------------------------------------------------------- */

/** Short clock label for a timestamp, e.g. "9:02 AM" (local time). */
export function shortTime(ts: unknown): string {
  const d = new Date(String(ts ?? ""));
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Relative "time ago" label computed from `ts`, e.g. "just now" / "2m ago".
 * `now` is injectable so callers can render deterministically (client
 * components pass a value from state rather than reading the clock mid-render).
 */
export function relativeTime(ts: unknown, now: number = Date.now()): string {
  const d = new Date(String(ts ?? ""));
  if (isNaN(d.getTime())) return "";
  const secs = Math.round((now - d.getTime()) / 1000);
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
