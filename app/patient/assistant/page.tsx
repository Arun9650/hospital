"use client";

import Link from "next/link";
import { useState } from "react";
import { PatientShell } from "@/components/roleShells";
import { assistantSuggestions } from "@/lib/data";

type Msg = { from: "ai" | "me"; text: string; suggestDoctor?: boolean };

const greeting: Msg = {
  from: "ai",
  text:
    "Hi Alex, I'm your Aria health assistant. Tell me what you're feeling and I'll help you understand it and find the right specialist. I don't replace a doctor — I help you prepare for one.",
};

function reply(input: string): Msg {
  const t = input.toLowerCase();
  if (t.includes("headache"))
    return {
      from: "ai",
      text:
        "Evening headaches over a few days can have many causes — screen strain, dehydration, stress or sleep. Note any triggers, water intake and sleep. If they're severe, sudden, or come with vision changes, seek care promptly. A neurologist or general physician can help — would you like me to find one?",
      suggestDoctor: true,
    };
  if (t.includes("chest"))
    return {
      from: "ai",
      text:
        "Chest tightness should always be taken seriously. If it's severe, spreading to your arm or jaw, or with shortness of breath, treat it as an emergency now. For ongoing mild tightness, a cardiologist is the right specialist — shall I show you verified cardiologists?",
      suggestDoctor: true,
    };
  if (t.includes("blood pressure") || t.includes("bp"))
    return {
      from: "ai",
      text:
        "A normal reading is around 120/80 mmHg. Consistently above 130/80 may be elevated. Measure at rest, twice a day, and log it. A cardiologist or GP can review your trend and adjust care.",
      suggestDoctor: true,
    };
  if (t.includes("prepare") || t.includes("visit"))
    return {
      from: "ai",
      text:
        "Great idea. Before your visit: 1) list your symptoms with dates, 2) note current medicines & allergies, 3) write your top 3 questions, 4) have recent reports ready to share. I've added these as prep notes to your visit.",
    };
  return {
    from: "ai",
    text:
      "Thanks for sharing. Could you tell me a bit more — when it started, how strong it is, and anything that makes it better or worse? Based on that I can suggest the right kind of specialist.",
    suggestDoctor: true,
  };
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [input, setInput] = useState("");

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "me", text }]);
    setInput("");
    setTimeout(() => setMessages((m) => [...m, reply(text)]), 400);
  }

  return (
    <PatientShell>
      <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf3fc] text-xl">✨</span>
          <div>
            <h1 className="font-display text-2xl font-light tracking-tight">AI Health Assistant</h1>
            <p className="text-xs text-mute">Understand symptoms · prepare for visits · find specialists</p>
          </div>
        </div>

        <div className="card-flat flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={m.from === "me" ? "max-w-[85%]" : "max-w-[90%]"}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      m.from === "me"
                        ? "bg-ps text-white"
                        : "bg-surface-card text-charcoal"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.suggestDoctor && (
                    <Link
                      href="/patient/doctors"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-ps hover:underline"
                    >
                      Find a matching doctor →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-5 pb-2">
              {assistantSuggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="chip">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-[#f0f0f0] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe how you’re feeling…"
              className="min-w-0 flex-1 rounded-full bg-surface-card px-4 py-3 text-sm outline-none placeholder:text-mute"
            />
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-ps text-white">➤</button>
          </form>
        </div>
        <p className="mt-3 text-center text-xs text-mute">
          Aria’s assistant offers general guidance only and is not a medical diagnosis.
        </p>
      </div>
    </PatientShell>
  );
}
