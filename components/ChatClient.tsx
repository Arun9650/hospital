"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { loadOlderChatMessages, markThreadRead, sendChatMessage } from "@/lib/actions/data";
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
  const [query, setQuery] = useState("");
  // Which threads currently show a "typing…" indicator for the OTHER party.
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [loadingOlder, setLoadingOlder] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTypingSent = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // When set, the next scroll effect restores position after prepending older
  // messages (instead of jumping to the bottom).
  const pendingPrepend = useRef<{ prevHeight: number } | null>(null);

  const ownSide: "patient" | "doctor" = perspective;

  // Doctor canned instructions — one tap fills the composer, ready to edit/send.
  const quickReplies = [
    "Thanks for the update — I've noted this in your record.",
    "Please continue the current medication and keep monitoring.",
    "Let's book a follow-up so we can review this properly.",
    "If symptoms worsen suddenly, please seek urgent care.",
  ];

  // Mark the other party as typing in a thread, auto-clearing after a beat.
  function showTyping(threadId: string, ms = 2200) {
    setTyping((t) => (t[threadId] ? t : { ...t, [threadId]: true }));
    clearTimeout(typingTimers.current[threadId]);
    typingTimers.current[threadId] = setTimeout(
      () => setTyping((t) => ({ ...t, [threadId]: false })),
      ms
    );
  }

  // Throttled broadcast that we're typing, so the other client can show it.
  function notifyTyping(threadId: string) {
    if (!configured) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 1200) return;
    lastTypingSent.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { threadId, sender: ownSide },
    });
  }

  // Persist that we've read the other party's messages in a thread, and tell
  // the other client so it can flip its sent messages to "read" ticks live.
  function markRead(threadId: string) {
    if (!configured) return;
    markThreadRead(threadId, ownSide);
    channelRef.current?.send({
      type: "broadcast",
      event: "read",
      payload: { threadId, reader: ownSide },
    });
  }

  // The other party read our messages → stamp our sent messages in that thread.
  function applyRead(threadId: string) {
    const now = new Date().toISOString();
    setThreads((ts) =>
      ts.map((t) =>
        t.id !== threadId
          ? t
          : {
              ...t,
              messages: t.messages.map((m) =>
                m.from === ownSide && !m.readAt ? { ...m, readAt: now } : m
              ),
            }
      )
    );
  }

  useEffect(() => () => {
    Object.values(typingTimers.current).forEach(clearTimeout);
  }, []);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId),
    [threads, activeId]
  );

  // Client-side conversation search over the loaded threads.
  const visibleThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const name = perspective === "patient" ? t.doctorName : t.patientName;
      const last = t.messages[t.messages.length - 1]?.text ?? "";
      return name.toLowerCase().includes(q) || last.toLowerCase().includes(q);
    });
  }, [threads, query, perspective]);

  // Keep the latest activeId reachable inside the realtime callback without
  // re-subscribing every time it changes.
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Realtime: append inserted messages that belong to a thread we're showing.
  // The Supabase client is imported lazily (inside the effect) so its ~240KB
  // stays off the initial hydration path — the chat UI paints and the composer
  // stays usable while the realtime library loads in the background.
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    let sb: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;

    import("@/lib/supabase/client").then(({ createClient }) => {
      if (cancelled) return;
      sb = createClient();
      channel = sb
        .channel("chat_messages")
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          const p = payload as { threadId: string; sender: Perspective };
          if (p.sender === ownSide) return; // ignore our own echo
          showTyping(p.threadId);
        })
        .on("broadcast", { event: "read" }, ({ payload }) => {
          const p = payload as { threadId: string; reader: Perspective };
          if (p.reader === ownSide) return; // our own read — nothing to update
          applyRead(p.threadId); // they read our messages
        })
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
                    {
                      id: row.id,
                      from: row.sender,
                      text: row.body,
                      time: clockLabel(row.created_at),
                      createdAt: row.created_at,
                      readAt: null,
                    },
                  ],
                  lastActive: "just now",
                  unread: isMine || isOpen ? t.unread : t.unread + 1,
                };
              });
            });
            if (row.sender !== ownSide) {
              setTyping((t) => ({ ...t, [row.thread_id]: false }));
              // If their message landed in the thread we're viewing, it's read now.
              if (activeIdRef.current === row.thread_id) markRead(row.thread_id);
            }
          }
        )
        .subscribe();
      channelRef.current = channel;
    });

    return () => {
      cancelled = true;
      channelRef.current = null;
      if (sb && channel) sb.removeChannel(channel);
    };
    // markRead/applyRead read refs + stable setters; re-subscribing per render
    // would tear down the channel needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, ownSide]);

  // Auto-scroll the conversation to the newest message on send/receive and when
  // switching threads. After prepending older messages, restore the prior
  // position instead so the view stays put.
  useEffect(() => {
    const el = listRef.current;
    if (pendingPrepend.current && el) {
      el.scrollTop = el.scrollHeight - pendingPrepend.current.prevHeight;
      pendingPrepend.current = null;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeId, active?.messages.length]);

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
    markRead(id);
  }

  // Mark the initially-open thread read once (e.g. arriving via ?doctor=…).
  useEffect(() => {
    if (activeId) markRead(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the previous page of messages for the active thread (infinite scroll-up
  // via a button). Preserves scroll position so the view doesn't jump.
  async function loadOlder() {
    if (!configured || !active || loadingOlder) return;
    const oldest = active.messages[0];
    if (!oldest?.createdAt) return;
    setLoadingOlder(true);
    const older = await loadOlderChatMessages(active.id, oldest.createdAt);
    const known = new Set(active.messages.map((m) => m.id));
    const fresh = older.filter((m) => !known.has(m.id));
    // Only arm scroll-restore when we actually prepend (so the effect fires).
    if (fresh.length && listRef.current)
      pendingPrepend.current = { prevHeight: listRef.current.scrollHeight };
    setThreads((ts) =>
      ts.map((t) =>
        t.id !== active.id
          ? t
          : {
              ...t,
              messages: [...fresh, ...t.messages],
              hasMoreMessages: older.length >= 50,
            }
      )
    );
    setLoadingOlder(false);
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
        appendMessage(threadId, {
          id: res.id,
          from: ownSide,
          text,
          time: res.time || clockLabel(),
          createdAt: res.createdAt || new Date().toISOString(),
          readAt: null,
        });
      }
      return;
    }

    // Mock mode: optimistic append + a canned doctor auto-reply, with a brief
    // "typing…" indicator in between so the demo feels live.
    appendMessage(threadId, { id: `s-${Date.now()}`, from: ownSide, text, time: clockLabel() });
    if (perspective === "patient") {
      showTyping(threadId, 1200);
      setTimeout(() => {
        appendMessage(threadId, {
          id: `r-${Date.now()}`,
          from: "doctor",
          text: doctorReply(text),
          time: clockLabel(),
        });
        setTyping((t) => ({ ...t, [threadId]: false }));
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
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="mt-3 w-full rounded-full bg-surface-card px-3.5 py-2 text-xs outline-none placeholder:text-mute"
            aria-label="Search conversations"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {visibleThreads.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-mute">No conversations match “{query}”.</p>
          )}
          {visibleThreads.map((t) => {
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
                {typing[active.id] ? (
                  <span className="text-ps">typing…</span>
                ) : active.online ? (
                  <span className="text-success">● Online</span>
                ) : (
                  `Active ${active.lastActive}`
                )}{" "}
                · {other(active).sub}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-soft p-4">
            {active.hasMoreMessages && (
              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="chip disabled:opacity-50"
                >
                  {loadingOlder ? "Loading…" : "Load earlier messages"}
                </button>
              </div>
            )}
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
                    <p
                      className={`mt-1 flex items-center gap-1 text-[11px] text-mute ${
                        mine ? "justify-end" : ""
                      }`}
                    >
                      {m.time}
                      {mine && configured && (
                        <Icon
                          name={m.readAt ? "check-double" : "check"}
                          size={13}
                          className={m.readAt ? "text-ps" : "text-mute"}
                          aria-label={m.readAt ? "Read" : "Sent"}
                        />
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Doctor quick-reply templates — one tap fills the composer. */}
          {perspective === "doctor" && (
            <div className="flex gap-2 overflow-x-auto border-t border-[#f0f0f0] px-3 pt-2 no-scrollbar">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDraft(q)}
                  className="chip shrink-0 whitespace-nowrap"
                >
                  {q.length > 30 ? q.slice(0, 30) + "…" : q}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-[#f0f0f0] p-3">
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                notifyTyping(active.id);
              }}
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
