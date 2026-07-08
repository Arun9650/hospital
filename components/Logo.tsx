import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-ps"
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z"
            fill="#fff"
          />
        </svg>
      </span>
      <span
        className={`font-display text-lg font-medium tracking-tight ${
          dark ? "text-white" : "text-black"
        }`}
      >
        Aria&nbsp;Health
      </span>
    </Link>
  );
}
