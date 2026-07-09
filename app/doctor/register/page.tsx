"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field } from "@/components/ui";
import { Pills } from "@/components/Tabs";
import { specialties } from "@/lib/data";
import { signUpDoctor } from "@/lib/actions/auth";

const stepsMeta = ["Account", "Credentials", "License upload", "Review"];

export default function DoctorRegister() {
  const [step, setStep] = useState(0);
  const [spec, setSpec] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [creds, setCreds] = useState({ experience: "", fee: "", qualifications: "" });

  function addFile(name: string) {
    setFiles((f) => (f.includes(name) ? f : [...f, name]));
  }

  function submitAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setAccount({
      name: String(f.get("full_name") ?? ""),
      email: String(f.get("email") ?? ""),
      password: String(f.get("password") ?? ""),
    });
    setStep(1);
  }

  return (
    <AuthShell
      quote="Aria gave me a full clinic online — verified patients, instant prescriptions, and payouts I can trust."
      by="Dr. Anaya Rao, Cardiology"
    >
      <p className="eyebrow text-ps">Doctor portal</p>
      <h1 className="mt-3 font-display text-3xl font-light tracking-tight">
        Join Aria Health as a doctor
      </h1>
      <p className="mt-2 text-body-light">
        Complete verification once — reach patients everywhere.
      </p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {stepsMeta.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={`h-1.5 flex-1 rounded-full ${step >= i ? "bg-ps" : "bg-[#eee]"}`} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-mute">Step {step + 1} of 4 · {stepsMeta[step]}</p>

      <div className="mt-6">
        {step === 0 && (
          <form className="space-y-5" onSubmit={submitAccount}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name"><input name="full_name" required placeholder="Dr. Jane Doe" className="field" defaultValue={account.name} /></Field>
              <Field label="Email"><input type="email" name="email" required placeholder="dr.jane@clinic.com" className="field" defaultValue={account.email} /></Field>
            </div>
            <Field label="Phone"><input type="tel" name="phone" placeholder="+1 555 000 1234" className="field" /></Field>
            <Field label="Password" hint="At least 8 characters"><input type="password" name="password" required minLength={8} className="field" defaultValue={account.password} /></Field>
            <Button type="submit" full>Continue</Button>
          </form>
        )}

        {step === 1 && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setCreds({
                experience: String(f.get("experience") ?? ""),
                fee: String(f.get("fee") ?? ""),
                qualifications: String(f.get("qualifications") ?? ""),
              });
              setStep(2);
            }}
          >
            <div>
              <span className="mb-2 block text-sm font-medium text-charcoal">Primary specialty</span>
              <Pills options={specialties.slice(0, 8).map((s) => s.name)} value={spec} onChange={setSpec} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Years of experience"><input name="experience" type="number" min={0} placeholder="10" className="field" defaultValue={creds.experience} /></Field>
              <Field label="Consultation fee (USD)"><input name="fee" type="number" min={0} placeholder="40" className="field" defaultValue={creds.fee} /></Field>
            </div>
            <Field label="Medical registration / license no."><input required placeholder="MCI-2025-XXXX" className="field" /></Field>
            <Field label="Qualifications"><input name="qualifications" placeholder="MD, DM (Cardiology)" className="field" defaultValue={creds.qualifications} /></Field>
            <div className="flex gap-3">
              <Button variant="light" className="flex-1" onClick={() => setStep(0)}>Back</Button>
              <Button type="submit" className="flex-1">Continue</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm text-body-light">
              Upload documents for verification. Your profile stays private until our team approves it (usually within 24 hours).
            </p>
            {[
              "Medical license",
              "Government ID",
              "Degree certificate",
              "Board registration",
            ].map((doc) => {
              const done = files.includes(doc);
              return (
                <button
                  key={doc}
                  onClick={() => addFile(doc)}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                    done ? "border-success bg-[#e5f5ee]" : "border-dashed border-[#cdd5dd] bg-surface-card hover:border-ash"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{done ? "✅" : "📎"}</span>
                    <span>
                      <span className="block text-sm font-medium">{doc}</span>
                      <span className="block text-xs text-mute">{done ? "Uploaded · license.pdf" : "PDF, JPG or PNG · max 10MB"}</span>
                    </span>
                  </span>
                  <span className="text-sm text-ps">{done ? "Replace" : "Upload"}</span>
                </button>
              );
            })}
            <div className="flex gap-3">
              <Button variant="light" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" disabled={files.length < 2} onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form className="space-y-5" action={signUpDoctor}>
            <input type="hidden" name="full_name" value={account.name} />
            <input type="hidden" name="email" value={account.email} />
            <input type="hidden" name="password" value={account.password} />
            <input type="hidden" name="specialty" value={spec[0] ?? ""} />
            <input type="hidden" name="experience" value={creds.experience} />
            <input type="hidden" name="fee" value={creds.fee} />
            <input type="hidden" name="qualifications" value={creds.qualifications} />

            <div className="rounded-lg bg-[#eaf3fc] p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🕓</span>
                <div>
                  <p className="font-medium text-ps">Verification in progress</p>
                  <p className="text-sm text-body-light">We’ll email you once your credentials are approved.</p>
                </div>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between"><span>Specialty</span><span className="font-medium">{spec[0] ?? "—"}</span></li>
              <li className="flex items-center justify-between"><span>Documents uploaded</span><span className="font-medium">{files.length} files</span></li>
              <li className="flex items-center justify-between"><span>Status</span><span className="badge badge-amber">Pending review</span></li>
            </ul>
            <Button type="submit" full>
              Go to dashboard
            </Button>
          </form>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-mute">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-ps hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
