/* Booking day/slot generation. Replaces the old static `bookingDays` (which had
   hardcoded, quickly-stale dates) with days generated from *today*, overlaid
   with the doctor's saved weekly availability when present. */

export type BookingDay = { label: string; date: string; slots: string[] };

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_SLOTS = ["9:00 AM", "10:30 AM", "1:15 PM", "4:00 PM", "6:30 PM"];

/** "16:00" → "4:00 PM". Availability is stored 24h; booking shows 12h. */
export function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m ?? 0).padStart(2, "0")} ${ap}`;
}

/** Next bookable days from today. With availability, only the doctor's enabled
   weekdays (with their slots) are shown; without it, sensible default slots. */
export function buildBookingDays(
  availability?: { day: string; enabled: boolean; slots: string[] }[],
  count = 6
): BookingDay[] {
  const hasAvail = !!availability?.length;
  const byDay = new Map(hasAvail ? availability!.map((a) => [a.day, a]) : []);
  const out: BookingDay[] = [];
  const now = new Date();
  // Scan a wider horizon when filtering by availability so we still surface
  // `count` bookable days even if the doctor works only a few weekdays.
  const horizon = hasAvail ? 21 : count;

  for (let i = 0; i < horizon && out.length < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    let slots: string[];
    if (hasAvail) {
      const av = byDay.get(WEEKDAYS[d.getDay()]);
      if (!av?.enabled || !av.slots.length) continue; // doctor off this day
      slots = av.slots.map(to12h);
    } else {
      slots = DEFAULT_SLOTS;
    }
    out.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      slots,
    });
  }
  return out;
}
