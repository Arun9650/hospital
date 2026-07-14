"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Button, Field, Stars } from "@/components/ui";
import type { Doctor } from "@/lib/data";
import { buildBookingDays, type BookingDay } from "@/lib/booking";
import { createAppointment } from "@/lib/actions/data";
import { appointmentIcs } from "@/lib/ics";

const steps = ["Consultation", "Date & time", "Details", "Payment"];

const modeInfo: Record<string, { icon: string; desc: string }> = {
  Video: { icon: "🎥", desc: "Face-to-face video call" },
  Audio: { icon: "📞", desc: "Voice-only phone call" },
  Chat: { icon: "💬", desc: "Text-based messaging" },
  "In-person": { icon: "🏥", desc: "Visit the clinic" },
};

export function BookingWizardClient({ doctor, days }: { doctor: Doctor; days?: BookingDay[] }) {
  // Days come from the server with the doctor's real availability applied; fall
  // back to generated default days if rendered without them.
  const bookingDays = days ?? buildBookingDays();
  // Chat first: surface the chat option ahead of other modes, and preselect it.
  const orderedModes = [...doctor.modes].sort(
    (a, b) => (a === "Chat" ? -1 : 0) - (b === "Chat" ? -1 : 0)
  );
  const defaultMode = doctor.modes.includes("Chat") ? "Chat" : doctor.modes[0] ?? "";

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<string>(defaultMode);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string>("");
  const [reason, setReason] = useState("");
  const [feeAck, setFeeAck] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apptId, setApptId] = useState<string | undefined>();

  const canNext =
    (step === 0 && mode) ||
    (step === 1 && slot) ||
    step === 2 ||
    step === 3;

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    const res = await createAppointment({
      id:doctor.id,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      mode,
      date: `${bookingDays[day].label}, ${bookingDays[day].date}`,
      time: slot,
      fee: doctor.fee,
      reason,
    });
    setSaving(false);
    // Only show the confirmation once the appointment is actually saved. A
    // failed booking must NOT report success (and never created a notification).
    if (!res.ok) {
      setError(res.error || "We couldn't complete your booking. Please try again.");
      return;
    }
    setApptId(res.id);
    setDone(true);
  }

  if (done) {
    return (
      <Confirmation
        doctor={doctor}
        mode={mode}
        day={bookingDays[day]}
        slot={slot}
        reason={reason}
        apptId={apptId}
      />
    );
  }

  if (bookingDays.length === 0) {
    return (
      <>
        <Link href={`/patient/doctors/${doctor.id}`} className="text-sm text-ps hover:underline">
          ← Back to profile
        </Link>
        <div className="card-flat mt-4 p-8 text-center">
          <h1 className="font-display text-2xl font-light">No open slots right now</h1>
          <p className="mt-2 text-sm text-mute">
            {doctor.name} has no available times in the next few weeks. Please check back later.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Link href={`/patient/doctors/${doctor.id}`} className="text-sm text-ps hover:underline">
        ← Back to profile
      </Link>
      <h1 className="mt-4 font-display text-3xl font-light tracking-tight">Book appointment</h1>

      {/* Stepper */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i < step ? "bg-ps text-white" : i === step ? "bg-ps text-white" : "bg-white text-mute border border-[#e2e2e2]"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={`text-sm ${i === step ? "font-medium text-black" : "text-mute"}`}>{s}</span>
            {i < steps.length - 1 && <span className="mx-1 hidden h-px w-8 bg-[#ddd] sm:block" />}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card-flat min-w-0 p-6">
          {step === 0 && (
            <div>
              <h2 className="font-display text-xl font-normal">How would you like to consult?</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {orderedModes.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                      mode === m ? "border-ps bg-[#eaf3fc]" : "border-[#e2e2e2] hover:border-ash"
                    }`}
                  >
                    <span className="text-2xl">{modeInfo[m].icon}</span>
                    <span>
                      <span className="block font-medium">{m}</span>
                      <span className="block text-xs text-mute">{modeInfo[m].desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-normal">Pick a date & time</h2>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {bookingDays.map((d, i) => (
                  <button
                    key={d.date}
                    onClick={() => { setDay(i); setSlot(""); }}
                    className={`flex min-w-[76px] flex-col items-center rounded-lg border px-4 py-3 ${
                      day === i ? "border-ps bg-[#eaf3fc]" : "border-[#e2e2e2]"
                    }`}
                  >
                    <span className="text-xs text-mute">{d.label}</span>
                    <span className="mt-1 text-sm font-medium">{d.date}</span>
                    <span className="mt-1 text-[10px] text-success">{d.slots.length} slots</span>
                  </button>
                ))}
              </div>
              <p className="mt-5 text-sm font-medium">Available times</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {bookingDays[day].slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={`chip ${slot === s ? "chip-active" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-normal">Consultation details</h2>
              <Field label="Who is this appointment for?">
                <select className="field" defaultValue="Myself">
                  <option>Myself</option>
                  <option>My child</option>
                  <option>A family member</option>
                </select>
              </Field>
              <Field label="Reason for visit" hint="This is shared securely with your doctor.">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Briefly describe your symptoms or concern…"
                  className="field"
                />
              </Field>
              <Field label="Upload reports (optional)">
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-[#cdd5dd] bg-surface-card p-5 text-sm text-mute">
                  <span className="text-xl">📎</span> Drag & drop lab reports or photos, or click to browse
                </div>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-normal">Payment</h2>
              <div className="flex gap-2">
                {["Card", "UPI", "Wallet"].map((p, i) => (
                  <button key={p} className={`chip ${i === 0 ? "chip-active" : ""}`}>{p}</button>
                ))}
              </div>
              <Field label="Card number">
                <input className="field" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry"><input className="field" placeholder="MM/YY" defaultValue="08/28" /></Field>
                <Field label="CVC"><input className="field" placeholder="123" defaultValue="123" /></Field>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#eaf3fc] p-3 text-sm text-ps">
                🔒 Payments are encrypted. You won’t be charged until the doctor confirms.
              </div>
              <label className="flex items-start gap-2.5 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={feeAck}
                  onChange={(e) => setFeeAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#0070d1]"
                />
                <span>
                  I understand the consultation fee is <span className="font-medium">${doctor.fee}</span>, and
                  that free cancellation is available up to 2 hours before the appointment.
                </span>
              </label>
            </div>
          )}

          {error && (
            <p className="mt-6 rounded-lg bg-[#fbe7ea] px-4 py-3 text-sm text-warning" role="alert">
              {error}
            </p>
          )}

          {/* Nav buttons */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="light"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleConfirm} loading={saving} disabled={saving || !feeAck}>
                {saving ? "Processing…" : `Pay $${doctor.fee} & confirm`}
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside>
          <div className="card-flat sticky top-24 p-6">
            <div className="flex items-center gap-3">
              <Avatar initials={doctor.initials} color={doctor.photo} size={48} />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium">{doctor.name}</p>
                  {doctor.verified && (
                    <svg width="14" height="14" viewBox="0 0 24 24" className="text-ps">
                      <circle cx="12" cy="12" r="10" fill="currentColor" />
                      <path d="M17 9l-5.5 5.5L8 11" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-mute">{doctor.specialty}</p>
              </div>
            </div>
            <div className="mt-2"><Stars value={doctor.rating} /></div>

            <dl className="mt-5 space-y-3 text-sm">
              <Row label="Consultation" value={mode || "—"} />
              <Row label="Date" value={slot ? `${bookingDays[day].label}, ${bookingDays[day].date}` : "—"} />
              <Row label="Time" value={slot || "—"} />
            </dl>
            <div className="mt-4 border-t border-[#eee] pt-4">
              <div className="flex items-center justify-between text-sm text-mute">
                <span>Consultation fee</span><span>${doctor.fee}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-mute">
                <span>Platform fee</span><span>$0</span>
              </div>
              <div className="mt-2 flex items-center justify-between font-display text-lg">
                <span>Total</span><span>${doctor.fee}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-mute">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Confirmation({
  doctor,
  mode,
  day,
  slot,
  reason,
  apptId,
}: {
  doctor: Doctor;
  mode: string;
  day: BookingDay;
  slot: string;
  reason: string;
  apptId?: string;
}) {
  // Reference number: stable, human-readable, derived from the appointment id.
  const bookingRef = apptId
    ? `ARIA-${apptId.replace(/-/g, "").slice(0, 6).toUpperCase()}`
    : "ARIA-DEMO01";

  function downloadIcs() {
    const ics = appointmentIcs({
      id: apptId ?? bookingRef,
      doctorName: doctor.name,
      mode,
      dateLabel: `${day.label}, ${day.date}`,
      timeLabel: slot,
      reason,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `aria-appointment-${bookingRef}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card-flat overflow-hidden text-center">
        <div className="bg-ps px-8 py-10 text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-5 font-display text-3xl font-light">Appointment confirmed</h1>
          <p className="mt-2 text-white/80">Payment of ${doctor.fee} was successful. A receipt is saved to your records.</p>
          <p className="mt-1 text-sm text-white/70">
            Booking reference <span className="font-mono font-medium text-white">{bookingRef}</span>
          </p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-center gap-3">
            <Avatar initials={doctor.initials} color={doctor.photo} size={52} />
            <div className="text-left">
              <p className="font-medium">{doctor.name}</p>
              <p className="text-sm text-mute">{doctor.specialty}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            <Detail label="Type" value={mode} />
            <Detail label="Date" value={`${day.label}, ${day.date}`} />
            <Detail label="Time" value={slot} />
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button href={apptId ? `/consultation/${apptId}?mode=${mode}` : "/patient/appointments"}>
              {mode === "Chat" ? "Open chat room" : "Join consultation"}
            </Button>
            <Button href="/patient/appointments" variant="light">View appointments</Button>
            <Button variant="ghost" onClick={downloadIcs}>Add to calendar</Button>
          </div>

          <div className="mt-6 border-t border-[#eee] pt-6">
            <p className="text-sm font-medium">What’s next?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <NextLink icon="🧪" label="Book a lab test" href="/patient/records" />
              <NextLink icon="💊" label="Order medicines" href="/patient/prescriptions" />
              <NextLink icon="🔁" label="Schedule follow-up" href={`/patient/book/${doctor.id}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-card p-4">
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function NextLink({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link href={href} className="card lift flex items-center gap-2 p-3 text-sm">
      <span className="text-lg">{icon}</span> {label}
    </Link>
  );
}
