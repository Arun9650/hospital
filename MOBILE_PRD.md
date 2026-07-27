# Sehat — Mobile App PRD

**Product:** Sehat (Aria Health's patient + doctor mobile app)
**Platform:** React Native / Expo (iOS + Android), one codebase
**Backend:** the existing Supabase project, consumed via `@aria/mobile-backend` (see `mobile-backend/`)
**Design system:** Organic (see `DESIGN-organic.md`)
**Status:** Draft v0.1 · Owner: Product · Last updated: 2026-07-22

> Naming note: "Sehat" is the mobile brand for the same Aria Health telemedicine
> product that runs on web. Same Supabase data, same users, same RLS. This PRD
> covers only what mobile adds or changes — it does not restate the web app.

---

## 1. Summary

Sehat puts the Aria Health telemedicine experience in the patient's and doctor's
pocket: find a doctor, book, consult by video/audio/chat, get a prescription, and
keep records — all native, all real-time. The backend already exists and is
mobile-ready (Postgres + RLS + Auth + Realtime + Storage). Mobile's job is a fast,
trustworthy native client plus the handful of capabilities only a phone has:
push, camera, biometric unlock, and offline resilience.

## 2. Goals & non-goals

**Goals**
- G1 — Ship a single Expo app serving both **patient** and **doctor** roles, gated by `user_metadata.role` exactly as web is.
- G2 — Reach feature parity with the web patient/doctor portals for the core loop: discover → book → consult → prescribe → record.
- G3 — Native push notifications (appointment requests, confirmations, new messages, prescriptions) via FCM/APNs.
- G4 — Reliable in-app video/audio/chat consultations on mobile networks.
- G5 — Feel calm and trustworthy — the Organic design system, not a ported web UI.

**Non-goals (v1)**
- Admin portal on mobile (admins stay on web).
- Real payments / insurance claims (booking remains mock-pay; `setPlan` flips a flag). Payment rails are a fast-follow.
- Tablet-optimized or landscape layouts (phone-portrait first).
- New clinical data the web app doesn't already model (e.g. structured vitals).

## 3. Personas

- **Patient (primary)** — books consultations, messages doctors, uploads reports, views prescriptions. Wants speed, clarity, and to trust that their health data is private.
- **Doctor (primary)** — reviews requests, runs consults, issues prescriptions, manages availability and earnings. On the move; needs fast triage and reliable calls.
- **Admin (out of scope for mobile)** — continues on web.

## 4. Platform & architecture

- **Client:** Expo (React Native), TypeScript. Navigation via a role-aware root that mirrors web's middleware role-gate (patient → patient stack, doctor → doctor stack).
- **Data/auth:** `@aria/mobile-backend` — the typed SDK that talks to Supabase directly. Session persisted with `AsyncStorage`; RLS enforces every permission. No new server.
- **Realtime:** Supabase Realtime — `onNewNotification`, `onThreadMessages`, and the per-appointment broadcast room (`room:<id>`) for WebRTC signaling.
- **Calls:** `react-native-webrtc` on top of the SDK's signaling channel. STUN/TURN via the existing provider (Metered). No third-party calling SDK. (See memory: native WebRTC only.)
- **Server-side additions (small, out-of-client):** one Supabase Edge Function to fan a new `notifications` row out to FCM/APNs (device push needs secret keys). Optionally an Edge Function for payments later.

## 5. Feature requirements

### 5.1 Auth & onboarding
- Email/password sign-in and sign-up for patient and doctor (`auth.signUpPatient` / `signUpDoctor`), matching web metadata so the `handle_new_user` trigger builds the same profile; doctor sign-up backfills the catalog row.
- Email-confirmation handling: if `needsEmailConfirm`, show a "check your inbox" state with resend (`auth.resendConfirmation`).
- Forgot/reset password (`requestPasswordReset`, deep link back into the app).
- **Biometric unlock** (Face ID / fingerprint) to re-open an existing session — local device gate, not a new auth factor.
- Session survives app restart (persisted); auto-refresh via `onAuthChange`.

### 5.2 Patient — discover & book
- Browse specialties and doctors; server-side search with filters (specialty, mode, max fee, min rating, sort) via `catalog.searchDoctors` — paginated, injection-guarded.
- Doctor profile: about, qualifications, reviews, availability, fee, modes.
- **Book:** pick slot → `appointments.lockSlot` (5-min soft lock) → confirm → `bookAppointment` (atomic RPC, idempotent, rate-limited; surfaces "slot just taken" on 23505).
- **Consult Now:** `instantMatch` → open consultation room with the top-rated available doctor.
- Manage bookings: list (`getMyAppointments`), reschedule, cancel — each notifies the doctor.

### 5.3 Doctor — practice
- Incoming requests (`getDoctorAppointments`); accept / decline / complete (`updateAppointmentStatus`) → patient notified.
- Weekly availability editor (`saveAvailability`).
- Patient panel derived from appointments; per-patient uploaded records (`records.getPatientRecords`, RLS-scoped to their patients).
- Earnings summary (from completed appointments).

### 5.4 Shared — consultation room
- Video / audio / chat, one room per appointment; both parties resolve to the same `room:<appointmentId>`.
- In-call chat and file sharing (`chat.sendChatAttachment`).
- Doctor can issue a prescription mid-call (`prescriptions.issuePrescription` with `appointmentId`) and drop it into the chat.
- Graceful handling of network drops / backgrounding (renegotiate on resume; `end` broadcast on hangup).

### 5.5 Messaging
- Thread list per role (`chat.getChatThreads`), live via `onThreadMessages`.
- Send text + attachments; read receipts (`markThreadRead`); infinite scroll-up (`loadOlderChatMessages`).
- "Message doctor" from a profile creates/opens the thread (`getOrCreatePatientThread`).

### 5.6 Prescriptions & records
- Patient: view prescriptions (`getMyPrescriptions`); upload records from **camera or files** — RN turns the picked URI into a Blob, `records.uploadRecord` (15 MB cap, private bucket, signed-URL reads).
- View/download records via short-lived signed URLs.

### 5.7 Notifications
- In-app center (`getMyNotifications`, `markNotificationsRead`), live via `onNewNotification`.
- **Native push** for: new appointment request (doctor), confirm/decline (patient), new message, new prescription. Tapping a push deep-links to the relevant screen.

### 5.8 Profile & plan
- Edit profile (`updateProfile`); Aria Plus toggle (`setPlan`, flag-only until payments land).

## 6. Mobile-native requirements

| Capability | Requirement |
|---|---|
| Push | FCM (Android) + APNs (iOS); device token stored server-side; Edge Function fans `notifications` inserts to devices. Deep-link payloads. |
| Camera / files | Capture or pick a document/image for records and chat attachments; client-side size guard (15 MB). |
| Biometric | Face ID / fingerprint to unlock a persisted session. |
| Deep links | `sehat://` scheme + universal links for auth callbacks (reset/confirm) and notification taps. |
| Offline | Cached last-known lists (doctors, appointments, threads) render read-only offline; writes queue-or-fail with a clear banner. No optimistic financial actions offline. |
| Permissions | Just-in-time prompts for camera, mic, notifications — with plain-language rationale. |

## 7. Non-functional requirements

- **Privacy/security:** PHI protected by RLS (never trust the client); records/attachments in private buckets with signed URLs; biometric gate; no PHI in push payloads (title/body generic, details behind auth). Certificate handling per platform defaults.
- **Performance:** cold start < 3s on mid-range Android; doctor search results < 1s on 4G; call connect < 5s on a normal network.
- **Reliability:** every write path already fails safe (rate-limited, idempotent booking, fail-open locks). Calls survive brief network loss.
- **Accessibility:** WCAG AA — ≥44×44pt targets, dynamic type, VoiceOver/TalkBack labels, sufficient contrast (Organic palette is AA-checked).
- **Localization:** English v1; strings externalized for future Hindi/Urdu ("Sehat" implies a South-Asian market).

## 8. Analytics & success metrics

- **North star:** completed consultations / week.
- Funnel: search → profile view → slot lock → booking confirmed → consult joined → consult completed → prescription issued.
- Push opt-in rate; push → open rate. Call setup success rate and median connect time. Crash-free sessions > 99.5%.

## 9. Milestones

1. **M1 — Foundation:** Expo shell, `@aria/mobile-backend` wired, auth + role routing, session persistence.
2. **M2 — Patient core:** discover, book (lock→confirm), appointments list, notifications center.
3. **M3 — Consultation:** WebRTC video/audio/chat, in-call attachments + mid-call prescription.
4. **M4 — Doctor core:** requests triage, availability, patient panel, earnings.
5. **M5 — Native polish:** push (Edge Function + FCM/APNs), camera uploads, biometric, deep links, offline read cache.
6. **M6 — Hardening:** a11y pass, performance, store submission.

## 10. Open questions

- Is "Sehat" a rebrand of Aria Health end-to-end, or the mobile-only brand? (Affects splash/store assets, not architecture.)
- Payments timeline — does v1 ship flag-only Aria Plus, or is a processor in scope for M5?
- Target markets / languages beyond English for v1.
- TURN capacity planning (Metered) for expected concurrent calls.
