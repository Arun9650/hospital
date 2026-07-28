"use client";

import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { updateDoctorProfile } from "@/lib/actions/profile";
import { specialties } from "@/lib/data";
import type { Profile } from "@/lib/auth";
import type { Doctor } from "@/lib/data";

const MODES: Doctor["modes"] = ["Video", "Audio", "Chat", "In-person"];

export function DoctorProfileForm({ profile, doctor }: { profile: Profile; doctor: Doctor }) {
  const { show } = useToast();
  const [full_name, setName] = useState(profile.full_name || doctor.name);
  const [phone, setPhone] = useState(profile.phone);
  const [dob, setDob] = useState(profile.dob);
  const [gender, setGender] = useState(profile.gender);
  const [specialty, setSpecialty] = useState(doctor.specialty);
  const [qualifications, setQualifications] = useState(doctor.qualifications);
  const [experience, setExperience] = useState(String(doctor.experience || ""));
  const [fee, setFee] = useState(String(doctor.fee || ""));
  const [location, setLocation] = useState(doctor.location);
  const [languages, setLanguages] = useState(doctor.languages.join(", "));
  const [modes, setModes] = useState<string[]>(doctor.modes);
  const [about, setAbout] = useState(doctor.about);
  const [tags, setTags] = useState(doctor.tags.join(", "));
  const [saving, setSaving] = useState(false);

  function toggleMode(m: string) {
    setModes((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateDoctorProfile({
      full_name,
      phone,
      dob,
      gender,
      specialty,
      qualifications,
      experience: Number(experience) || 0,
      fee: Number(fee) || 0,
      location,
      languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
      modes,
      about,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
    });
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
        <input className="field" value={profile.email} disabled />
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Specialty">
          <select className="field" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required>
            {/* Keep the current value selectable even if it isn't in the catalog list. */}
            {!specialties.some((s) => s.name === specialty) && specialty && (
              <option value={specialty}>{specialty}</option>
            )}
            {specialties.map((s) => (
              <option key={s.slug} value={s.name}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <input className="field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
        </Field>
      </div>

      <Field label="Qualifications" hint="e.g. MBBS, MD (Cardiology)">
        <input className="field" value={qualifications} onChange={(e) => setQualifications(e.target.value)} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Experience (years)">
          <input className="field" type="number" min={0} max={80} value={experience} onChange={(e) => setExperience(e.target.value)} />
        </Field>
        <Field label="Consultation fee">
          <input className="field" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />
        </Field>
      </div>

      <Field label="Languages" hint="Comma-separated, e.g. English, Hindi">
        <input className="field" value={languages} onChange={(e) => setLanguages(e.target.value)} />
      </Field>

      <Field label="Consultation modes">
        <div className="flex flex-wrap gap-4 pt-1">
          {MODES.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={modes.includes(m)} onChange={() => toggleMode(m)} />
              {m}
            </label>
          ))}
        </div>
      </Field>

      <Field label="About" hint="A short bio shown on your public profile.">
        <textarea className="field min-h-28" value={about} onChange={(e) => setAbout(e.target.value)} />
      </Field>

      <Field label="Tags" hint="Comma-separated focus areas, e.g. Diabetes, Hypertension">
        <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>

      <div className="pt-1">
        <Button type="submit" loading={saving}>Save changes</Button>
      </div>
    </form>
  );
}
