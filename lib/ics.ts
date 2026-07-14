/* Minimal RFC-5545 calendar invite for an appointment. Native — no dependency.
   The DB stores human labels ("Jul 8", "3:15 PM"), not timestamps, so we parse
   them best-effort and fall back to now+1h if a label is unrecognisable, keeping
   the .ics always valid. Emits floating local time (no TZID) which every calendar
   app reads as the user's own zone — fine until a real timestamp column lands.
   ponytail: label parser, replace with a real DTSTART column for cross-timezone. */

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

/** Parse a "Today, Jul 8" / "Jul 8, 2026" date label + "3:15 PM" time into a Date. */
export function parseSlot(dateLabel: string, timeLabel: string): Date | null {
  const md = dateLabel.match(/([A-Za-z]{3,})\s+(\d{1,2})/);
  const tm = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!md || !tm) return null;
  const mon = MONTHS.indexOf(md[1].slice(0, 3).toLowerCase());
  if (mon < 0) return null;
  const year = Number(dateLabel.match(/\b(20\d{2})\b/)?.[1] ?? new Date().getFullYear());
  let hour = Number(tm[1]) % 12;
  if (/pm/i.test(tm[3])) hour += 12;
  return new Date(year, mon, Number(md[2]), hour, Number(tm[2]));
}

const pad = (n: number) => String(n).padStart(2, "0");
const floating = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const esc = (s: string) => s.replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");

export function appointmentIcs(appt: {
  id: string;
  doctorName: string;
  mode: string;
  dateLabel: string;
  timeLabel: string;
  reason?: string;
}): string {
  const start = parseSlot(appt.dateLabel, appt.timeLabel) ?? new Date(Date.now() + 3600_000);
  const end = new Date(start.getTime() + 30 * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aria Health//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${appt.id}@aria-health`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${floating(start)}`,
    `DTEND:${floating(end)}`,
    `SUMMARY:${esc(`${appt.mode} consultation with ${appt.doctorName}`)}`,
    appt.reason ? `DESCRIPTION:${esc(appt.reason)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}
