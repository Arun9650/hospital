"use client";

import { useLinkStatus } from "next/link";

/* -------------------------------------------------------------------------
   Shows a spinner while its parent <Link> navigation is in flight, so link
   buttons give the same "working…" feedback as action buttons and the app
   never feels frozen after a tap. Renders nothing until navigation is pending.
   Must be rendered as a descendant of a next/link <Link>.
   ---------------------------------------------------------------------- */
export function LinkPending({ size = 16 }: { size?: number }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden />;
}
