# Aria Health — Full Application Audit

> **Context that frames everything below:** This is a genuinely well-built *demonstration/portfolio* application. It has a real Supabase backend option, a real peer-to-peer WebRTC consultation room, real realtime chat, and a polished, consistent design system. But it is architected around a **"mock-first, graceful-degradation" philosophy** — every read falls back to dummy data, and many write actions are `no-op` stubs. The README itself says *"For demonstration only — not a real medical service."* So the honest lens is: **excellent demo, ~35-40% of a real product.** Many screens that *look* functional are static or local-state-only.

---

## 1. Feature Audit

### ✅ Fully implemented (actually work end-to-end)

| Feature | What it does | Notes |
|---|---|---|
| **Video/Audio consultation (WebRTC)** | True P2P video+audio via `RTCPeerConnection`, STUN+TURN (Open Relay), Supabase Realtime signaling, presence-based deterministic offerer, ICE buffering, media-permission fallbacks, in-call chat, mute/cam toggle, call timer, graceful "other party left." | `ConsultationRoom.tsx` is the strongest code in the repo. Genuinely production-grade logic. Caveat: depends on a **free public TURN server** (not viable for production). |
| **Realtime chat (configured mode)** | Persists to `chat_messages`, streams via Postgres changes subscription, dedupes echoes, unread counts, per-perspective threads. | Real when Supabase is configured. |
| **Doctor search & filter** | Client-side search by name/specialty/tags, filters by specialty/mode/fee/rating, 4 sort modes, empty state, reset. | Fully functional (client-side over loaded list). |
| **Auth (email/password)** | Real Supabase sign-up/sign-in/sign-out, role in `user_metadata`, `profiles` trigger, doctor catalog backfill (`ensureDoctorRow`), email-confirmation handling. | Works when configured. |
| **Route protection & role gating** | Middleware refreshes session, gates `/patient|/doctor|/admin` by sign-in + role, redirects wrong-role users, remembers `next`. | Solid. |
| **Booking → appointment creation** | Multi-step wizard writes a real `appointments` row, dedupes duplicate slots, routes to the shared consultation room. | Backend write is real; see payment caveat below. |

### 🟡 Partially implemented

| Feature | Status | Gap |
|---|---|---|
| **Booking wizard** | UI complete, appointment persists | **Payment is entirely fake** (prefilled `4242…` card, no gateway). "Upload reports" is a decorative dropzone. "Who is this for?" not saved. |
| **Doctor appointment requests** | Accept/Decline persists status; UI is real | "History" and "Prescription" buttons just link to generic pages, not the specific patient/consult. |
| **Prescription builder** | Great live-preview UI; `issuePrescription` persists | **Hardcoded** doctor ("Dr. Anaya Rao") & patient ("Rohan Mehta"); `patientId` never passed → prescriptions aren't tied to a patient. "Save draft" does nothing. No PDF generation. |
| **Chat (mock mode)** | UI real | Doctor replies are **canned keyword responses** (`doctorReply()`), not a real person. |
| **Notifications** | Renders real/mock data | **Read-only** — no mark-as-read, no unread count decrement, bell icon is a static red dot linking to a page (doctor bell links to *dashboard*, not notifications). |
| **Medical records** | Lists data, tabs by type | **View / Download / Upload all non-functional.** No file storage. Vitals on dashboard are hardcoded. |

### 🔴 Missing / non-functional

- **Availability save** — `saveAvailability` action exists but the "Save changes" button is **not wired to it** (no `onClick`). Doctor's schedule edits evaporate on reload. Also no `doctorId` is available to the page.
- **Admin verification decisions** — Approve/Reject only mutate **local state**; `decideVerification` action exists but is **never called**. Nothing persists.
- **Admin content management** — 100% static form; "Publish changes"/"Add"/"Edit" do nothing.
- **Admin dashboard/revenue/reports** — read some live counts but charts/figures are largely static mock data.
- **Settings** — **no settings page exists anywhere** (not in any nav).
- **Profile management** — **no way to view/edit your own profile**, avatar, contact info, password.
- **Forgot password** — link points back to `/login` (dead).
- **Social login** — Google/Apple buttons are inert.
- **Doctor license upload** — clicking a doc just toggles a ✅ label; **no actual file upload**; license number field isn't saved.

### ⚠️ Placeholder/dummy that looks real

- Patient dashboard **vitals** (BP/HR/BMI/glucose) — hardcoded constants.
- Doctor dashboard **today's stats & schedule** — hardcoded arrays ("8 appointments", fixed patient names).
- AI Health Assistant — **canned keyword branching**, not an LLM.
- All charts/earnings/revenue figures — static.

---

## 2. User Flow Analysis

**Authentication** ✅ Mostly clean. Multi-step register is nice. ⚠️ *Dead ends:* forgot-password, social login. Password rules only enforced on register (`minLength=8`), not surfaced from server errors well.

**Onboarding** 🟡 Patient step-2 collects DOB/gender/phone/concerns but **none of it is saved** (only `full_name` goes into metadata). The whole "complete your profile" step is cosmetic.

**Dashboard** ✅ Good glanceable layout. ⚠️ Doctor dashboard has a **real bug**: `getDoctorAppointments(user?.name)` passes the doctor's *name* where a *doctor_id* is expected → live requests never match, silently falls back to mock. Also title renders **"Welcome back, Dr. Dr. Anaya Rao"** (double "Dr.") and a leftover `console.log("🚀 ~ DoctorDashboard…")` ships to production.

**Appointment booking** ✅ Smooth 4-step flow, good summary sidebar, sensible chat-first ordering. ⚠️ Fake payment; confirmation "Book a lab test / Order medicines" links go to unrelated pages.

**Appointment management** ✅ Patient upcoming/completed tabs, join/rebook. Reasonable.

**Doctor workflow** 🟡 Requests → Accept → Start consultation works. But prescriptions/availability/patient-history are demo-static or unwired. **Inconsistency:** `doctor/appointments` correctly resolves the doctor via `profile_id`, but `doctor/messages` **hardcodes `DOCTOR_ID = "dr-anaya-rao"`** — a real logged-in doctor sees Anaya Rao's threads, not their own.

**Patient workflow** ✅ Coherent. 🔴 Records/prescriptions are view-only shells.

**Video/Audio** ✅ Real and impressive. ⚠️ Legacy `/patient/consultation` & `/doctor/consultation` correctly redirect to the appointments lists (good cleanup). There is no "audio-only" distinct UI — audio just means the video track is absent; it works but isn't a designed experience.

**Chat** ✅ (configured) / 🟡 (mock, canned replies). Good mobile master-detail pattern.

**Notifications** 🔴 Read-only; **doctor bell icon links to the dashboard, not `/doctor/notifications`** — the doctor nav doesn't even include a notifications link (admin & patient do). Inconsistent.

**Navigation** ⚠️ Doctor nav has **two items pointing to the same route** — both "Requests" and "Consultation" go to `/doctor/appointments`. Confusing.

**Profile / Settings** 🔴 Entirely absent.

---

## 3. Production Readiness Assessment

| Dimension | Finding |
|---|---|
| **Dummy data** | Pervasive by design (`lib/data.ts`, 779 lines). Dashboards, vitals, schedules, earnings, revenue hardcoded. |
| **Mock APIs** | All writes `no-op` when Supabase unconfigured; several never call their action even when configured (availability, verification). |
| **Payments** | No integration. Fake card. Blocker for a paid telemedicine product. |
| **File storage** | None. Records, license docs, report uploads all non-functional. No Supabase Storage usage. |
| **Validation** | Minimal client-side (`required`, `minLength`). No server-side validation/sanitization on actions; no Zod. |
| **Error handling** | Actions swallow errors and return `{ok:false}`, but the **UI rarely checks `ok`** — e.g. booking sets `done=true` regardless; chat send ignores failures. No user-visible error toasts. |
| **Loading states** | **No route-level `loading.tsx`/`error.tsx`/`not-found.tsx` anywhere.** Async server pages block with no skeletons; client actions have minimal `saving` flags (only booking). |
| **Empty states** | ✅ Good — `EmptyState` component used well in appointments/requests/search. |
| **Permission handling** | Route gating good. **RLS is deliberately demo-permissive** (operational tables world-readable) — a real data-leak risk flagged in the repo's own docs. |
| **Performance** | Fine for current scale. Doctor search loads *all* doctors then filters client-side — won't scale. No pagination anywhere. |

**Verdict: Not production-ready.** It's a high-fidelity prototype. Shipping it as a real medical product would expose fake payments, world-readable PHI, and non-persisting clinical actions (prescriptions/availability/verification).

---

## 4. UX & UI Review

**Strengths — this is the standout dimension:**
- **Visual consistency:** Excellent. A disciplined PlayStation-inspired system (`DESIGN-playstation.md`) — alternating dark/light/blue canvases, Roboto 300 display type, 8px cards, blue reserved strictly for primary actions.
- **Component consistency:** Strong shared primitives (`ui.tsx`, `DashboardShell`, `Tabs`, `Badge`, `EmptyState`, `AppointmentCard`). Reused well.
- **Typography & spacing:** Clean, generous rhythm, premium feel.
- **Animations:** Tasteful (`page-enter`, `stagger`, `lift`, ping/pulse in the call room).
- **Responsiveness:** Genuinely good — mobile sidebar drawer, chat master-detail collapse, responsive grids throughout.

**Weaknesses:**
- **Icons are inconsistent** — mix of a proper `Icon.tsx` line-icon set, inline SVGs in `navConfigs`, and **emoji** used as UI icons (🎥📞💬🧪💊✨➤). Emoji render differently per-OS and read as unpolished for a premium/medical brand.
- **Accessibility gaps:** emoji icons lack labels; color-only status indicators (vitals dots, unread dots); the send button in the assistant is a bare `➤`; modal (`RateButton`) has no focus trap / `Esc` / `role="dialog"`; range sliders lack visible value labeling for SR; limited `aria-live` on chat.
- **The send arrow** `➤` in the assistant vs. proper `Icon name="send"` elsewhere — inconsistent.
- **Double-"Dr." and "undefined" name** leaks are visible UX defects.

**To feel truly premium:** replace all emoji with the line-icon set, add focus management to modals, add skeleton loaders, and unify the two send buttons.

---

## 5. Technical Review

**Architecture — genuinely good bones:**
- Clean separation: `lib/db.ts` single read layer, `lib/actions/*` writes, three purpose-built Supabase clients (public/server/middleware), `SessionProvider` so client code never imports server code. This is textbook-correct App Router structure.
- The mock-fallback contract is elegant and consistently applied.

**Issues:**

1. **Real bug — doctor dashboard passes name as id:** `getDoctorAppointments(user?.name as string)` — will never match `doctor_id`. (`app/doctor/dashboard/page.tsx:26`)
2. **Leftover debug:** `console.log("🚀 ~ DoctorDashboard ~ user:", user)` (line 25) ships to prod.
3. **Hardcoded doctor identity** in `doctor/messages` (`DOCTOR_ID = "dr-anaya-rao"`) and `doctor/prescriptions` — breaks multi-doctor use.
4. **Unwired actions:** `saveAvailability` and `decideVerification` are imported/defined but never invoked from their buttons — dead clinical/admin operations.
5. **`as string` casts hide the bugs** — `doctor?.id as string`, `user?.name as string` mask undefined at the type level.
6. **Duplicated time-formatting** (`clockLabel` in ChatClient duplicates `shortTime` in db.ts, plus `clock()` in ConsultationRoom).
7. **State management:** heavy reliance on local component state that isn't persisted (verification, availability, notifications read-state) — creates "looks like it worked but didn't" UX.
8. **No error boundaries / loading UI** — a thrown server component = unhandled.
9. **Security:**
   - **World-readable RLS** on PHI tables (flagged in repo docs, but it's the single biggest risk).
   - **TURN credentials hardcoded** in client (public free service — fine for demo, not prod).
   - No server-side input validation on any action → trusting client entirely.
   - `getOrCreatePatientThread` interpolates values into a Supabase `.or()` filter string (`patient_name.eq.${...}`) — worth auditing for filter-injection with adversarial names.
   - No rate limiting, no CSRF consideration beyond Next defaults, no audit logging.
10. **Scalability:** no pagination; client-side search over full lists; chat loads *all* messages for *all* threads in one `getChatThreads` call (N threads → one big message fetch, mapped in memory).

---

## Features Remaining to be Implemented

### 🔴 Critical (blockers for a real telemedicine product)
- **Payment integration** (Stripe/Razorpay) — real charge, refunds, receipts, doctor payouts.
- **Role-aware RLS** — patients see only their rows; doctors only their patients; admin via service role. (Current world-readable = PHI breach.)
- **File storage** — Supabase Storage for records, license docs, report uploads, prescription PDFs.
- **Persist clinical actions properly** — wire availability save, verification decisions, prescriptions-tied-to-patient.
- **Fix doctor identity resolution** everywhere (dashboard, messages, prescriptions) to the signed-in doctor.
- **Server-side validation** (Zod) + real error surfacing.
- **HIPAA/GDPR posture** — encryption at rest for PHI, audit logs, consent, data-retention, BAA-grade TURN/media.

### 🟠 High Priority
- **Profile management** (patient + doctor): edit info, avatar, change password, medical history.
- **Settings** page: notifications prefs, privacy, language, delete account.
- **Real notifications**: mark-as-read, unread counts, push/email, per-event triggers.
- **Forgot/reset password** + email verification polish.
- **Appointment lifecycle**: reschedule, cancel (with policy), reminders, calendar (.ics) integration.
- **Prescription PDF** generation + pharmacy/e-Rx.
- **Loading & error boundaries** across routes.
- **Real AI assistant** (LLM-backed, with safety guardrails) — currently keyword stub.

### 🟡 Medium Priority
- Doctor earnings → real payout ledger; admin revenue → real analytics.
- Ratings/reviews persistence (currently `RateButton` just shows 🎉).
- Search: server-side, paginated, geo/insurance filters.
- Lab test booking (advertised in UI, not built).
- Medicine ordering (advertised, not built).
- Social login (Google/Apple).
- In-consultation: screen share, waiting room, network-quality indicator, recording (with consent).

### 🟢 Nice to Have
- i18n/multi-language, dark mode toggle, accessibility certification.
- Insurance/claims, family accounts, wearable/vitals integration (make those dashboard vitals real).
- Doctor analytics, patient health-timeline, referrals.

---

## My Recommendations

**Product design**
- Decide the identity: this is a beautiful *demo*. To productize, pick a vertical slice (e.g. video consult + payment + prescription) and make it *fully* real rather than broadening. Depth over breadth.
- Kill dead ends: every button should do something or not exist. The gap between "looks done" and "is done" is the app's biggest credibility risk.

**UX**
- Replace all emoji-as-icons with the existing line-icon set; add loading skeletons and error/empty states uniformly; add optimistic-with-rollback patterns and toasts so failures are visible.
- Add a real profile/settings area — its absence is conspicuous for a health app.

**Performance**
- Server-side, paginated search and message loading before real data volume. Consider `@tanstack/react-query` or RSC streaming with Suspense for perceived speed.

**Architecture**
- Introduce Zod schemas shared by client + server actions. Return typed `{ok, error}` and standardize a `useAction` hook that surfaces errors.
- Remove `as string` casts that mask undefined; resolve doctor identity in one shared helper (`getCurrentDoctor()`), used by dashboard/messages/prescriptions.
- Extract time formatting into one util; delete the three copies.

**Security (do these before *any* real users)**
- Rewrite RLS to be role-aware. This is non-negotiable for PHI.
- Move TURN to a paid/authenticated service (Twilio/Cloudflare/coturn) with short-lived credentials.
- Server-validate every action; add rate limiting and audit logging; review the `.or()` string interpolation.

**Scalability**
- Pagination + indexes; per-thread lazy message loading; CDN for media; consider a dedicated signaling/SFU if group calls are ever wanted.

**Roadmap (suggested)**
1. **Phase 1 (harden the demo):** fix the identified bugs, wire the unwired actions, add loading/error states, remove console.log. (Days.)
2. **Phase 2 (make it real):** RLS + payments + file storage + profile/settings + validation. (Weeks.)
3. **Phase 3 (compliance & scale):** HIPAA posture, real notifications/email, pagination, real AI, analytics. (Months.)
4. **Phase 4 (differentiate):** lab/pharmacy, insurance, wearables, care-team/referrals.

---

## Final Report

### Feature Summary Table

| Feature | Status | Priority | Recommendation |
|---|---|---|---|
| WebRTC video/audio consultation | Complete | — | Move off free TURN; add consent-based recording, network indicator |
| Realtime chat (configured) | Complete | — | Add read receipts, typing, attachments, pagination |
| Doctor search & filter | Complete | Medium | Move server-side + paginate |
| Email auth + role gating | Complete | — | Add forgot-password, social login |
| Booking → appointment write | Partial | Critical | Add real payment; save "for whom"; wire report upload |
| Appointment management | Partial | High | Add reschedule/cancel/reminders |
| Doctor requests (accept/decline) | Partial | High | Fix doctor-id resolution; link real patient history |
| Prescription builder | Partial | High | Untie from hardcoded names; attach patientId; PDF |
| Doctor availability | Missing (save unwired) | Critical | Wire `saveAvailability`; supply doctorId |
| Admin verification | Missing (unwired) | High | Call `decideVerification`; persist |
| Admin content mgmt | Missing (static) | Medium | Back with DB or drop from scope |
| Admin dashboard/revenue/reports | Partial | Medium | Real aggregates/analytics |
| Notifications | Partial (read-only) | High | Mark-read, counts, triggers, push/email |
| Medical records | Partial (view-only) | Critical | File storage + view/download/upload |
| Patient onboarding (step 2) | Partial (not saved) | High | Persist DOB/gender/phone/concerns |
| AI health assistant | Partial (canned) | Medium | Real LLM with guardrails |
| Ratings/reviews | Missing (cosmetic) | Medium | Persist and surface on profiles |
| Payments | Missing | Critical | Stripe/Razorpay + payouts |
| Profile management | Missing | High | Build patient + doctor profile |
| Settings | Missing | High | Build settings area |
| Lab booking / medicine ordering | Missing | Medium | Build or remove advertised CTAs |
| RLS security (PHI) | Missing (permissive) | Critical | Role-aware policies before any user |

### Scores

- **Estimated overall completion:** ~**38%** of a production telemedicine platform (UI ~85%, real backend/functionality ~30%, compliance ~5%).
- **Production readiness:** **3 / 10** — fake payments, permissive PHI access, and several unwired/non-persisting core actions.
- **UX:** **8 / 10** — cohesive, premium, responsive; docked for emoji icons, accessibility gaps, and visible "undefined/double-Dr." defects.
- **Technical architecture:** **7.5 / 10** — clean, idiomatic App Router structure and an elegant fallback layer; docked for hardcoded identities, unwired actions, and no validation/error boundaries.
- **Code quality:** **7 / 10** — readable, well-commented, consistent; docked for a shipped `console.log`, `as string` casts masking bugs, duplication, and the identity bug.

### Overall Recommendation

**Ship it as an impressive portfolio/demo today; do not put real patients on it.** The design system and the WebRTC + realtime infrastructure are genuinely strong — better than most prototypes. The gap is that a large share of screens are static or local-state-only, and the three true blockers (real payments, role-aware RLS on PHI, and persisting core clinical actions) are absent.

If the goal is a **showcase**, spend a few days on Phase 1 (fix the doctor-id bug, remove the console.log, wire availability + verification, add loading/error states) and it becomes a flawless demo. If the goal is a **real product**, budget for Phase 2–3: payments, storage, security/compliance, profiles/settings, and real notifications — that's where the remaining ~60% lives.
