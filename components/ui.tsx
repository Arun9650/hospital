import Link from "next/link";
import { ReactNode } from "react";

/* -------------------------------------------------------------------------
   Small, reusable primitives shared across the whole product.
   ---------------------------------------------------------------------- */

export function Avatar({
  initials,
  color,
  size = 48,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(140deg, ${color}, ${shade(color, -22)})`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function shade(hex: string, percent: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (n & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function Stars({ value, dark = false }: { value: number; dark?: boolean }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} out of 5`}>
      <span className="text-[13px]" style={{ color: "#f5a623" }}>
        {"★".repeat(full)}
        <span style={{ color: dark ? "rgba(255,255,255,0.25)" : "#d8dde3" }}>
          {"★".repeat(5 - full)}
        </span>
      </span>
    </span>
  );
}

export function Badge({
  children,
  tone = "soft",
}: {
  children: ReactNode;
  tone?: "blue" | "soft" | "green" | "amber" | "red";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function VerifiedBadge() {
  return (
    <span className="badge badge-blue" title="Identity & license verified">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Verified
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "light" | "dark" | "ghost";
  size?: "md" | "sm";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  onClick,
  disabled,
  full,
}: ButtonProps) {
  const cls = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${
    full ? "w-full" : ""
  } ${className}`.trim();
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Eyebrow({
  children,
  className = "",
  tone = "blue",
}: {
  children: ReactNode;
  className?: string;
  tone?: "blue" | "mute" | "onDark";
}) {
  const color =
    tone === "blue" ? "text-ps" : tone === "onDark" ? "text-white/60" : "text-mute";
  return <p className={`eyebrow ${color} ${className}`}>{children}</p>;
}

export function Section({
  children,
  canvas = "light",
  className = "",
  id,
}: {
  children: ReactNode;
  canvas?: "light" | "dark" | "blue" | "soft";
  className?: string;
  id?: string;
}) {
  const bg =
    canvas === "dark"
      ? "bg-black text-white"
      : canvas === "blue"
      ? "bg-ps text-white"
      : canvas === "soft"
      ? "bg-surface-soft text-black"
      : "bg-white text-black";
  return (
    <section id={id} className={`section ${bg} ${className}`}>
      <div className="container-x">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  dark = false,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  dark?: boolean;
}) {
  return (
    <div>
      <div className="font-display text-4xl font-light tracking-tight">{value}</div>
      <div className={`mt-1 text-sm ${dark ? "text-white/60" : "text-mute"}`}>{label}</div>
      {sub && <div className="mt-0.5 text-xs text-success">{sub}</div>}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-charcoal">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export function IconDot({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf3fc] text-lg">
      {children}
    </span>
  );
}
