"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { sendChatMessage } from "@/lib/actions/data";
import { currentPatient, getDoctor } from "@/lib/data";
import type { ChatMessage, ChatThread } from "@/lib/data";

type Perspective = "patient" | "doctor";

/* Short clock label for realtime payloads (mirrors lib/db.shortTime). */
function clockLabel(ts?: string): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/* A canned doctor reply so the patient chat feels alive (demo only). */
function doctorReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("pain") || t.includes("chest") || t.includes("worse"))
    return "Thanks for letting me know. If it becomes severe, spreads to your arm or jaw, or comes with breathlessness, treat it as an emergency. Otherwise let's review it — can you note when it happens and how long it lasts?";
  if (t.includes("thank"))
    return "You're very welcome. Message me here any time — I usually reply within a few minutes during clinic hours.";
  if (t.includes("?"))
    return "Good question. Based on what you've shared I'd suggest we keep monitoring for now. I'll add a note to your record and we can revisit at your next slot.";
  return "Got it, thank you for the update. I've noted this in your record — keep me posted if anything changes and we'll adjust the plan together.";
}

function makeThreadForDoctor(doctorId: string): ChatThread | null {
  const doc = getDoctor(doctorId);
  if (!doc) return null;
  return {
    id: `new-${doctorId}`,
    doctorId: doc.id,
    doctorName: doc.name,
    doctorInitials: doc.initials,
    doctorColor: doc.photo,
    specialty: doc.specialty,
    patientName: currentPatient.name,
    patientInitials: currentPatient.initials,
    patientColor: currentPatient.color,
    online: true,
    lastActive: "now",
    unread: 0,
    messages: [
      {
        id: "greet",
        from: "doctor",
        text: `Hi ${currentPatient.name.split(" ")[0]}, thanks for reaching out. Tell me what's going on and I'll help — I usually reply within a few minutes.`,
        time: "Now",
      },
    ],
  };
}

export function ChatClient({
  threads: seed,
  perspective,
  initialDoctorId,
  configured = false,
}: {
  threads: ChatThread[];
  perspective: Perspective;
  initialDoctorId?: string;
  configured?: boolean;
}) {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    // Only synthesize a local thread in mock mode; when Supabase is configured
    // the server has already created/loaded the thread for the doctor param.
    if (
      !configured &&
      perspective === "patient" &&
      initialDoctorId &&
      !seed.some((t) => t.doctorId === initialDoctorId)
    ) {
      const fresh = makeThreadForDoctor(initialDoctorId);
      if (fresh) return [fresh, ...seed];
    }
    return seed;
  });

  const firstId =
    (initialDoctorId && threads.find((t) => t.doctorId === initialDoctorId)?.id) ||
    threads[0]?.id ||
    "";
  const [activeId, setActiveId] = useState(firstId);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const ownSide: "patient" | "doctor" = perspective;

  const active = useMemo(
    () => threads.find((t) => t.id === activeId),
    [threads, activeId]
  );

  // Keep the latest activeId reachable inside the realtime callback without
  // re-subscribing every time it changes.
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Realtime: append inserted messages that belong to a thread we're showing.
  useEffect(() => {
    if (!configured) return;
    const sb = createClient();
    const channel = sb
      .channel("chat_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as {
            id: string;
            thread_id: string;
            sender: "patient" | "doctor";
            body: string;
            created_at: string;
          };
          setThreads((ts) => {
            if (!ts.some((t) => t.id === row.thread_id)) return ts;
            return ts.map((t) => {
              if (t.id !== row.thread_id) return t;
              if (t.messages.some((m) => m.id === row.id)) return t; // dedupe echo
              const isMine = row.sender === ownSide;
              const isOpen = activeIdRef.current === t.id;
              return {
                ...t,
                messages: [
                  ...t.messages,
                  { id: row.id, from: row.sender, text: row.body, time: clockLabel(row.created_at) },
                ],
                lastActive: "just now",
                unread: isMine || isOpen ? t.unread : t.unread + 1,
              };
            });
          });
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [configured, ownSide]);

  function other(t: ChatThread) {
    return perspective === "patient"
      ? {
          name: t.doctorName,
          initials: t.doctorInitials,
          color: t.doctorColor,
          sub: t.specialty,
        }
      : {
          name: t.patientName,
          initials: t.patientInitials,
          color: t.patientColor,
          sub: "Patient",
        };
  }

  function openThread(id: string) {
    setActiveId(id);
    setMobileThreadOpen(true);
    setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
  }

  function appendMessage(threadId: string, msg: ChatMessage) {
    setThreads((ts) =>
      ts.map((t) =>
        t.id === threadId && !t.messages.some((m) => m.id === msg.id)
          ? { ...t, messages: [...t.messages, msg], lastActive: "just now" }
          : t
      )
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    const threadId = active.id;
    setDraft("");

    if (configured) {
      // Persist to Supabase; the realtime echo (deduped by id) confirms it.
      const res = await sendChatMessage({ threadId, sender: ownSide, body: text });
      if (res.ok && res.id) {
        appendMessage(threadId, { id: res.id, from: ownSide, text, time: res.time || clockLabel() });
      }
      return;
    }

    // Mock mode: optimistic append + a canned doctor auto-reply.
    appendMessage(threadId, { id: `s-${Date.now()}`, from: ownSide, text, time: clockLabel() });
    if (perspective === "patient") {
      setTimeout(() => {
        appendMessage(threadId, {
          id: `r-${Date.now()}`,
          from: "doctor",
          text: doctorReply(text),
          time: clockLabel(),
        });
      }, 900);
    }
  }

  return (
    <div className="card-flat flex min-h-0 flex-1 overflow-hidden">
      {/* Thread list */}
      <div
        className={`${mobileThreadOpen ? "hidden" : "flex"} w-full flex-col border-r border-[#f0f0f0] lg:flex lg:w-80`}
      >
        <div className="border-b border-[#f0f0f0] p-4">
          <h2 className="font-display text-lg font-normal tracking-tight">Messages</h2>
          <p className="text-xs text-mute">
            {perspective === "patient" ? "Chat with your doctors" : "Chat with your patients"}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {threads.map((t) => {
            const o = other(t);
            const last = t.messages[t.messages.length - 1];
            const isActive = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => openThread(t.id)}
                className={`flex w-full items-center gap-3 border-b border-[#f6f6f6] px-4 py-3 text-left transition-colors ${
                  isActive ? "bg-[#eaf3fc]" : "hover:bg-surface-soft"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar initials={o.initials} color={o.color} size={44} />
                  {t.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{o.name}</p>
                    <span className="shrink-0 text-[11px] text-mute">{t.lastActive}</span>
                  </div>
                  <p className="truncate text-xs text-mute">
                    {last ? `${last.from === ownSide ? "You: " : ""}${last.text}` : o.sub}
                  </p>
                </div>
                {t.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ps px-1.5 text-[11px] font-semibold text-white">
                    {t.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      {active ? (
        <div
          className={`${mobileThreadOpen ? "flex" : "hidden"} min-w-0 flex-1 flex-col lg:flex`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#f0f0f0] p-4">
            <button
              onClick={() => setMobileThreadOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-soft lg:hidden"
              aria-label="Back to conversations"
            >
              ←
            </button>
            <Avatar initials={other(active).initials} color={other(active).color} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{other(active).name}</p>
              <p className="text-xs text-mute">
                {active.online ? (
                  <span className="text-success">● Online</span>
                ) : (
                  `Active ${active.lastActive}`
                )}{" "}
                · {other(active).sub}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-soft p-4">
            {active.messages.map((m) => {
              const mine = m.from === ownSide;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        mine
                          ? "rounded-br-md bg-ps text-white"
                          : "rounded-bl-md bg-white text-charcoal shadow-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                    <p className={`mt-1 text-[11px] text-mute ${mine ? "text-right" : ""}`}>
                      {m.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-[#f0f0f0] p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${other(active).name.split(" ").slice(0, 2).join(" ")}…`}
              className="min-w-0 flex-1 rounded-full bg-surface-card px-4 py-3 text-sm outline-none placeholder:text-mute"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ps text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send message"
            >
              <Icon name="send" size={17} />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center text-sm text-mute lg:flex">
          Select a conversation to start chatting.
        </div>
      )}
    </div>
  );
}
