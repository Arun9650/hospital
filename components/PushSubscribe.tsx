"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { vapidPublicKey } from "@/lib/push/config";
import { savePushSubscription, deletePushSubscription } from "@/lib/actions/push";

/* VAPID public keys are base64url; the PushManager wants a Uint8Array. */
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "loading" | "unsupported" | "unconfigured" | "default" | "granted" | "denied";

/**
 * Opt-in control for Web Push. Lets a doctor turn on device notifications so a
 * new booking reaches their phone even when the app is closed. Renders nothing
 * distracting when push isn't available (unsupported browser or no VAPID key).
 */
export function PushSubscribe() {
  const { show } = useToast();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function determine(): Promise<State> {
      if (!vapidPublicKey) return "unconfigured";
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        return "unsupported";
      }
      if (Notification.permission === "denied") return "denied";
      // Reflect whether this device is already subscribed.
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        return sub ? "granted" : "default";
      } catch {
        return "default";
      }
    }

    determine().then((s) => {
      if (active) setState(s);
    });
    return () => {
      active = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default");
        show("Notifications weren't enabled.", "info");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      const json = sub.toJSON();
      const res = await savePushSubscription(
        {
          endpoint: json.endpoint ?? sub.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        },
        navigator.userAgent
      );
      if (!res.ok) throw new Error("save failed");
      setState("granted");
      show("Push notifications enabled on this device.", "success");
    } catch {
      show("Couldn't enable notifications. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("default");
      show("Push notifications turned off.", "info");
    } catch {
      show("Couldn't turn off notifications.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "unsupported" || state === "unconfigured") {
    // Silently hide when push can't run — nothing actionable for the user.
    return null;
  }

  if (state === "denied") {
    return (
      <span className="text-xs text-mute">
        Notifications are blocked in your browser settings.
      </span>
    );
  }

  if (state === "granted") {
    return (
      <Button variant="light" size="sm" loading={busy} onClick={disable}>
        🔔 Notifications on
      </Button>
    );
  }

  return (
    <Button size="sm" loading={busy} onClick={enable}>
      Enable push notifications
    </Button>
  );
}
