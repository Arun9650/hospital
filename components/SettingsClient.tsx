"use client";

import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { PushSubscribe } from "@/components/PushSubscribe";
import { changePassword } from "@/lib/actions/profile";

export function SettingsClient() {
  const { show } = useToast();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== confirm) {
      show("Passwords don't match.", "error");
      return;
    }
    setSaving(true);
    const res = await changePassword(pw);
    setSaving(false);
    if (res.ok) {
      setPw("");
      setConfirm("");
      show("Password updated.", "success");
    } else {
      show(res.error ?? "Couldn't update your password.", "error");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <section className="card-flat p-6">
        <h2 className="font-display text-lg font-normal tracking-tight">Notifications</h2>
        <p className="mt-1 text-sm text-mute">
          Get alerted on this device when something needs your attention.
        </p>
        <div className="mt-4">
          <PushSubscribe />
        </div>
      </section>

      <form onSubmit={onSubmit} className="card-flat space-y-5 p-6">
        <div>
          <h2 className="font-display text-lg font-normal tracking-tight">Change password</h2>
          <p className="mt-1 text-sm text-mute">Use at least 8 characters.</p>
        </div>
        <Field label="New password">
          <input
            className="field"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            className="field"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </Field>
        <div>
          <Button type="submit" loading={saving}>Update password</Button>
        </div>
      </form>
    </div>
  );
}
