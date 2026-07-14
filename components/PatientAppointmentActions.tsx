"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import type { Appointment } from "@/lib/data";
import { buildBookingDays } from "@/lib/booking";
import { cancelMyAppointment, rescheduleAppointment } from "@/lib/actions/data";

/* Cancel + reschedule for a patient's own pending/upcoming appointment.
   Optimistic-ish: we refresh the server tree on success so the moved/cancelled
   row reflects the DB. In mock mode the actions no-op ok:true and the refresh is
   a no-op, so the demo still feels responsive via the toast. */
export function PatientAppointmentActions({ appt }: { appt: Appointment }) {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState<"cancel" | "reschedule" | null>(null);
  const [picking, setPicking] = useState(false);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState("");
  // Dynamic upcoming days (from today). Reschedule uses default slots since the
  // per-card component doesn't carry the doctor's saved availability.
  const days = useMemo(() => buildBookingDays(), []);

  async function cancel() {
    if (!confirm("Cancel this appointment? Free cancellation up to 2 hours before the slot.")) return;
    setBusy("cancel");
    const res = await cancelMyAppointment(appt.id);
    setBusy(null);
    if (res.ok) {
      show("Appointment cancelled", "info");
      router.refresh();
    } else {
      show("Couldn't cancel — please try again", "error");
    }
  }

  async function reschedule() {
    if (!slot) return;
    setBusy("reschedule");
    const date = `${days[day].label}, ${days[day].date}`;
    const res = await rescheduleAppointment(appt.id, date, slot);
    setBusy(null);
    if (res.ok) {
      setPicking(false);
      show(`Moved to ${date}, ${slot}`, "success");
      router.refresh();
    } else {
      show("Couldn't reschedule — please try again", "error");
    }
  }

  return (
    <>
      {appt.status === "Upcoming" && (
        <Button href={`/consultation/${appt.id}?mode=${appt.mode}`} size="sm">Join</Button>
      )}
      <Button variant="light" size="sm" onClick={() => setPicking(true)} disabled={!!busy}>
        Reschedule
      </Button>
      <Button variant="ghost" size="sm" onClick={cancel} loading={busy === "cancel"} disabled={!!busy}>
        Cancel
      </Button>

      {picking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reschedule appointment"
          onClick={(e) => { if (e.target === e.currentTarget) setPicking(false); }}
        >
          <div className="card-flat w-full max-w-md p-6">
            <h2 className="font-display text-xl font-normal">Reschedule appointment</h2>
            <p className="mt-1 text-sm text-mute">Pick a new date & time with {appt.doctorName}.</p>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {days.map((d, i) => (
                <button
                  key={d.date}
                  onClick={() => { setDay(i); setSlot(""); }}
                  className={`flex min-w-[76px] flex-col items-center rounded-lg border px-4 py-3 ${
                    day === i ? "border-ps bg-[#eaf3fc]" : "border-[#e2e2e2]"
                  }`}
                >
                  <span className="text-xs text-mute">{d.label}</span>
                  <span className="mt-1 text-sm font-medium">{d.date}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {days[day].slots.map((s) => (
                <button key={s} onClick={() => setSlot(s)} className={`chip ${slot === s ? "chip-active" : ""}`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="light" size="sm" onClick={() => setPicking(false)}>Close</Button>
              <Button size="sm" onClick={reschedule} loading={busy === "reschedule"} disabled={!slot || !!busy}>
                Confirm new time
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
