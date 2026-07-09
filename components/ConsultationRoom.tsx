"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Avatar } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

export type RoomUser = {
  role: "patient" | "doctor";
  name: string;
  initials: string;
  color: string;
};

type ChatLine = { id: string; from: "patient" | "doctor"; name: string; text: string; time: string };

type Signal =
  | { from: string; kind: "offer" | "answer"; sdp: RTCSessionDescriptionInit }
  | { from: string; kind: "ice"; candidate: RTCIceCandidateInit };

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

function clock() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ConsultationRoom({
  roomId,
  me,
  exitHref,
  configured,
}: {
  roomId: string;
  me: RoomUser;
  exitHref: string;
  configured: boolean;
}) {
  const router = useRouter();
  const clientId = useMemo(() => crypto.randomUUID(), []);

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<"init" | "waiting" | "connecting" | "connected" | "ended">(
    "init"
  );
  const [remoteActive, setRemoteActive] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");

  const other = me.role === "patient" ? "doctor" : "patient";

  // Call timer, running once connected.
  useEffect(() => {
    if (status !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [chat]);

  useEffect(() => {
    if (!configured) {
      setStatus("waiting");
      return;
    }
    let cancelled = false;

    function send(event: "signal" | "chat", payload: unknown) {
      channelRef.current?.send({ type: "broadcast", event, payload });
    }

    function newPeer() {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      localStream.current?.getTracks().forEach((tr) => pc.addTrack(tr, localStream.current!));
      pc.onicecandidate = (e) => {
        if (e.candidate) send("signal", { from: clientId, kind: "ice", candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        if (remoteVideo.current && e.streams[0]) remoteVideo.current.srcObject = e.streams[0];
        setRemoteActive(true);
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") setStatus("connected");
        else if (s === "failed" || s === "disconnected") setRemoteActive(false);
      };
      return pc;
    }

    async function flushIce() {
      const pc = pcRef.current;
      if (!pc) return;
      for (const c of pendingIce.current.splice(0)) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          /* ignore late/failed candidates */
        }
      }
    }

    async function makeOffer() {
      const pc = pcRef.current;
      if (!pc || pc.signalingState !== "stable") return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send("signal", { from: clientId, kind: "offer", sdp: offer });
    }

    async function onSignal(msg: Signal) {
      if (msg.from === clientId) return;
      const pc = pcRef.current;
      if (!pc) return;
      if (msg.kind === "offer") {
        await pc.setRemoteDescription(msg.sdp);
        await flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send("signal", { from: clientId, kind: "answer", sdp: answer });
        setStatus("connecting");
      } else if (msg.kind === "answer") {
        if (!pc.currentRemoteDescription) await pc.setRemoteDescription(msg.sdp);
        await flushIce();
      } else if (msg.kind === "ice") {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(msg.candidate);
          } catch {
            /* ignore */
          }
        } else {
          pendingIce.current.push(msg.candidate);
        }
      }
    }

    (async () => {
      // 1. Local media (fall back to chat-only if denied / unavailable).
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;
      } catch {
        setMediaError(true);
      }
      if (cancelled) return;

      // 2. Peer connection.
      pcRef.current = newPeer();
      setStatus("waiting");

      // 3. Signaling channel (Supabase Realtime broadcast + presence).
      const sb = createClient();
      const channel = sb.channel(`room:${roomId}`, {
        config: { broadcast: { self: false }, presence: { key: clientId } },
      });
      channelRef.current = channel;

      channel.on("broadcast", { event: "signal" }, ({ payload }) => onSignal(payload as Signal));
      channel.on("broadcast", { event: "chat" }, ({ payload }) => {
        const p = payload as ChatLine;
        setChat((c) => (c.some((m) => m.id === p.id) ? c : [...c, p]));
      });
      channel.on("presence", { event: "sync" }, () => {
        const ids = Object.keys(channel.presenceState());
        const others = ids.filter((id) => id !== clientId);
        if (others.length === 0) {
          setStatus((s) => (s === "connected" ? "connected" : "waiting"));
          setRemoteActive(false);
          return;
        }
        // Deterministic single offerer: the greater clientId initiates. This
        // avoids offer glare entirely for a 1:1 room.
        const shouldOffer = others.every((id) => clientId > id);
        if (shouldOffer) {
          setStatus("connecting");
          void makeOffer();
        } else {
          setStatus((s) => (s === "waiting" ? "connecting" : s));
        }
      });

      await channel.subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          await channel.track({ clientId, role: me.role, name: me.name });
        }
      });
    })();

    return () => {
      cancelled = true;
      pcRef.current?.close();
      pcRef.current = null;
      localStream.current?.getTracks().forEach((t) => t.stop());
      localStream.current = null;
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, roomId]);

  function toggleMute() {
    const on = !muted;
    setMuted(on);
    localStream.current?.getAudioTracks().forEach((t) => (t.enabled = !on));
  }
  function toggleCam() {
    const off = !camOff;
    setCamOff(off);
    localStream.current?.getVideoTracks().forEach((t) => (t.enabled = !off));
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const line: ChatLine = {
      id: `${clientId}-${Date.now()}`,
      from: me.role,
      name: me.name,
      text,
      time: clock(),
    };
    setChat((c) => [...c, line]);
    channelRef.current?.send({ type: "broadcast", event: "chat", payload: line });
    setDraft("");
  }

  function endCall() {
    pcRef.current?.close();
    localStream.current?.getTracks().forEach((t) => t.stop());
    setStatus("ended");
    router.push(exitHref);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const statusLabel =
    status === "connected"
      ? `Live · ${mm}:${ss}`
      : status === "connecting"
      ? "Connecting…"
      : !configured
      ? "Offline preview"
      : `Waiting for the ${other}…`;

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white lg:h-dvh">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <Logo dark />
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              status === "connected" ? "animate-pulse bg-[#39d98a]" : "bg-white/40"
            }`}
          />
          {statusLabel}
        </div>
        <button onClick={endCall} className="text-sm text-white/60 hover:text-white">
          Exit
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* Video stage */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a2540] to-[#04101f]">
            {/* Remote */}
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className={`h-full w-full object-cover ${remoteActive ? "" : "hidden"}`}
            />
            {!remoteActive && (
              <div className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white/5">
                  <span className="h-3 w-3 animate-ping rounded-full bg-white/40" />
                </div>
                <p className="mt-4 font-display text-2xl font-light capitalize">
                  {status === "connecting" ? "Connecting…" : `Waiting for the ${other}`}
                </p>
                <p className="text-sm text-white/50">
                  {configured
                    ? "The room is live — they'll appear here as soon as they join."
                    : "Live calls need the connected backend. Chat works locally."}
                </p>
              </div>
            )}

            {/* Self view */}
            <div className="absolute bottom-4 right-4 flex h-28 w-40 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#111]">
              <video
                ref={localVideo}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${camOff || mediaError ? "hidden" : ""}`}
              />
              {(camOff || mediaError) && (
                <Avatar initials={me.initials} color={me.color} size={54} />
              )}
              <span className="absolute bottom-1.5 left-2 text-[11px] text-white/70">You</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <Ctrl active={!muted} onClick={toggleMute} label={muted ? "Unmute" : "Mute"}>
              {muted ? "🔇" : "🎙️"}
            </Ctrl>
            <Ctrl active={!camOff} onClick={toggleCam} label={camOff ? "Camera on" : "Camera off"}>
              {camOff ? "📷" : "🎥"}
            </Ctrl>
            <button
              onClick={endCall}
              className="flex h-12 items-center gap-2 rounded-full bg-warning px-6 font-semibold text-white"
            >
              ✕ End call
            </button>
          </div>
        </div>

        {/* Chat */}
        <aside className="flex min-h-[44dvh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0f] lg:min-h-0 lg:w-96">
          <div className="border-b border-white/10 px-4 py-3 text-sm font-medium">Chat</div>
          <div ref={chatRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {chat.length === 0 && (
              <p className="text-center text-xs text-white/40">
                Messages sent here are shared with the {other} in real time.
              </p>
            )}
            {chat.map((c) => {
              const mine = c.from === me.role;
              return (
                <div key={c.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] break-words rounded-2xl px-4 py-2 text-sm ${
                      mine ? "bg-ps text-white" : "bg-white/10 text-white/90"
                    }`}
                  >
                    {!mine && <p className="mb-0.5 text-[11px] text-white/50">{c.name}</p>}
                    {c.text}
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={sendChat} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-ps">➤</button>
          </form>
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
