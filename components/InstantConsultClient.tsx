"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Phone, MessageSquare, Loader2, Check } from "lucide-react";
import { instantMatch } from "@/lib/actions/data";
import { Button } from "@/components/ui";

const MODES = [
  { key: "Video", label: "Video", icon: Video },
  { key: "Audio", label: "Audio", icon: Phone },
  { key: "Chat", label: "Chat", icon: MessageSquare },
] as const;

type Mode = (typeof MODES)[number]["key"];

export function InstantConsultClient({ specialties }: { specialties: string[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("Video");
  const [specialty, setSpecialty] = useState("");
  const [phase, setPhase] = useState<"idle" | "matching" | "matched">("idle");
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPhase("matching");
    setError(null);
    const res = await instantMatch({ mode, specialty: specialty || undefined });
    if (!res.ok || !res.roomId) {
      setPhase("idle");
      setError(res.error || "Couldn't match you right now. Please try again.");
      return;
    }
    setMatchedName(res.doctorName ?? "your doctor");
    setPhase("matched");
    // Brief "matched" beat, then drop straight into the shared consultation room.
    setTimeout(() => router.push(`/consultation/${res.roomId}?mode=${mode}`), 1300);
  }

  // Matching / matched overlay — a lightweight queue animation. ponytail: the
  // queue position + wait are illustrative, not a real queue; the match already
  // happened server-side by the time this shows.
  if (phase !== "idle") {
    const matched = phase === "matched";
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3fc]">
          {matched ? (
            <Check size={30} className="text-ps" strokeWidth={2.6} />
          ) : (
            <Loader2 size={30} className="animate-spin text-ps" />
          )}
        </div>
        <h2 className="mt-5 font-display text-xl font-normal tracking-tight">
          {matched ? `Matched with ${matchedName}` : "Finding your doctor…"}
        </h2>
        <p className="mt-1.5 text-sm text-mute">
          {matched
            ? "Connecting you to the consultation room."
            : "Matching you with the next available doctor across our network."}
        </p>
        {!matched && (
          <dl className="mt-6 space-y-2 text-left text-sm">
            <div className="flex justify-between border-t border-[#f0f0f0] pt-2">
              <dt className="text-mute">Queue position</dt>
              <dd className="font-medium">1 of 3</dd>
            </div>
            <div className="flex justify-between border-t border-[#f0f0f0] pt-2">
              <dt className="text-mute">Estimated wait</dt>
              <dd className="font-medium">~40 sec</dd>
            </div>
            <div className="flex justify-between border-t border-[#f0f0f0] pt-2">
              <dt className="text-mute">Mode</dt>
              <dd className="font-medium">{mode}</dd>
            </div>
          </dl>
        )}
      </div>
    );
  }

  return (
    <div className="card mx-auto max-w-md p-6 sm:p-8">
      <div>
        <p className="text-sm font-medium">Consultation mode</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition ${
                  active
                    ? "border-ps bg-[#eaf3fc] text-ps"
                    : "border-[color:var(--hairline-light)] text-ink hover:bg-[#f7f7f7]"
                }`}
              >
                <Icon size={20} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="specialty" className="text-sm font-medium">
          Specialty <span className="text-mute">(optional)</span>
        </label>
        <select
          id="specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="field mt-2"
        >
          <option value="">Any specialty</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <Button full className="mt-6" onClick={start}>
        Find a doctor now
      </Button>
      <p className="mt-3 text-center text-xs text-mute">Avg. match time under 60 seconds</p>
    </div>
  );
}
