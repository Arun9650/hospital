# Supabase setup

Aria Health works out of the box on **mock data** (`lib/data.ts`). Follow these
steps to connect a real Supabase backend. Until you do, no network calls are
made and every feature keeps working against the built-in demo data.

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Wait for it to provision, then open **Project Settings → API**.
3. Copy the **Project URL** and the **anon public** key.

## 2. Add your keys

Copy the example env file and paste your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

The app auto-detects real keys (placeholder values like `your-project-url` are
ignored) and flips from mock data to live Supabase.

### Optional: push notifications (VAPID)

Web Push (e.g. a doctor's phone buzzing when a patient books) is off until you
add a VAPID keypair. Generate one:

```bash
npx web-push generate-vapid-keys
```

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BON...          # exposed to the browser
VAPID_PRIVATE_KEY=xxxxxxxx                    # server-only, keep secret
VAPID_SUBJECT=mailto:you@yourdomain.com       # contact for push services (optional)
```

Push also needs the `push_subscriptions` table (migration `0005_push.sql`) and a
**production build served over HTTPS** — service workers and the Push API don't
run under `pnpm dev`. Without the keys the "Enable push notifications" button
simply hides and in-app notifications still work.

## 3. Create the schema

Open the **SQL Editor** in Supabase and run, in order:

1. `supabase/migrations/0001_schema.sql` — tables, the sign-up trigger, and RLS.
2. `supabase/migrations/0002_chat.sql` — chat tables, RLS, and realtime publication.
3. `supabase/migrations/0003_patients.sql` — the doctor's `patients` table and RLS.
4. `supabase/migrations/0004_notifications.sql` — timestamp so new notifications sort first.
5. `supabase/migrations/0005_push.sql` — `push_subscriptions` table for Web Push.
6. `supabase/migrations/0006_notifications_realtime.sql` — stream notifications live.
7. `supabase/migrations/0007_appointment_booking.sql` — atomic booking function + notification timestamps/relations.
8. `supabase/seed.sql` — demo specialties, doctors, reviews, appointments, etc.
9. `supabase/seed_chat.sql` — demo chat threads & messages.
10. `supabase/seed_patients.sql` — demo patient records for Dr. Anaya Rao's panel.

(Or, with the Supabase CLI: `supabase db push` then run the seed files.)

> **Realtime:** `0002_chat.sql` adds `chat_messages` / `chat_threads` and
> `0006_notifications_realtime.sql` adds `notifications` to the
> `supabase_realtime` publication, so new messages and notifications stream to open screens with no
> extra dashboard config. If you ever reset Realtime, re-run that migration.

## 4. Configure Auth

In **Authentication → Providers → Email**, enable Email. For the smoothest local
testing, turn **off** "Confirm email" (Authentication → Sign In / Providers) so
new sign-ups are logged in immediately. Re-enable it for production.

A database trigger (`handle_new_user`) automatically creates a `profiles` row on
sign up, reading `full_name`, `role`, `initials` and `avatar_color` from the
sign-up metadata the app sends.

## 5. Run

```bash
npm run dev
```

- **Register** a patient at `/register` or a doctor at `/doctor/register`.
- Booking an appointment (`/patient/book/[id]`) writes a real `appointments` row.
- Doctors issue prescriptions (`/doctor/prescriptions`) that persist.
- **Messages** (`/patient/messages`, `/doctor/messages`) persist to `chat_messages`
  and stream live — open the patient and doctor inboxes side by side (two browsers
  / an incognito window) and watch messages arrive in realtime.
- Admin pages (`/admin/*`) read live across all users.

## How the fallback works

- `lib/supabase/config.ts` exposes `isSupabaseConfigured`.
- `lib/db.ts` is the single data-access layer. Every read tries Supabase and
  **falls back to mock data** if Supabase is unconfigured *or a query throws* —
  so a misconfiguration never breaks the UI.
- Write actions (`lib/actions/*`) no-op gracefully when unconfigured; the client
  UI still updates optimistically for the demo.

## Security note

The seed RLS policies are **demo-permissive**: operational tables
(`appointments`, `prescriptions`, `medical_records`, `notifications`) are
world-readable so the doctor and admin portals can read across users without a
custom roles setup. Before production, replace these with role-aware policies
(e.g. patients read only their own rows; doctors read their patients'; admins via
a `service_role` backend). See the comments in `0001_schema.sql`.
