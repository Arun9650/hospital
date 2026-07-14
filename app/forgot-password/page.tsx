import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { requestPasswordReset } from "@/lib/actions/auth";

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <AuthShell>
      <p className="eyebrow text-ps">Account recovery</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight">Reset your password</h1>
      <p className="mt-2 text-body-light">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      {sent !== undefined ? (
        <p className="mt-4 rounded-lg bg-[#e5f5ee] px-4 py-3 text-sm text-success">
          If an account exists for <span className="font-medium">{sent}</span>, a reset link is on
          its way. Check your inbox.
        </p>
      ) : null}

      <form action={requestPasswordReset} className="mt-8 space-y-5">
        <Field label="Email address">
          <input type="email" name="email" required placeholder="you@email.com" className="field" />
        </Field>
        <SubmitButton full>Send reset link</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-mute">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ps hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
