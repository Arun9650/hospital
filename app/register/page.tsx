"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Pills } from "@/components/Tabs";
import { signUpPatient } from "@/lib/actions/auth";

const concernOptions = [
  "General health",
  "Skin",
  "Mental health",
  "Heart",
  "Women's health",
  "Child care",
  "Diabetes",
  "Nutrition",
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [account, setAccount] = useState({ firstName: "", lastName: "", email: "", password: "" });

  function submitAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setAccount({
      firstName: String(f.get("firstName") ?? ""),
      lastName: String(f.get("lastName") ?? ""),
      email: String(f.get("email") ?? ""),
      password: String(f.get("password") ?? ""),
    });
    setStep(2);
  }

  const fullName = `${account.firstName} ${account.lastName}`.trim();

  return (
    <AuthShell
      quote="Aria remembered everything — my records, my meds, my last visit. Booking took under a minute."
      by="Marcus T., patient"
    >
      <div className="mb-6 flex items-center gap-2">
        {[1, 2].map((s) => (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-ps" : "bg-[#eee]"}`}
          />
        ))}
      </div>

      {step === 1 ? (
        <>
          <p className="eyebrow text-ps">Step 1 of 2 · Create account</p>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tight">
            Start with one conversation
          </h1>
          <p className="mt-2 text-body-light">
            Create your free Aria Health account in seconds.
          </p>
          <form className="mt-8 space-y-5" onSubmit={submitAccount}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name">
                <input name="firstName" required placeholder="Alex" className="field" defaultValue={account.firstName} />
              </Field>
              <Field label="Last name">
                <input name="lastName" required placeholder="Morgan" className="field" defaultValue={account.lastName} />
              </Field>
            </div>
            <Field label="Email address">
              <input type="email" name="email" required placeholder="you@email.com" className="field" defaultValue={account.email} />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <input type="password" name="password" required minLength={8} placeholder="••••••••" className="field" defaultValue={account.password} />
            </Field>
            <label className="flex items-start gap-2 text-sm text-charcoal">
              <input type="checkbox" required className="mt-1 h-4 w-4 accent-[#0070d1]" />
              I agree to the Terms and Privacy Policy.
            </label>
            <Button type="submit" full>
              Continue
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="eyebrow text-ps">Step 2 of 2 · Complete profile</p>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tight">
            Tell us a little about you
          </h1>
          <p className="mt-2 text-body-light">
            This helps doctors give you safer, more personal care.
          </p>
          <form className="mt-8 space-y-5" action={signUpPatient}>
            {/* carried from step 1 */}
            <input type="hidden" name="full_name" value={fullName} />
            <input type="hidden" name="email" value={account.email} />
            <input type="hidden" name="password" value={account.password} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Date of birth">
                <input type="date" name="dob" required className="field" />
              </Field>
              <Field label="Gender">
                <select name="gender" className="field" defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Non-binary</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>
            </div>
            <Field label="Phone number">
              <input type="tel" name="phone" placeholder="+1 555 000 1234" className="field" />
            </Field>
            <div>
              <span className="mb-2 block text-sm font-medium text-charcoal">
                What brings you here? <span className="text-mute">(optional)</span>
              </span>
              <Pills options={concernOptions} value={concerns} onChange={setConcerns} multi />
            </div>
            <div className="flex gap-3">
              <Button variant="light" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <SubmitButton className="flex-1">Finish & enter</SubmitButton>
            </div>
          </form>
        </>
      )}

      <p className="mt-8 text-center text-sm text-mute">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ps hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
