"use client";

import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/auth";

export function ProfileForm({ initial }: { initial: Profile }) {
  const { show } = useToast();
  const [full_name, setName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone);
  const [dob, setDob] = useState(initial.dob);
  const [gender, setGender] = useState(initial.gender);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ full_name, phone, dob, gender });
    setSaving(false);
    show(
      res.ok ? "Profile saved." : res.error ?? "Couldn't save your profile.",
      res.ok ? "success" : "error"
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-flat max-w-2xl space-y-5 p-6">
      <Field label="Full name">
        <input className="field" value={full_name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <Field label="Email" hint="Contact support to change your sign-in email.">
        <input className="field" value={initial.email} disabled />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone">
          <input
            className="field"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </Field>
        <Field label="Date of birth">
          <input className="field" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </Field>
      </div>

      <Field label="Gender">
        <select className="field" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      </Field>

      <div className="pt-1">
        <Button type="submit" loading={saving}>Save changes</Button>
      </div>
    </form>
  );
}
