"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui";
import { Logo } from "@/components/Logo";

const initialChat = [
  { from: "doctor", text: "Hi Alex, thanks for joining. How are you feeling today?" },
  { from: "me", text: "Hi doctor — a bit better, but the headaches are still there in the evenings." },
  { from: "doctor", text: "Understood. Let's talk through when they start and any triggers." },
];

export default function ConsultationScreen() {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [tab, setTab] = useState<"chat" | "notes">("chat");
  const [chat, setChat] = useState(initialChat);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    setChat((c) => [...c, { from: "me", text: msg }]);
    setMsg("");
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <Logo dark />
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#39d98a]" />
          Live · {mm}:{ss}
        </div>
        <Link href="/patient/dashboard" className="text-sm text-white/60 hover:text-white">
          Exit
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Video stage */}
        <div className="relative flex-1 p-4">
          <div className="relative flex h-full min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a2540] to-[#04101f]">
            <div className="text-center">
              <Avatar initials="AR" color="#0070d1" size={110} />
              <p className="mt-4 font-display text-2xl font-light">Dr. Anaya Rao</p>
              <p className="text-sm text-white/50">Cardiology · speaking…</p>
            </div>

            {/* Self view */}
            <div className="absolute bottom-4 right-4 flex h-28 w-40 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#111]">
              {camOff ? (
                <span className="text-xs text-white/50">Camera off</span>
              ) : (
                <Avatar initials="AM" color="#1f6f5c" size={54} />
              )}
              <span className="absolute bottom-1.5 left-2 text-[11px] text-white/70">You</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <Ctrl active={!muted} onClick={() => setMuted((m) => !m)} label={muted ? "Unmute" : "Mute"}>
              {muted ? "🔇" : "🎙️"}
            </Ctrl>
            <Ctrl active={!camOff} onClick={() => setCamOff((c) => !c)} label="Camera">
              {camOff ? "📷" : "🎥"}
            </Ctrl>
            <Ctrl active label="Share">🖥️</Ctrl>
            <Link
              href="/patient/prescriptions"
              className="flex h-12 items-center gap-2 rounded-full bg-warning px-6 font-semibold text-white"
            >
              ✕ End call
            </Link>
          </div>
        </div>

        {/* Side panel */}
        <aside className="flex w-full flex-col border-t border-white/10 bg-[#0d0d0f] lg:w-96 lg:border-l lg:border-t-0">
          <div className="flex border-b border-white/10">
            {(["chat", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium capitalize ${
                  tab === t ? "border-b-2 border-ps text-white" : "text-white/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "chat" ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chat.map((c, i) => (
                  <div key={i} className={`flex ${c.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        c.from === "me" ? "bg-ps text-white" : "bg-white/10 text-white/90"
                      }`}
                    >
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Type a message…"
                  className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
                />
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-ps">➤</button>
              </form>
            </>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Patient</p>
                <p className="mt-1">Alex Morgan · 34 · Female</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Reason</p>
                <p className="mt-1 text-white/80">Recurring evening headaches, 3 days.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Allergies</p>
                <p className="mt-1 text-white/80">Penicillin</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Shared files</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">📄 Lipid Profile.pdf</div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">🖼️ Symptom photo.jpg</div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Ctrl({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${
        active ? "bg-white/15 hover:bg-white/25" : "bg-warning/90"
      }`}
    >
      {children}
    </button>
  );
}
