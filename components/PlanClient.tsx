"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useSessionUser } from "@/components/SessionProvider";
import { setPlan } from "@/lib/actions/profile";
import { Button } from "@/components/ui";

const BENEFITS = [
  "Unlimited online consults — video, audio or chat",
  "Priority matching on Consult Now",
  "Discounts on medicines and lab tests",
  "Free annual health checkup",
];

export function PlanClient() {
  const user = useSessionUser();
  const router = useRouter();
  // Seed from the session so live mode reflects real membership; local state
  // also carries the demo (mock mode has no session).
  const [member, setMember] = useState((user?.plan ?? "free") === "plus");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: "plus" | "free") {
    setSaving(true);
    setError(null);
    const res = await setPlan(next);
    setSaving(false);
    if (!res.ok) {
      setError(res.error || "Something went wrong. Please try again.");
      return;
    }
    setMember(next === "plus");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-dark p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl font-normal tracking-tight">Aria Plus</span>
          {member && (
            <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-medium text-teal-bright">
              Active
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-white/60">
          One flat monthly fee for unlimited care across 20+ specialties.
        </p>
        <p className="mt-5">
          <span className="font-display text-4xl font-light">$9</span>
          <span className="text-white/60"> / month</span>
        </p>

        <ul className="mt-6 space-y-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-white/85">
              <Check size={17} className="mt-0.5 shrink-0 text-teal-bright" strokeWidth={2.6} />
              {b}
            </li>
          ))}
        </ul>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {member ? (
          <>
            <p className="mt-6 text-center text-sm text-teal-bright">You&apos;re an Aria Plus member.</p>
            <Button
              variant="light"
              full
              className="mt-3"
              loading={saving}
              onClick={() => change("free")}
            >
              Cancel membership
            </Button>
          </>
        ) : (
          <Button full className="mt-6" loading={saving} onClick={() => change("plus")}>
            Join Aria Plus
          </Button>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-mute">Cancel anytime. No payment taken in this demo.</p>
    </div>
  );
}
