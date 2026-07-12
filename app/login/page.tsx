import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field } from "@/components/ui";
import { signIn, resendConfirmation } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; check_email?: string; email?: string }>;
}) {
  const { error, next, check_email, email } = await searchParams;
  const unconfirmed = error === "unconfirmed";
  return (
    <AuthShell>
      <p className="eyebrow text-ps">Welcome back</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight">
        Log in to Aria Health
      </h1>
      <p className="mt-2 text-body-light">
        Continue where you left off — your care, records and doctors.
      </p>

      {check_email && (
        <p className="mt-4 rounded-lg bg-[#e5f5ee] px-4 py-3 text-sm text-success">
          Almost there — we sent a confirmation link to{" "}
          <span className="font-medium">{check_email}</span>. Check your email to activate your
          account, then log in.
        </p>
      )}
      {unconfirmed ? (
        <div className="mt-4 rounded-lg bg-[#fdf1dc] px-4 py-3 text-sm text-[#8a5a00]">
          <p className="font-medium">Confirm your email to continue</p>
          <p className="mt-1">
            We sent a confirmation link{email ? <> to <span className="font-medium">{email}</span></> : null}.
            Click it, then log in.
          </p>
          <form action={resendConfirmation} className="mt-2">
            <input type="hidden" name="email" value={email ?? ""} />
            <button type="submit" className="font-medium text-ps hover:underline">
              Resend confirmation email
            </button>
          </form>
        </div>
      ) : error ? (
        <p className="mt-4 rounded-lg bg-[#fbe7ea] px-4 py-3 text-sm text-warning">{error}</p>
      ) : null}

      <form action={signIn} className="mt-8 space-y-5">
        {next && <input type="hidden" name="next" value={next} />}
        <Field label="Email address">
          <input
            type="email"
            name="email"
            required
            defaultValue={email ?? ""}
            placeholder="you@email.com"
            className="field"
          />
        </Field>
        <Field label="Password">
          <input type="password" name="password" required placeholder="••••••••" className="field" />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-charcoal">
            <input type="checkbox" className="h-4 w-4 accent-[#0070d1]" defaultChecked /> Remember me
          </label>
          <span className="text-mute">Forgot password? Contact support.</span>
        </div>
        <Button type="submit" full>
          Log in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-mute">
        New to Aria Health?{" "}
        <Link href="/register" className="font-medium text-ps hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-mute">
        Are you a doctor?{" "}
        <Link href="/doctor/register" className="text-ps hover:underline">
          Join the doctor portal
        </Link>
      </p>
    </AuthShell>
  );
}
