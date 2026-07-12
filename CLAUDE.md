# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Aria Health** — a telemedicine web app (marketing site + patient/doctor/admin portals) built with **Next.js 16 App Router · React 19 · Tailwind CSS v4 · Supabase**. Package manager is **pnpm**.

The whole app runs on built-in mock data with **no backend required**; connecting Supabase is optional and upgrades it to live data + auth + realtime. See `README.md` for the route map and `SUPABASE_SETUP.md` for backend wiring.

## Commands

```bash
pnpm install
pnpm dev      # dev server → http://localhost:3000
pnpm build    # production build
pnpm lint     # eslint (eslint-config-next)
```

There is no test suite. `pnpm build` (which type-checks) and `pnpm lint` are the verification gates.

## Core architecture

### The mock-data fallback contract (most important pattern)
The app is designed to always work whether or not Supabase is configured, and to never break the UI on a query error.

- `lib/supabase/config.ts` — reads env and exports `isSupabaseConfigured`. It's `true` only when both URL and key are present **and not placeholders** (values containing `your-`, `YOUR_`, `changeme` are treated as unset). It accepts either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/db.ts` — the **single read layer** for the whole app. Every reader follows the same shape: if `!isSupabaseConfigured` return mock; else `try` a Supabase query and **fall back to `lib/data.ts` mock data when the query errors OR returns empty**. Row mappers here convert snake_case DB columns → camelCase TS types. When adding a new read, keep this exact try/fallback shape.
- `lib/data.ts` — all mock/demo data + the TypeScript domain types (`Doctor`, `Appointment`, `Prescription`, `ChatThread`, etc.). These types are the source of truth consumed everywhere.
- `lib/actions/*.ts` — `"use server"` Server Actions for writes (auth, booking, prescriptions, chat). They **no-op gracefully** (`return { ok: true }`) when Supabase isn't configured; client UI updates optimistically for the demo.

Consequence: mock mode has no real user, so mock-mode readers ignore `userId`. Live readers scope by the signed-in user but also include seeded demo rows (the demo patient is `"Alex Morgan"`, demo self-appointments use `patient_name = "You"`).

### Supabase client variants — pick the right one
- `lib/supabase/public.ts` `createPublicClient()` — cookie-free anon client for **public catalog reads** (doctors, specialties, reviews). Safe during static generation. Used by `lib/db.ts`.
- `lib/supabase/server.ts` `createServerSupabase()` — **auth-aware** client for Server Components / Route Handlers / Server Actions; reads/writes the session cookie so RLS runs as the signed-in user. Used by `lib/auth.ts` and `lib/actions/*`.
- `lib/supabase/middleware.ts` — client used only inside `middleware.ts` to refresh the session and gate routes.

### Auth & routing
- `middleware.ts` → `updateSession()` refreshes the auth token on every request and enforces access. `PUBLIC_PREFIXES` are open; `/patient`, `/doctor`, `/admin` are gated by sign-in **and role** (wrong role bounces to that user's own dashboard). `/consultation/*` is open to any signed-in user (patient or doctor share the room). Auth is a **no-op when Supabase isn't configured**.
- Role lives in Supabase `user_metadata.role` (`patient` | `doctor` | `admin`), set at sign-up. There is no separate roles table.
- `lib/auth.ts` `getSessionUser()` builds the `SessionUser` from `user_metadata`. The root layout (`app/layout.tsx`) fetches it once server-side and passes it into `components/SessionProvider.tsx`, so **client components read the user via `useSessionUser()` and never import server code**.
- A DB trigger (`handle_new_user`) creates the `profiles` row on sign-up. Doctor accounts additionally get a public `doctors` catalog row via `ensureDoctorRow()` in `lib/actions/auth.ts` (idempotent, called on sign-up and sign-in to backfill).

### Consultation room (WebRTC)
`components/ConsultationRoom.tsx` is a peer-to-peer video/audio/chat room. Signaling runs over a **Supabase Realtime broadcast channel** (`room:<appointmentId>`) using presence + broadcast events (`signal`, `chat`, `end`) — no dedicated signaling server. One appointment = one room id; `lib/actions/data.ts` deliberately dedupes bookings for the same patient/doctor/slot so both parties resolve to the same `/consultation/<id>` URL.

### UI & design system
- `components/ui.tsx` holds shared primitives (Button, Avatar, Badge, Section, Field, etc.); `components/` holds larger pieces (shells, cards, nav, tables). `app/globals.css` maps design tokens to component classes (`.btn`, `.card`, `.chip`, `.field`, canvas sections).
- The visual system is a strict **PlayStation-inspired** design adapted for healthcare, fully specified in `DESIGN-playstation.md` (alternating dark/light/blue full-bleed canvases, Roboto weight-300 display type, pill CTAs, 8px cards, minimal shadows; blue `#0070d1` reserved for primary actions only). Follow that doc when building UI.
- App Router pages live under `app/{admin,doctor,patient}/…`; interactive pages pair a server `page.tsx` with a `*Client.tsx` component.

## Supabase schema & realtime
SQL lives in `supabase/migrations/` (`0001_schema.sql`, `0002_chat.sql`) and `supabase/seed*.sql`; run them in order (see `SUPABASE_SETUP.md`). `0002_chat.sql` adds chat tables to the `supabase_realtime` publication — re-run it if realtime is reset. **Seed RLS policies are demo-permissive** (operational tables world-readable) so doctor/admin portals can read across users; replace with role-aware policies before any real deployment.

## Path alias
`@/*` maps to the repo root (`tsconfig.json`).
