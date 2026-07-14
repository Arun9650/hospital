import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updatePassword } from "@/lib/actions/auth";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell>
      <p className="eyebrow text-ps">Almost done</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-body-light">Pick a strong password you don&apos;t use elsewhere.</p>

      {error ? (
        <p className="mt-4 rounded-lg bg-[#fbe7ea] px-4 py-3 text-sm text-warning">{error}</p>
      ) : null}

      <form action={updatePassword} className="mt-8 space-y-5">
        <Field label="New password" hint="At least 8 characters.">
          <input
            type="password"
            name="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="field"
            autoComplete="new-password"
          />
        </Field>
        <SubmitButton full>Update password</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-mute">
        <Link href="/login" className="font-medium text-ps hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
