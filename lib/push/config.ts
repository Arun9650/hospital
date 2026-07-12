/* -------------------------------------------------------------------------
   Web Push (VAPID) configuration.

   Push is optional and off by default. It turns on only when VAPID keys are
   present in the environment:
     NEXT_PUBLIC_VAPID_PUBLIC_KEY  — exposed to the browser to subscribe.
     VAPID_PRIVATE_KEY             — server-only, signs the push requests.
     VAPID_SUBJECT                 — a mailto:/https: contact (optional).

   Generate a keypair once with:  npx web-push generate-vapid-keys
   ---------------------------------------------------------------------- */

/** The VAPID public key, safe to expose. Empty string when push isn't set up. */
export const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** True on the client when a public key exists (so the subscribe UI can show). */
export const isPushPublicConfigured = vapidPublicKey.length > 0;
