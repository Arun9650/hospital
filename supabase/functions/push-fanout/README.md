# push-fanout

Delivers each new `public.notifications` row to the target user's phones via the
**Expo Push service**. Every event that matters (booking, accept/decline, new
message, new prescription) already inserts a `notifications` row — on web via
`notify()` in `lib/actions/data.ts`, on mobile via the `create_notification`
RPC. This function is the single place native push is sent, so no per-action
wiring is needed.

- **Web browsers** → Web Push (VAPID), handled by `lib/push/send.ts`.
- **Phones** → this function → Expo.

Both transports share `public.push_subscriptions`: web rows carry the VAPID key
pair (`p256dh`/`auth`), Expo rows store the token in `endpoint` with those key
columns null. Each sender filters to its own rows, so one INSERT reaches both
with no double-send.

## Deploy

```bash
# 1. Run the migration that makes the key columns nullable:
#    supabase/migrations/0021_push_subscriptions_expo.sql

# 2. Deploy the function. --no-verify-jwt: the DB webhook calls it, not a user.
supabase functions deploy push-fanout --no-verify-jwt
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.
Set `EXPO_ACCESS_TOKEN` only if your Expo project enforces push security:
`supabase secrets set EXPO_ACCESS_TOKEN=...`

## Wire the trigger (Supabase dashboard)

**Database → Webhooks → Create** a webhook:

- Table: `public.notifications`
- Events: **Insert**
- Type: **Supabase Edge Function** → `push-fanout` (POST)

That's it — inserts now fan out to devices.

## Mobile app: register the token

The `@aria/mobile-backend` SDK exposes `push.registerPushToken` /
`push.unregisterPushToken`. Call it after the user grants permission. Requires
`expo-notifications` and `expo-device`.

```ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { push } from "@aria/mobile-backend";

// Show the banner even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Call once after sign-in. Returns the token so you can unregister on logout. */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null; // no push on simulators
  const existing = await Notifications.getPermissionsAsync();
  const status =
    existing.status === "granted"
      ? existing.status
      : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await push.registerPushToken(token, Platform.OS === "ios" ? "ios" : "android");
  return token;
}

// On logout: await push.unregisterPushToken(token)
```

### Deep-link on tap (route by kind)

```ts
Notifications.addNotificationResponseReceivedListener((response) => {
  const kind = response.notification.request.content.data?.kind;
  // patient/doctor stacks differ; map kind → screen:
  //   "appointment"  → Appointments
  //   "prescription" → Prescriptions
  //   "payment"      → Plan / Billing
  //   "system"       → Notifications center
  navigate(routeForKind(kind));
});
```

Payloads carry no PHI (generic title/body); details load behind auth once the
screen opens.
