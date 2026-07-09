import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field } from "@/components/ui";
import { signIn } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; check_email?: string }>;
}) {
  const { error, next, check_email } = await searchParams;
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
      {error && (
        <p className="mt-4 rounded-lg bg-[#fbe7ea] px-4 py-3 text-sm text-warning">{error}</p>
      )}

      <form action={signIn} className="mt-8 space-y-5">
        {next && <input type="hidden" name="next" value={next} />}
        <Field label="Email address">
          <input type="email" name="email" required placeholder="you@email.com" className="field" />
        </Field>
        <Field label="Password">
          <input type="password" name="password" required placeholder="••••••••" className="field" />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-charcoal">
            <input type="checkbox" className="h-4 w-4 accent-[#0070d1]" defaultChecked /> Remember me
          </label>
          <Link href="/login" className="text-ps hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" full>
          Log in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-mute">
        <span className="h-px flex-1 bg-[#eee]" /> or continue with <span className="h-px flex-1 bg-[#eee]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn btn-light">Google</button>
        <button className="btn btn-light">Apple</button>
      </div>

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
