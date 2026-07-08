"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroSearch({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/patient/doctors${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className={`flex w-full items-center gap-2 rounded-full p-2 ${
        dark ? "bg-white" : "bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      }`}
    >
      <span className="pl-3 text-mute" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by symptom, specialty or doctor name"
        className="min-w-0 flex-1 bg-transparent px-1 text-[15px] text-black outline-none placeholder:text-mute"
      />
      <button type="submit" className="btn btn-primary btn-sm shrink-0">
        Search
      </button>
    </form>
  );
}
