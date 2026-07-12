import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------
   Fresh ICE servers for a call, minted server-side.

   The browser calls GET /api/turn-credentials right before it creates the
   RTCPeerConnection. We fetch short-lived credentials from Metered using the
   secret METERED_API_KEY (server-only — never shipped to the client), so:
     • the Metered API key never leaves the server, and
     • no static TURN username/password is embedded in the client bundle where
       anyone could copy it and burn your relay bandwidth.

   Env (server-side, NOT NEXT_PUBLIC):
     METERED_API_KEY   your Metered API key (Dashboard → Developers)
     METERED_DOMAIN    your Metered app domain, e.g. doc-meet.metered.live

   Degrades gracefully: if the key/domain aren't set or Metered is unreachable,
   returns an empty list and the client falls back to its env-configured STUN.
   ---------------------------------------------------------------------- */

export const dynamic = "force-dynamic"; // never cache credentials
export const runtime = "nodejs";

type IceServer = { urls: string | string[]; username?: string; credential?: string };

export async function GET() {
  const apiKey = process.env.METERED_API_KEY;
  const domain = process.env.METERED_DOMAIN;

  if (!apiKey || !domain) {
    return NextResponse.json({ iceServers: [] as IceServer[] });
  }

  try {
    const res = await fetch(
      `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json({ iceServers: [] as IceServer[] }, { status: 200 });
    }
    // Metered responds with a bare array of RTCIceServer objects.
    const data = (await res.json()) as unknown;
    const iceServers = Array.isArray(data) ? (data as IceServer[]) : [];
    return NextResponse.json({ iceServers });
  } catch {
    return NextResponse.json({ iceServers: [] as IceServer[] }, { status: 200 });
  }
}
