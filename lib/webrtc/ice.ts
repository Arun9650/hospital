/* -------------------------------------------------------------------------
   ICE (STUN/TURN) configuration for the native-WebRTC consultation room.

   No third-party *video* service is involved anywhere — media is peer-to-peer
   via the browser's own RTCPeerConnection, and signaling runs over our own
   Supabase Realtime channel. STUN/TURN are pure NAT-traversal infrastructure:

     • STUN lets each peer discover its public address. It carries no media and
       is required for the ~most calls where the two peers aren't on the same
       LAN. Defaults to Google's public STUN (free, ubiquitous). Override with
       your own, or disable entirely, via env.

     • TURN relays media only when a direct path is impossible (symmetric NAT /
       corporate firewalls). We ship NO public TURN default — run your own
       (coturn is a few lines of config) and point the env vars at it. This
       keeps the relay path fully under your control.

   Env (all optional, all client-safe NEXT_PUBLIC_*):
     NEXT_PUBLIC_STUN_URL           comma-separated stun: urls (overrides default)
     NEXT_PUBLIC_DISABLE_PUBLIC_STUN "1" to omit the default public STUN
     NEXT_PUBLIC_TURN_URL           comma-separated turn:/turns: urls (self-hosted)
     NEXT_PUBLIC_TURN_USERNAME      TURN credential username
     NEXT_PUBLIC_TURN_CREDENTIAL    TURN credential password
   ---------------------------------------------------------------------- */

const DEFAULT_STUN = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

function splitUrls(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [];

  // STUN — your own if provided, else the public default (unless disabled).
  const stunEnv = process.env.NEXT_PUBLIC_STUN_URL ?? "";
  const stunUrls = stunEnv
    ? splitUrls(stunEnv)
    : process.env.NEXT_PUBLIC_DISABLE_PUBLIC_STUN === "1"
    ? []
    : DEFAULT_STUN;
  if (stunUrls.length) servers.push({ urls: stunUrls });

  // TURN — self-hosted only. Requires all three env vars to be meaningful.
  const turnEnv = process.env.NEXT_PUBLIC_TURN_URL ?? "";
  if (turnEnv) {
    servers.push({
      urls: splitUrls(turnEnv),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "",
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "",
    });
  }

  return servers;
}

/** True when a TURN relay is configured — used to decide whether to warn that
    calls across restrictive networks may fail without one. */
export const hasTurnConfigured = Boolean(process.env.NEXT_PUBLIC_TURN_URL);
