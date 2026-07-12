"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { updateAppointmentStatus } from "@/lib/actions/data";

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

// STUN discovers each peer's public address; TURN relays media when a direct
// path can't be found (symmetric NAT / restrictive firewalls) — without a TURN
// server ~15-20% of real-world calls silently fail to connect. The relay
// credentials below are Open Relay's free public TURN service.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// Verbose WebRTC tracing is noisy in production; keep it behind an opt-in flag
// (set localStorage.rtcDebug = "1" to enable while debugging a call).
const RTC_DEBUG =
  typeof window !== "undefined" && window.localStorage?.getItem("rtcDebug") === "1";

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
  const remoteStream = useRef<MediaStream | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<"init" | "waiting" | "connecting" | "connected" | "ended">(
    "init"
  );
  const [remoteActive, setRemoteActive] = useState(false);
  const [remoteEnded, setRemoteEnded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [channelError, setChannelError] = useState(false);
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

    const tag = `[RTC ${me.role} ${clientId.slice(0, 6)}]`;
    const log = (...args: unknown[]) => RTC_DEBUG && console.log(tag, ...args);
    const warn = (...args: unknown[]) => RTC_DEBUG && console.warn(tag, ...args);
    log("room mount", { roomId, configured, me });

    function send(event: "signal" | "chat", payload: unknown) {
      const p = payload as { kind?: string };
      log("→ send", event, p?.kind ?? "");
      channelRef.current
        ?.send({ type: "broadcast", event, payload })
        .then((res) => log("  send ack", event, p?.kind ?? "", res))
        .catch((e) => warn("  send FAILED", event, e));
    }

    function newPeer() {
      log("creating RTCPeerConnection", ICE_SERVERS);
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const tracks = localStream.current?.getTracks() ?? [];
      if (tracks.length) {
        log("adding local tracks:", tracks.map((t) => `${t.kind}:${t.readyState}`));
        tracks.forEach((tr) => pc.addTrack(tr, localStream.current!));
      } else {
        // No local media (denied/unavailable): still add recv-only transceivers
        // so the offer has m-lines and ICE actually negotiates. Without this an
        // empty offer leaves the connection stuck in "connecting" forever.
        warn("no local media — adding recv-only audio/video transceivers");
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          log("← local ICE candidate", e.candidate.type, e.candidate.protocol, e.candidate.address ?? "");
          send("signal", { from: clientId, kind: "ice", candidate: e.candidate.toJSON() });
        } else {
          log("← local ICE gathering COMPLETE (null candidate)");
        }
      };
      pc.onicecandidateerror = (e) => {
        const ev = e as RTCPeerConnectionIceErrorEvent;
        warn("ICE candidate error", { url: ev.url, code: ev.errorCode, text: ev.errorText });
      };
      pc.onicegatheringstatechange = () => log("iceGatheringState:", pc.iceGatheringState);
      pc.onsignalingstatechange = () => log("signalingState:", pc.signalingState);
      pc.oniceconnectionstatechange = () => {
        log("iceConnectionState:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          warn("ICE FAILED — no working candidate pair. Likely NAT/firewall with no TURN server.");
        }
      };
      pc.ontrack = (e) => {
        log("● ontrack", e.track.kind, "readyState:", e.track.readyState, "streams:", e.streams.length);
        // Prefer the stream the sender associated with the track; if there is
        // none (some negotiation paths omit it), accumulate tracks into our own
        // MediaStream so both audio and video land on the same element.
        let stream = e.streams[0];
        if (!stream) {
          stream = remoteStream.current ?? new MediaStream();
          remoteStream.current = stream;
          if (!stream.getTracks().includes(e.track)) stream.addTrack(e.track);
          log("  no stream on track — wrapped into synthetic remote stream");
        } else {
          remoteStream.current = stream;
        }
        const el = remoteVideo.current;
        if (el && el.srcObject !== stream) {
          el.srcObject = stream;
          log("  attached remote stream to <video>");
        }
        // Autoplay of a stream that carries audio is often blocked until a user
        // gesture — call play() explicitly and surface any rejection.
        el?.play()
          .then(() => log("  remote <video> playing"))
          .catch((err) => warn("  remote <video> play() blocked:", (err as Error).name, "— will retry on click"));
        setRemoteActive(true);
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        log("connectionState:", s);
        if (s === "connected") setStatus("connected");
        else if (s === "failed" || s === "disconnected") setRemoteActive(false);
      };
      return pc;
    }

    async function flushIce() {
      const pc = pcRef.current;
      if (!pc) return;
      const buffered = pendingIce.current.splice(0);
      if (buffered.length) log("flushing", buffered.length, "buffered ICE candidates");
      for (const c of buffered) {
        try {
          await pc.addIceCandidate(c);
        } catch (e) {
          warn("addIceCandidate (buffered) failed", e);
        }
      }
    }

    async function makeOffer() {
      const pc = pcRef.current;
      if (!pc) return warn("makeOffer: no peer connection");
      if (pc.signalingState !== "stable") {
        log("makeOffer skipped, signalingState:", pc.signalingState);
        return;
      }
      log("makeOffer: creating offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      log("makeOffer: local description set, broadcasting offer");
      send("signal", { from: clientId, kind: "offer", sdp: offer });
    }

    async function onSignal(msg: Signal) {
      if (msg.from === clientId) return;
      const pc = pcRef.current;
      if (!pc) return warn("onSignal: no peer connection for", msg.kind);
      log("↓ recv signal", msg.kind, "from", msg.from.slice(0, 6));
      if (msg.kind === "offer") {
        log("  applying remote offer, signalingState:", pc.signalingState);
        await pc.setRemoteDescription(msg.sdp);
        await flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        log("  answer created + local set, broadcasting answer");
        send("signal", { from: clientId, kind: "answer", sdp: answer });
        setStatus("connecting");
      } else if (msg.kind === "answer") {
        if (!pc.currentRemoteDescription) {
          log("  applying remote answer");
          await pc.setRemoteDescription(msg.sdp);
        } else {
          log("  answer ignored (already have remote description)");
        }
        await flushIce();
      } else if (msg.kind === "ice") {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(msg.candidate);
            log("  added remote ICE candidate");
          } catch (e) {
            warn("  addIceCandidate failed", e);
          }
        } else {
          log("  buffering remote ICE candidate (no remote description yet)");
          pendingIce.current.push(msg.candidate);
        }
      }
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Acquire camera + mic, tolerant of the common real-world failures:
    //  • NotReadableError / AbortError ("Device in use") — another tab/app (or,
    //    in dev, React StrictMode's double-mount) holds the camera. Retry a few
    //    times; the other holder usually releases within a moment.
    //  • Video unavailable (no camera / constraints) — fall back to audio-only.
    //  • NotAllowedError — permission denied; give up (recv-only).
    async function acquireMedia(): Promise<MediaStream | null> {
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          log(`requesting camera + mic… (attempt ${attempt})`);
          return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (e) {
          const err = e as DOMException;
          warn(`getUserMedia failed (attempt ${attempt}):`, err.name, err.message);
          if (err.name === "NotAllowedError" || err.name === "SecurityError") {
            warn("permission denied / insecure context — giving up on local media");
            return null;
          }
          if (err.name === "NotReadableError" || err.name === "AbortError") {
            if (attempt < 4) {
              await sleep(500 * attempt); // camera busy — back off and retry
              continue;
            }
          }
          // Last resort: try audio-only (works even when the camera is taken).
          try {
            log("falling back to audio-only…");
            return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } catch (e2) {
            warn("audio-only also failed:", (e2 as DOMException).name);
            return null;
          }
        }
      }
      return null;
    }

    (async () => {
      // 1. Local media (fall back to chat-only if denied / unavailable).
      const stream = await acquireMedia();
      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }
      if (stream) {
        localStream.current = stream;
        log("got local media:", stream.getTracks().map((t) => `${t.kind}:${t.readyState}`));
        if (localVideo.current) localVideo.current.srcObject = stream;
      } else {
        warn("continuing without local media (recv-only) — you can still see/hear the other side");
        setMediaError(true);
      }
      if (cancelled) return;

      // 2. Peer connection.
      pcRef.current = newPeer();
      setStatus("waiting");

      // 3. Signaling channel (Supabase Realtime broadcast + presence).
      log("creating Supabase channel", `room:${roomId}`);
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
      // The other party hung up — tear down locally and reflect it in the UI.
      channel.on("broadcast", { event: "end" }, () => {
        log("↓ remote ended the call");
        setRemoteEnded(true);
        setRemoteActive(false);
        setStatus("ended");
      });
      channel.on("presence", { event: "sync" }, () => {
        const ids = Object.keys(channel.presenceState());
        const others = ids.filter((id) => id !== clientId);
        log("presence sync — peers in room:", ids.length, "others:", others.map((o) => o.slice(0, 6)));
        if (others.length === 0) {
          log("  alone in room, waiting for the other party");
          setStatus((s) => (s === "connected" ? "connected" : "waiting"));
          setRemoteActive(false);
          return;
        }
        // Deterministic single offerer: the greater clientId initiates. This
        // avoids offer glare entirely for a 1:1 room.
        const shouldOffer = others.every((id) => clientId > id);
        log("  other party present. I am the", shouldOffer ? "OFFERER" : "ANSWERER");
        if (shouldOffer) {
          setStatus("connecting");
          void makeOffer();
        } else {
          setStatus((s) => (s === "waiting" ? "connecting" : s));
        }
      });

      log("subscribing to channel…");
      await channel.subscribe(async (s, err) => {
        log("channel status:", s, err ?? "");
        if (s === "SUBSCRIBED") {
          setChannelError(false);
          log("SUBSCRIBED — tracking presence");
          await channel.track({ clientId, role: me.role, name: me.name });
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          // Surface a genuine failure instead of sitting silently on "waiting" —
          // the room can never connect if the signaling channel didn't come up.
          // (CLOSED is intentionally excluded: it also fires on normal unmount /
          // React StrictMode teardown, which is not an error.)
          console.error(`${tag} realtime channel ${s}`, err);
          setChannelError(true);
        }
      });
    })();

    return () => {
      log("room unmount — tearing down peer + channel");
      cancelled = true;
      pcRef.current?.close();
      pcRef.current = null;
      localStream.current?.getTracks().forEach((t) => t.stop());
      localStream.current = null;
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      remoteStream.current = null;
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
    // Let the other party know so their screen doesn't sit on "waiting".
    channelRef.current?.send({ type: "broadcast", event: "end", payload: { from: clientId } });
    pcRef.current?.close();
    localStream.current?.getTracks().forEach((t) => t.stop());
    setStatus("ended");
    // A finished consultation moves out of the active list into "Completed".
    // Fire-and-forget: it's a no-op in mock mode and must not block the exit.
    if (configured) void updateAppointmentStatus(roomId, "Completed");
    router.push(exitHref);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const statusLabel =
    status === "connected"
      ? `Live · ${mm}:${ss}`
      : channelError
      ? "Connection problem"
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
              onClick={() => remoteVideo.current?.play().catch(() => {})}
              className={`h-full w-full object-cover ${remoteActive ? "" : "hidden"}`}
            />
            {!remoteActive && (
              <div className="animate-[rise_0.4s_ease] text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white/5">
                  {remoteEnded ? (
                    <Icon name="phone-off" size={34} className="text-white/50" />
                  ) : (
                    <span className="h-3 w-3 animate-ping rounded-full bg-white/40" />
                  )}
                </div>
                <p className="mt-4 font-display text-2xl font-light capitalize">
                  {remoteEnded
                    ? "Call ended"
                    : channelError
                    ? "Can't reach the room"
                    : status === "connecting"
                    ? "Connecting…"
                    : `Waiting for the ${other}`}
                </p>
                <p className="text-sm text-white/50">
                  {remoteEnded
                    ? `The ${other} left the consultation. You can leave the room too.`
                    : channelError
                    ? "The live connection couldn't be established. Check your network and refresh to try again."
                    : configured
                    ? "The room is live — they'll appear here as soon as they join."
                    : "Live calls need the connected backend. Chat works locally."}
                </p>
                {remoteEnded && (
                  <button
                    onClick={endCall}
                    className="mt-5 rounded-full bg-white/15 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
                  >
                    Leave room
                  </button>
                )}
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
              <Icon name={muted ? "mic-off" : "mic"} size={20} />
            </Ctrl>
            <Ctrl active={!camOff} onClick={toggleCam} label={camOff ? "Turn camera on" : "Turn camera off"}>
              <Icon name={camOff ? "video-off" : "video"} size={20} />
            </Ctrl>
            <button
              onClick={endCall}
              className="flex h-12 items-center gap-2 rounded-full bg-warning px-6 font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Icon name="phone-off" size={18} /> End call
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
            <button
              type="submit"
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ps text-white transition-transform hover:scale-105 active:scale-95"
            >
              <Icon name="send" size={16} />
            </button>
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
