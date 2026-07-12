"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { updateAppointmentStatus } from "@/lib/actions/data";
import { getIceServers, fetchIceServers } from "@/lib/webrtc/ice";

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

// Synchronous fallback (env-based). The live call prefers fresh, server-minted
// credentials fetched via fetchIceServers() just before the peer is created.
const ICE_SERVERS_FALLBACK = getIceServers();

// How long to wait for a peer connection to reach "connected" before declaring
// the attempt failed and offering a retry (instead of a hung "Connecting…").
const CONNECT_TIMEOUT_MS = 20_000;

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
  const isOffererRef = useRef(false);
  const reofferTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(ICE_SERVERS_FALLBACK);

  const [status, setStatus] = useState<
    "init" | "waiting" | "connecting" | "connected" | "ended" | "failed"
  >(configured ? "init" : "waiting");
  const [remoteActive, setRemoteActive] = useState(false);
  const [remoteEnded, setRemoteEnded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [mediaMsg, setMediaMsg] = useState("");
  const [channelError, setChannelError] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  // Bumping `retry` fully tears down and re-runs the connection effect.
  const [retry, setRetry] = useState(0);
  // Browsers often block remote audio until a user gesture — surface a tap target.
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const other = me.role === "patient" ? "doctor" : "patient";

  // Call timer, running once connected.
  useEffect(() => {
    if (status !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Watchdog: if we're actively negotiating but never reach "connected", stop
  // spinning on "Connecting…" and surface a retryable failure.
  useEffect(() => {
    if (status !== "connecting") return;
    const t = setTimeout(() => {
      setStatus((s) => (s === "connecting" ? "failed" : s));
    }, CONNECT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [chat]);

  // Remote <video> must be visible before play() or browsers drop/mute audio.
  // Retry whenever we get a stream or the element becomes active.
  useEffect(() => {
    if (!remoteActive) return;
    const el = remoteVideo.current;
    if (!el?.srcObject) return;
    el.play()
      .then(() => setNeedsAudioUnlock(false))
      .catch(() => setNeedsAudioUnlock(true));
  }, [remoteActive]);

  useEffect(() => {
    if (!configured) return;
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
      const iceServers = iceServersRef.current;
      log("creating RTCPeerConnection", iceServers);
      const pc = new RTCPeerConnection({ iceServers });
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
        const s = pc.iceConnectionState;
        log("iceConnectionState:", s);
        // iceConnectionState is the most reliable "we have media" signal across
        // browsers — connectionState sometimes lags or never flips to connected.
        if (s === "connected" || s === "completed") markConnected();
        else if (s === "failed") {
          warn("ICE FAILED — no working candidate pair; attempting ICE restart.");
          recover();
        }
      };
      pc.ontrack = (e) => {
        log("● ontrack", e.track.kind, "readyState:", e.track.readyState, "streams:", e.streams.length);
        // Always merge into one synthetic stream. Browsers often attach audio and
        // video to *different* MediaStream objects; replacing srcObject on each
        // ontrack drops the earlier track (silent remote / frozen video).
        const stream = remoteStream.current ?? new MediaStream();
        remoteStream.current = stream;
        if (!stream.getTracks().includes(e.track)) {
          stream.addTrack(e.track);
          log("  added", e.track.kind, "to merged remote stream");
        }
        setRemoteActive(true);
        const el = remoteVideo.current;
        if (el && el.srcObject !== stream) {
          el.srcObject = stream;
          log("  attached merged remote stream to <video>");
        }
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        log("connectionState:", s);
        if (s === "connected") markConnected();
        else if (s === "failed") {
          setRemoteActive(false);
          recover();
        } else if (s === "disconnected") {
          // Transient — often recovers on its own; only surface if it persists.
          setRemoteActive(false);
        }
      };
      return pc;
    }

    // We have a live media path. Lock in "connected" and stop retrying.
    function markConnected() {
      stopReoffer();
      setStatus("connected");
    }

    function stopReoffer() {
      if (reofferTimer.current) {
        clearInterval(reofferTimer.current);
        reofferTimer.current = null;
      }
    }

    // ICE failed: restart negotiation from the offerer with fresh candidates
    // (e.g. forcing the TURN relay path). Non-offerer just waits for the new
    // offer. If nothing recovers, the watchdog flips the UI to "failed".
    function recover() {
      const pc = pcRef.current;
      if (!pc || cancelled) return;
      // Skip if a (re)negotiation is already in flight — both connection and ICE
      // state handlers can report failure for the same event.
      if (pc.signalingState !== "stable") return;
      if (isOffererRef.current) {
        log("recover: restarting ICE + re-offering");
        void makeOffer(true);
      }
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

    async function makeOffer(iceRestart = false) {
      const pc = pcRef.current;
      if (!pc) return warn("makeOffer: no peer connection");
      // Only offer from a stable state, except an ICE-restart offer which is
      // allowed to renegotiate an already-connected/failed session.
      if (pc.signalingState !== "stable" && !iceRestart) {
        log("makeOffer skipped, signalingState:", pc.signalingState);
        return;
      }
      try {
        log("makeOffer: creating offer…", iceRestart ? "(iceRestart)" : "");
        const offer = await pc.createOffer(iceRestart ? { iceRestart: true } : undefined);
        if (cancelled) return;
        await pc.setLocalDescription(offer);
        log("makeOffer: local description set, broadcasting offer");
        send("signal", { from: clientId, kind: "offer", sdp: offer });
      } catch (e) {
        warn("makeOffer failed", e);
      }
    }

    // The first offer can be lost if it races the peer's subscribe. While we're
    // the offerer and not yet connected, nudge the negotiation periodically:
    //  • have-local-offer → re-broadcast the same offer (it may have been lost),
    //  • stable → the previous round didn't stick, so make a fresh offer.
    // The watchdog gives up after CONNECT_TIMEOUT_MS if nothing connects.
    function startReoffer() {
      stopReoffer();
      reofferTimer.current = setInterval(() => {
        const pc = pcRef.current;
        if (!pc || cancelled) return stopReoffer();
        if (
          pc.connectionState === "connected" ||
          pc.iceConnectionState === "connected" ||
          pc.iceConnectionState === "completed"
        ) {
          return stopReoffer();
        }
        if (pc.signalingState === "have-local-offer" && pc.localDescription) {
          log("re-offer tick: re-broadcasting pending offer");
          send("signal", { from: clientId, kind: "offer", sdp: pc.localDescription });
        } else if (pc.signalingState === "stable") {
          log("re-offer tick: fresh offer");
          void makeOffer();
        }
      }, 4000);
    }

    async function onSignal(msg: Signal) {
      if (msg.from === clientId) return;
      const pc = pcRef.current;
      if (!pc) return warn("onSignal: no peer connection for", msg.kind);
      log("↓ recv signal", msg.kind, "from", msg.from.slice(0, 6));
      try {
      if (msg.kind === "offer") {
        // Ignore a duplicate/renegotiation offer we can't cleanly apply (we only
        // answer from stable — an answerer never has its own offer pending).
        if (pc.signalingState !== "stable") {
          log("  offer ignored (signalingState:", pc.signalingState, ")");
          return;
        }
        log("  applying remote offer, signalingState:", pc.signalingState);
        await pc.setRemoteDescription(msg.sdp);
        await flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        log("  answer created + local set, broadcasting answer");
        send("signal", { from: clientId, kind: "answer", sdp: answer });
        setStatus((s) => (s === "connected" ? s : "connecting"));
      } else if (msg.kind === "answer") {
        // Apply an answer whenever we're waiting for one. Gating on
        // currentRemoteDescription would drop the answer to an ICE-restart
        // re-offer and leave the recovered call stuck.
        if (pc.signalingState === "have-local-offer") {
          log("  applying remote answer");
          await pc.setRemoteDescription(msg.sdp);
          await flushIce();
        } else {
          log("  answer ignored (signalingState:", pc.signalingState, ")");
        }
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
      } catch (e) {
        warn("onSignal error", msg.kind, e);
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
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaMsg(
          "This browser can't access the camera. Video calls need a secure (https) context."
        );
        return null;
      }
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          log(`requesting camera + mic… (attempt ${attempt})`);
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setMediaMsg("");
          return s;
        } catch (e) {
          const err = e as DOMException;
          warn(`getUserMedia failed (attempt ${attempt}):`, err.name, err.message);
          if (err.name === "NotAllowedError" || err.name === "SecurityError") {
            setMediaMsg(
              "Camera & microphone access was blocked. Allow it in your browser's address bar, then Retry."
            );
            return null;
          }
          if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
            // No camera at all — try mic-only before giving up.
            try {
              const a = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
              setMediaMsg("No camera found — joined with audio only.");
              return a;
            } catch {
              setMediaMsg("No camera or microphone was found on this device.");
              return null;
            }
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
            const a = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            setMediaMsg("Camera is in use by another app — joined with audio only.");
            return a;
          } catch (e2) {
            warn("audio-only also failed:", (e2 as DOMException).name);
            setMediaMsg("Couldn't access your camera or microphone. Close other apps and Retry.");
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
        if (localVideo.current) {
          localVideo.current.srcObject = stream;
          void localVideo.current.play().catch(() => {});
        }
      } else {
        warn("continuing without local media (recv-only) — you can still see/hear the other side");
        setMediaError(true);
      }
      if (cancelled) return;

      // 2. Peer connection — with fresh, server-minted ICE credentials (falls
      //    back to the static env config if the route is unavailable).
      iceServersRef.current = await fetchIceServers();
      if (cancelled) return;
      log("using ICE servers:", iceServersRef.current.length, "entries");
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
          stopReoffer();
          isOffererRef.current = false;
          setStatus((s) => (s === "connected" ? "connected" : "waiting"));
          setRemoteActive(false);
          return;
        }
        // Deterministic single offerer: the greater clientId initiates. This
        // avoids offer glare entirely for a 1:1 room.
        const shouldOffer = others.every((id) => clientId > id);
        isOffererRef.current = shouldOffer;
        log("  other party present. I am the", shouldOffer ? "OFFERER" : "ANSWERER");
        if (shouldOffer) {
          setStatus((s) => (s === "connected" ? s : "connecting"));
          void makeOffer();
          startReoffer(); // resilient to lost offers / slow TURN
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
      stopReoffer();
      isOffererRef.current = false;
      pcRef.current?.close();
      pcRef.current = null;
      localStream.current?.getTracks().forEach((t) => t.stop());
      localStream.current = null;
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      remoteStream.current = null;
      pendingIce.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, roomId, retry]);

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

  // Tear down and re-establish the whole connection from scratch (bumping
  // `retry` re-runs the connection effect). Used by the failure screen.
  function retryConnection() {
    setChannelError(false);
    setRemoteEnded(false);
    setRemoteActive(false);
    setMediaError(false);
    setNeedsAudioUnlock(false);
    setStatus(configured ? "init" : "waiting");
    setRetry((n) => n + 1);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const statusLabel =
    status === "connected"
      ? `Live · ${mm}:${ss}`
      : status === "failed" || channelError
      ? "Connection failed"
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
              onClick={() =>
                remoteVideo.current
                  ?.play()
                  .then(() => setNeedsAudioUnlock(false))
                  .catch(() => setNeedsAudioUnlock(true))
              }
              className={`h-full w-full object-cover ${remoteActive ? "" : "hidden"}`}
            />
            {remoteActive && needsAudioUnlock && (
              <button
                type="button"
                onClick={() =>
                  remoteVideo.current
                    ?.play()
                    .then(() => setNeedsAudioUnlock(false))
                    .catch(() => {})
                }
                className="absolute inset-x-4 bottom-4 rounded-xl bg-black/70 px-4 py-3 text-sm text-white backdrop-blur-sm"
              >
                Tap to enable audio
              </button>
            )}
            {!remoteActive && (() => {
              const failed = status === "failed" || channelError;
              const title = remoteEnded
                ? "Call ended"
                : failed
                ? "Couldn't connect the call"
                : status === "connecting"
                ? "Connecting…"
                : `Waiting for the ${other}`;
              const body = remoteEnded
                ? `The ${other} left the consultation. You can leave the room too.`
                : channelError
                ? "We couldn't reach the live signaling server. Check your internet connection and try again."
                : failed
                ? `We couldn't establish a live connection with the ${other}. This is usually a restrictive network or firewall. Try again, or switch to a different network.`
                : !configured
                ? "Live calls need the connected backend. Chat works locally."
                : status === "connecting"
                ? `Establishing a secure connection with the ${other}…`
                : "The room is live — they'll appear here as soon as they join.";
              return (
                <div className="animate-[rise_0.4s_ease] max-w-md px-6 text-center">
                  <div
                    className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full ${
                      failed ? "bg-warning/15" : "bg-white/5"
                    }`}
                  >
                    {remoteEnded ? (
                      <Icon name="phone-off" size={34} className="text-white/50" />
                    ) : failed ? (
                      <Icon name="phone-off" size={34} className="text-warning" />
                    ) : (
                      <span className="h-3 w-3 animate-ping rounded-full bg-white/40" />
                    )}
                  </div>
                  <p className="mt-4 font-display text-2xl font-light">{title}</p>
                  <p className="mt-1 text-sm text-white/50">{body}</p>
                  {mediaMsg && !remoteEnded && (
                    <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
                      {mediaMsg}
                    </p>
                  )}
                  {failed && !remoteEnded && (
                    <button
                      onClick={retryConnection}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-ps px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ps-pressed active:scale-95"
                    >
                      <Icon name="phone" size={16} /> Retry connection
                    </button>
                  )}
                  {remoteEnded && (
                    <button
                      onClick={endCall}
                      className="mt-5 rounded-full bg-white/15 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
                    >
                      Leave room
                    </button>
                  )}
                </div>
              );
            })()}

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
