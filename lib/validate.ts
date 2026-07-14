/* Minimal server-side input guards for write actions — trust-boundary
   validation without a schema dependency, since the fields here are few and
   simple. Each check returns an error message, or null when the value is valid;
   `firstError` returns the first failure. Reach for a schema lib (Zod) only if
   these grow complex or need to be shared with the client. */

export type Check = string | null;

export function required(v: string | undefined | null, label: string): Check {
  return v && v.trim() ? null : `${label} is required.`;
}

export function maxLen(v: string | undefined | null, n: number, label: string): Check {
  return (v ?? "").length <= n ? null : `${label} must be ${n} characters or fewer.`;
}

export function oneOf<T extends string>(v: string, opts: readonly T[], label: string): Check {
  return (opts as readonly string[]).includes(v) ? null : `${label} is invalid.`;
}

export function isEmail(v: string): Check {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v ?? "").trim()) ? null : "Enter a valid email address.";
}

export function minPassword(v: string): Check {
  return (v ?? "").length >= 8 ? null : "Password must be at least 8 characters.";
}

/** The first failing check, or null when all pass. */
export function firstError(...checks: Check[]): Check {
  return checks.find((c) => c !== null) ?? null;
}
