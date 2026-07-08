"use client";

import { useState } from "react";
import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { Badge, Button } from "@/components/ui";
import { saveAvailability } from "@/lib/actions/data";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const allSlots = ["9:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const defaultState: Record<string, { on: boolean; slots: string[] }> = {
  Monday: { on: true, slots: ["9:00", "10:00", "11:00", "16:00", "17:00"] },
  Tuesday: { on: true, slots: ["9:00", "10:00", "14:00", "15:00"] },
  Wednesday: { on: true, slots: ["16:00", "17:00", "18:00"] },
  Thursday: { on: true, slots: ["9:00", "10:00", "11:00"] },
  Friday: { on: true, slots: ["10:00", "14:00", "15:00", "16:00"] },
  Saturday: { on: true, slots: ["9:00", "10:00", "11:00"] },
  Sunday: { on: false, slots: [] },
};

export default function AvailabilityPage() {
  const [state, setState] = useState(defaultState);
  const [active, setActive] = useState("Monday");
  const [mode, setMode] = useState<Record<string, boolean>>({ Video: true, Audio: true, Chat: true, "In-person": false });

  function toggleDay(d: string) {
    setState((s) => ({ ...s, [d]: { ...s[d], on: !s[d].on } }));
  }
  function toggleSlot(d: string, slot: string) {
    setState((s) => {
      const slots = s[d].slots.includes(slot)
        ? s[d].slots.filter((x) => x !== slot)
        : [...s[d].slots, slot];
      return { ...s, [d]: { ...s[d], slots } };
    });
  }

  return (
    <DoctorShell>
      <PageHeader
        title="Availability"
        subtitle="Set your consulting hours and modes."
        action={<Button>Save changes</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Weekly editor */}
        <div className="card-flat p-6">
          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setActive(d)}
                className={`chip ${active === d ? "chip-active" : ""} ${!state[d].on ? "opacity-50" : ""}`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg bg-surface-card p-4">
            <div>
              <p className="font-medium">{active}</p>
              <p className="text-xs text-mute">
                {state[active].on ? `${state[active].slots.length} slots available` : "Marked unavailable"}
              </p>
            </div>
            <button
              onClick={() => toggleDay(active)}
              className={`relative h-6 w-11 rounded-full transition-colors ${state[active].on ? "bg-ps" : "bg-[#ccc]"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${state[active].on ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          {state[active].on && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-medium">Time slots</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {allSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(active, slot)}
                    className={`rounded-lg border px-2 py-2 text-sm ${
                      state[active].slots.includes(slot)
                        ? "border-ps bg-[#eaf3fc] text-ps"
                        : "border-[#e2e2e2] text-mute"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <aside className="space-y-6">
          <div className="card-flat p-6">
            <h3 className="font-medium">Consultation modes</h3>
            <div className="mt-4 space-y-3">
              {Object.keys(mode).map((m) => (
                <div key={m} className="flex items-center justify-between">
                  <span className="text-sm">{m}</span>
                  <button
                    onClick={() => setMode((s) => ({ ...s, [m]: !s[m] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${mode[m] ? "bg-ps" : "bg-[#ccc]"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${mode[m] ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card-flat p-6">
            <h3 className="font-medium">Quick status</h3>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="green">Accepting patients</Badge>
            </div>
            <Button variant="light" size="sm" full className="mt-4">Pause new bookings</Button>
          </div>

          <div className="card-dark p-6">
            <p className="text-sm text-white/60">Weekly capacity</p>
            <p className="mt-1 font-display text-2xl font-light">
              {Object.values(state).reduce((a, d) => a + (d.on ? d.slots.length : 0), 0)} slots
            </p>
            <p className="mt-1 text-xs text-white/50">across {Object.values(state).filter((d) => d.on).length} days</p>
          </div>
        </aside>
      </div>
    </DoctorShell>
  );
}
