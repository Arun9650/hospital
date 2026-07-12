/* -------------------------------------------------------------------------
   Shared line-icon set for Aria Health.

   Single source of truth for functional icons across the product so sizing,
   stroke weight and colour stay consistent. Icons inherit `currentColor` and
   default to a 1.7 stroke to match the dashboard sidebar (navConfigs.tsx).
   ---------------------------------------------------------------------- */

import type { SVGProps } from "react";

export type IconName =
  | "mic"
  | "mic-off"
  | "video"
  | "video-off"
  | "phone"
  | "phone-off"
  | "send"
  | "chat"
  | "hospital"
  | "close"
  | "check"
  | "calendar"
  | "clock"
  | "star"
  | "arrow-left"
  | "download"
  | "logout";

/* Path data (24×24 viewBox, stroke icons). */
const paths: Record<IconName, string> = {
  mic: "M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3zM19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8",
  "mic-off":
    "M1 1l22 22M9 9v2a3 3 0 004.6 2.5M15 10.5V5a3 3 0 00-5.9-.7M19 10v1a7 7 0 01-.6 2.8M12 18v4M8 22h8M5 11a7 7 0 001.9 4.8",
  video:
    "M15 8a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h9a2 2 0 002-2zM15 10l7-4v12l-7-4",
  "video-off":
    "M1 1l22 22M10 6h3a2 2 0 012 2v3M15 10l7-4v12l-4-2M2.5 6.5A2 2 0 002 8v8a2 2 0 002 2h9a2 2 0 001.5-.7",
  phone:
    "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8.1 9.6a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z",
  "phone-off":
    "M11 7a16 16 0 003 4M2 2l20 20M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-4-3.5 19.8 19.8 0 01-3-6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  hospital:
    "M4 21V5a2 2 0 012-2h12a2 2 0 012 2v16M2 21h20M12 7v6M9 10h6",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  calendar: "M7 3v4M17 3v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  "arrow-left": "M19 12H5M12 19l-7-7 7-7",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
};

/* Icons that read better filled (e.g. a rating star). */
const filled: Partial<Record<IconName, boolean>> = { star: true };

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className,
  ...rest
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
} & Omit<SVGProps<SVGSVGElement>, "name">) {
  const isFilled = filled[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke={isFilled ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
