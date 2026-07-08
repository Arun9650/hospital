"use client";

import { ReactNode, useState } from "react";

export function Tabs({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto border-b border-[#eee] no-scrollbar">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
              active === i ? "text-ps" : "text-mute hover:text-black"
            }`}
          >
            {t.label}
            {active === i && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ps" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs[active].content}</div>
    </div>
  );
}

export function Pills({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  multi?: boolean;
}) {
  function toggle(opt: string) {
    if (multi) {
      onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    } else {
      onChange(value.includes(opt) ? [] : [opt]);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => toggle(o)}
          className={`chip ${value.includes(o) ? "chip-active" : ""}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
