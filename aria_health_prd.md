# Product Requirements Document (PRD)
## Doctor Booking & Telemedicine Platform (Practo-style)

**Version:** 2.0 (Detailed)
**Date:** 16 July 2026
**Status:** Draft for review
**Owner:** Product Management
**Reviewers:** Engineering Lead, Design Lead, Legal/Compliance, Clinical Advisor

---

## 0. Implementation Status vs. Current Build (Aria Health web app, updated 2026-07-16)

This PRD (v2.0) describes the **target** Practo-style product. The existing codebase is a **Next.js 16 / React 19 / Tailwind / Supabase web app** — not the React-Native + Node-microservices + Elasticsearch stack recommended in §11 — and it already implements a meaningful slice of the P0 surface. This snapshot maps each module to the current build so §15's plan and the "what next" decision stay grounded in reality.

Legend: ✅ Done · 🟡 Partial · 🔴 Not started

| Module (this PRD) | Status | Notes on the current build |
|---|---|---|
| Auth & profile (6.1) | 🟡 | Email/password + forgot/reset via Supabase Auth; role in `user_metadata`. **No phone OTP, no social login, no guest→auth-at-book gating.** |
| Doctor sign-up + verification (6.1.2) | 🟡 | Doctor register flow; admin verification queue with approve/reject + reason, persisted and audit-logged; DRAFT→APPROVED-style states. **License/document uploads not built.** |
| Search & discovery (6.2) | 🟡 | Server-side search with specialty/mode/fee/rating filters, sort, pagination, cross-request caching. **No geo/radius, no Elasticsearch, no autocomplete, no symptom routing.** |
| Doctor profile (6.3) | 🟡 | Full profile, availability, reviews, verified badge, Book + Message CTAs. **Reviews are seed-only and not gated to completed-consult authors; registration-number masking not shown.** |
| In-clinic booking (6.4) | 🟡 | Booking wizard, reschedule, cancel (with doctor notify), `.ics` + booking reference, fee-acknowledgement. **Race-safe slot booking shipped** (2026-07-16): partial unique index on active `(doctor_id, date_label, time_label)` = hard double-booking guarantee, plus a 5-min `lock_slot` soft-lock acquired at the date/time step; a taken slot surfaces "choose another slot" and bounces back (`0020_slot_locking.sql`, `lockSlot`, `BookingWizardClient`). **Still: no prepaid payment, no automated 24h/1h reminders, no refund-rules engine.** |
| Telemedicine (6.5) | 🟡 | WebRTC P2P video/audio + in-call chat via Supabase Realtime signaling + TURN; scheduled consult room. **No instant-consult matching (<60s), no waiting-room queue, no managed provider, no teleconsult consent capture, no drug whitelist.** |
| Async / follow-up chat (6.5.4) | ✅ | Mounted patient & doctor Messages with realtime, read receipts, pagination, attachments, typing, quick replies. **7-day follow-up window not enforced.** |
| E-prescription + records (6.6) | 🟡 | Structured e-Rx builder → signed PDF tied to patient/appointment; private records bucket + signed URLs; doctor-side access. **No drug-master autocomplete, no templates; health locker is basic.** |
| Family profiles (6.7) | 🔴 | Single profile per account. |
| Pharmacy (6.8) / Diagnostics (6.9) / Subscription (6.10) | 🔴 | None. |
| Doctor dashboard (6.11) | 🟡 | Availability, request queue, e-Rx, **real aggregated earnings**. No no-show marking, no settlement/TDS. |
| Admin panel (6.12) | 🟡 | Verification queue, **real analytics dashboards**, audit-log viewer. **No refund/dispute tooling, no review moderation, no config console.** |
| Payments (§5) | 🔴 | **No gateway at all.** Booking/consult are not prepaid — this blocks the core no-show-reduction and monetization model. |
| Notifications (§13) | 🟡 | Realtime in-app + Web Push. **No SMS (MSG91), no email pipeline.** |
| Non-functional (§10) | 🟡 | Role-aware RLS, tamper-resistant audit logging, server-side rate limiting, catalog caching. **No India data residency, no DPDP-specific controls, no i18n (Hindi), WCAG not audited.** |

**Biggest P0 gaps blocking the model, in order:** (1) **Payments / prepaid** (Razorpay or Stripe), (2) **instant-consult matching (<60s)**, (3) **phone OTP auth**, (4) **SMS + automated reminders**. (Race-safe slot booking — previously #2 — shipped 2026-07-16, see the booking row above.)

**Architecture note:** §11 recommends React Native + Node microservices + Elasticsearch on AWS ap-south-1. The current build is Next.js/Supabase web. For the MVP, the recommendation is to **keep building on the current stack** and treat the §11 stack as a scale-phase migration, not an MVP prerequisite — the P0 features below can all be delivered on Next.js/Supabase.

---

## 1. Document Purpose

This PRD specifies a four-vertical digital healthcare platform: doctor appointment booking, telemedicine (video/audio/chat consultation), e-pharmacy, and diagnostics. It is written for engineering, design, QA, and business stakeholders. Each requirement carries a priority (P0 = MVP, P1 = fast-follow, P2 = later), and P0 features include acceptance criteria.

The reference product is Practo, which operates 200,000+ doctors across 70,000+ clinics and hospitals in India, connects patients to a doctor in under 60 seconds for online consults, and runs a subscription plan (Practo Plus) at ₹399/month for unlimited online consultations across 20+ specialties.

---

## 2. Background & Problem

### 2.1 Market context
Telemedicine in India is growing at roughly 20% CAGR, and in major cities close to half of consultations now happen online. Regulatory clarity arrived with the Telemedicine Practice Guidelines (2020), which made remote consultation and e-prescriptions legally valid. This is the window a new entrant is building into.

### 2.2 User problems
1. **Time cost.** A single clinic visit consumes 2-4 hours (travel, waiting room, consult). The consult itself averages 8-12 minutes.
2. **Discovery is broken.** Patients pick doctors by word of mouth. They cannot compare fees, qualifications, experience, or verified reviews before committing.
3. **Records are lost.** Prescriptions and lab reports live on paper. Patients repeat tests and forget medication history.
4. **Access gap.** Tier 2/3 towns lack specialists. A diabetic in a small town may have no endocrinologist within 100 km.
5. **No-shows and dead slots.** Doctors lose 15-25% of booked slots to no-shows and cannot easily fill afternoon gaps.

### 2.3 Business opportunity
A platform that removes friction on both sides (patients get access and choice, doctors get filled slots and prepaid bookings) can take a 15-25% commission on consults plus SaaS and subscription revenue.

---

## 3. Goals, Non-Goals & Success Metrics

### 3.1 Goals
- Let a patient go from "I need a doctor" to a booked or live consultation in under 2 minutes.
- Give doctors a reliable, prepaid pipeline of patients with low no-show risk.
- Keep every prescription, report, and consult in one place the patient owns.

### 3.2 Non-goals (v1)
- Hospital ERP / bed and inventory management.
- Insurance claim adjudication (only capture insurance details for later).
- Wearable/IoT vitals sync.
- Markets outside India.
- Owned pharmacy inventory (marketplace only in v1).

### 3.3 Success metrics

| Category | Metric | Baseline | Target (12 mo) |
|---|---|---|---|
| Growth | Monthly active users (MAU) | 0 | 500,000 |
| Booking | In-clinic appointments/month | 0 | 100,000 |
| Telemed | Online consultations/month | 0 | 40,000 |
| Supply | Verified active doctors | 0 | 10,000 |
| Funnel | Search → booking conversion | - | > 18% |
| Reliability | Booking completion rate | - | > 92% |
| Speed | Instant-consult match time (p90) | - | < 60 s |
| Quality | Consultation CSAT | - | > 4.3 / 5 |
| No-show | Patient no-show rate | - | < 8% |
| Retention | D90 patient retention | - | > 35% |
| Revenue | Take rate on online consults | - | 15-25% |
| Subscription | Practo-Plus-style plan attach rate | - | > 12% of active patients |

---

## 4. Personas & Jobs-to-be-Done

**Priya, 29, product designer, Bengaluru.** Skin flare-up, no time to visit a clinic. JTBD: "Get a dermatologist on video tonight, get a prescription, order the cream to my door." Success = consult done in 15 minutes, medicine delivered next day.

**Rakesh, 42, IT manager, Delhi.** Manages his two kids and his diabetic father. JTBD: "Book the pediatrician, track my father's HbA1c follow-ups, keep everyone's records in one place." Success = one account, multiple family profiles, reminders that fire.

**Sunita, 55, homemaker, Indore.** No endocrinologist locally. Low-end Android phone, patchy 3G, prefers Hindi. JTBD: "Talk to a diabetes specialist without traveling to a metro." Success = Hindi UI, audio fallback when video drops, UPI payment.

**Dr. Mehta, 38, dermatologist, Pune.** Clinic sees 30 walk-ins/day; afternoons are slow. JTBD: "Fill my 2-5 pm gap with online consults and stop losing money to no-shows." Success = prepaid online slots, ready to start with one tap, weekly settlement.

**Admin/Ops (internal).** JTBD: "Verify doctors fast, keep fraud out, resolve refunds within SLA." Success = 48-hr verification turnaround, dispute resolution < 72 hrs.

---

## 5. Scope Overview (Feature Map)

| Module | P0 (MVP) | P1 | P2 |
|---|---|---|---|
| Auth & profile | Phone OTP, patient profile | Family profiles (6), social login | SSO for corporate |
| Discovery | Search + filters, doctor profiles, verified reviews | Symptom-based routing | AI recommendations |
| Booking | In-clinic slot booking, reschedule, cancel | Recurring/follow-up booking | Group/family slots |
| Telemedicine | Video/audio/chat consult, waiting room, e-prescription | 7-day follow-up chat, in-consult file share | Multi-party (2nd opinion) |
| Payments | Razorpay (UPI/card/netbanking/wallet), refunds | Subscription billing | Insurance capture, EMI |
| Records | Health locker (prescriptions, uploads) | Lab report auto-ingest | Shareable time-limited links |
| Pharmacy | - | Order from e-prescription, partner delivery | Refill reminders, chronic-care auto-refill |
| Diagnostics | - | Lab test catalog, home sample collection | Package bundles, prep instructions |
| Doctor app | Onboarding+verification, schedule, queue, e-Rx builder, earnings | Templates, analytics | Multi-clinic, staff roles |
| Admin | Verification queue, refunds, review moderation, config | Fraud tooling, payout automation | Advanced BI |
| Subscription | - | Monthly unlimited-consult plan (₹399-style) | Family & annual tiers |

---

## 6. Detailed Functional Requirements

### 6.1 Onboarding & Authentication (P0)

**6.1.1 Patient sign-up**
- Phone number + OTP (6-digit, 30-second expiry, 3 retries, then 5-min lockout).
- After OTP, collect: name, age, gender, city. Everything else optional.
- Session token (JWT) valid 30 days; refresh silently.
- Guest browsing allowed; auth required only at "Book" or "Consult".

**Acceptance criteria**
- Given a valid phone number, when the user requests OTP, then the OTP arrives within 10 seconds (p95) and the verify screen appears.
- Given 3 wrong OTP entries, then further attempts are blocked for 5 minutes and a support link is shown.
- Given a returning user with a valid token, then they skip login entirely.

**6.1.2 Doctor sign-up (P0)**
- Register with phone + email.
- Required documents: medical degree, state medical council / NMC registration number + certificate, government ID, clinic proof, profile photo.
- Status states: `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED (with reason)`.
- Doctor cannot appear in search or receive bookings until `APPROVED`.
- Target verification turnaround: 48 hours.

**Acceptance criteria**
- Given a doctor uploads all required documents, when they submit, then status becomes `UNDER_REVIEW` and an ETA of 48 hours is shown.
- Given admin rejects with a reason, then the doctor sees the reason and can re-upload without re-registering.

### 6.2 Search & Discovery (P0)

**6.2.1 Search inputs**
- Free-text: doctor name, specialty, symptom, clinic name, or procedure.
- Autocomplete suggestions after 2 characters, debounced 250 ms.
- Support 50+ specialties (dermatology, gynecology, pediatrics, orthopedics, ENT, cardiology, psychiatry, dermatology, general medicine, diabetes/endocrinology, neurology, etc.).

**6.2.2 Filters**
- Location radius (2/5/10/25 km, or "online only").
- Consultation mode (in-clinic / video / audio).
- Fee range slider.
- Availability (available today / tomorrow / this week).
- Gender, years of experience, language, minimum rating.

**6.2.3 Sort**
- Relevance (default), rating high→low, fee low→high, earliest available, distance.

**6.2.4 Result card**
- Doctor photo, name, specialty, experience, consult fee (in-clinic and online shown separately), rating + review count, next available slot, verified badge, distance.

**Acceptance criteria**
- Given a specialty + city, when the user searches on 4G, then results render in < 1.5 s (p90).
- Given "available today" filter, then only doctors with an open slot before midnight local time appear.
- Given no results, then the app suggests broadening radius or switching to online consult.

**Performance:** search backed by Elasticsearch; slot availability read from a cache refreshed every 30 s.

### 6.3 Doctor Profile (P0)

- Verified badge (only after manual document verification, mirroring Practo's process).
- Full name, qualifications, registration number (masked, e.g., "NMC-••••1234"), specializations.
- Years of experience, languages spoken.
- Consultation fees: in-clinic and online listed separately.
- Clinic block: address, map pin, photos, opening hours.
- Reviews: **only patients who completed a consultation can post a review** (kills fake reviews). Show rating distribution + written reviews, most recent first. Doctors may reply once per review.
- "Book appointment" and "Consult online" CTAs.

**Acceptance criteria**
- Given a user who never consulted this doctor, then the "write review" action is hidden.
- Given a completed consult, then a review prompt appears in the patient's app within 1 hour.

### 6.4 In-Clinic Appointment Booking (P0)

**6.4.1 Slot selection**
- Calendar shows next 14 days; each day shows available 15-minute slots.
- Real-time availability; a slot is soft-locked for 5 minutes once the user selects it (prevents double-booking).
- Booking confirmed in ≤ 3 taps from the profile.

**6.4.2 Payment & confirmation**
- Prepaid only. Consultation fee charged at booking (reduces no-shows).
- On success: booking ID, doctor + clinic details, add-to-calendar, and directions link.
- Confirmation via push + SMS.

**6.4.3 Reschedule / cancel**
- Reschedule or cancel up to 2 hours before the slot.
- Refund rules (shown before confirming):
  - Cancel > 2 hours before: 100% refund.
  - Cancel < 2 hours before or no-show: 50% refund (platform + doctor retain 50%).
  - Doctor-initiated cancellation: 100% refund + free rebooking + apology credit.

**6.4.4 Reminders**
- Push + SMS at 24 hours and at 1 hour before the slot.

**Acceptance criteria**
- Given two users select the same slot within 5 minutes, then only the one who completes payment first keeps it; the other sees "slot no longer available" and alternate slots.
- Given a cancellation 3 hours before, then a full refund is initiated and the patient sees "refund in 5-7 business days".
- Given a booking, then two reminders fire at the correct times in the patient's timezone.

### 6.5 Telemedicine / Online Consultation (P0)

**6.5.1 Two entry modes**
- **Scheduled online consult:** patient books a specific time slot with a specific doctor.
- **Instant consult ("Consult now"):** patient picks a specialty, pays, and is matched to the next available doctor. Target match time < 60 seconds (Practo's benchmark).

**6.5.2 Waiting room**
- Shows queue position and estimated wait.
- Pre-consult form: reason for visit, symptom duration, existing conditions, allergies, current medications; optional photo/report upload.

**6.5.3 Live consultation**
- Modes: video, audio, and text chat, switchable mid-consult (Practo supports all three).
- Built on WebRTC via a managed provider (e.g., 100ms/Agora) for v1.
- Works down to 256 kbps; adaptive bitrate; auto-reconnect on drop; audio-only fallback if video fails.
- In-call: chat, file/image share (patient can send a report or a photo of the affected area), mute, camera flip, end call.
- Default: no recording (privacy). Recording only with explicit dual consent.

**6.5.4 Post-consult**
- Doctor issues a structured e-prescription (see 6.6).
- 7-day free follow-up text chat with the same doctor for clarifications.
- Patient prompted to rate the consult and optionally order prescribed medicines / book prescribed tests.

**Acceptance criteria**
- Given an instant consult request with an available doctor in that specialty, then a match happens in < 60 s (p90); if none available, the user is offered the next scheduled slot or a callback.
- Given a video drop mid-consult, then the app auto-reconnects within 10 s or falls back to audio without ending the session.
- Given a completed consult, then the follow-up chat stays open for exactly 7 days, after which it becomes read-only.

**6.5.5 Regulatory (per Telemedicine Practice Guidelines 2020)**
- Display doctor's registration number in-consult.
- Capture patient consent to teleconsult before the call starts.
- Restrict prescribing of List X / prohibited drugs via telemedicine; enforce a drug whitelist per consult type.
- Every e-prescription carries the doctor's digital signature and registration number.

### 6.6 Prescriptions & Health Records (P0 core, P1 extended)

**6.6.1 E-prescription builder (doctor side, P0)**
- Structured fields: diagnosis, drug (autocomplete from a drug master), strength, dosage, frequency, duration, instructions.
- Templates for common conditions (P1).
- Generates a signed PDF; auto-saved to the patient's health locker and the doctor's records.

**6.6.2 Health locker (patient side)**
- Stores prescriptions, consult summaries, and uploaded documents (PDF/JPG/PNG, ≤ 25 MB each).
- Organized by member (for family profiles) and by date.
- Search by doctor, date, or condition.
- Time-limited shareable link (P2).

**Acceptance criteria**
- Given a doctor completes an e-prescription, then a signed PDF appears in the patient's locker within 30 seconds and includes the doctor's name and registration number.

### 6.7 Family Profiles (P1)
- One account manages up to 6 members (self + 5).
- Each member has independent records, bookings, and consult history.
- Switching member is one tap at booking/consult time.

### 6.8 Medicine Ordering (P1)
- Order directly from an in-app e-prescription (one tap adds all prescribed drugs to cart) or by uploading a prescription.
- **Marketplace model:** partner pharmacies fulfill; platform takes 10-20% margin. No owned inventory in v1.
- Mandatory pharmacist validation of the prescription before dispatch (regulatory requirement).
- Delivery SLA: 24-48 hrs metro, 2-4 days elsewhere. Order tracking with status states.
- Substitution handling: pharmacist may propose a generic substitute; patient approves in-app.

### 6.9 Diagnostics / Lab Tests (P1)
- Catalog of tests and packages with partner-lab prices (e.g., thyroid, HbA1c, full-body checkup).
- Home sample collection: pick a phlebotomist slot; live status (assigned → en route → collected → processing → report ready).
- Digital reports delivered to the health locker within each test's TAT.
- Book tests directly from a doctor's e-prescription.

### 6.10 Subscription Plan (P1)
Modeled on Practo Plus: unlimited online consultations across 20+ specialties for a flat monthly fee.
- Tiers: Individual (₹399/mo), Family (covers up to 6, priced higher), Annual (discounted).
- Benefits: unlimited online consults, priority matching, discounts on medicines and diagnostics, and (optional) one free health checkup on signup.
- Constraint (from Practo's model): one active consultation per member at a time.
- Auto-renew with card/UPI mandate; cancel anytime; access continues to period end.

### 6.11 Doctor Dashboard (P0)
- Calendar: set weekly availability, per-mode fees, block slots, mark leave.
- Consult queue: incoming instant requests + scheduled list; accept / start / complete / mark no-show.
- E-prescription builder (6.6.1).
- Earnings: per-consult breakdown, weekly settlement statement (downloadable), pending payout, TDS view.
- Reviews and single-reply capability.

**Acceptance criteria**
- Given a doctor marks leave for a date, then all that day's open slots disappear from patient search within 60 seconds.
- Given a completed consult, then the earning reflects in the dashboard within 1 hour with the correct commission deducted.

### 6.12 Admin Panel (P0)
- Doctor verification queue with document viewer, approve/reject + reason.
- Refund and dispute management with SLA timers.
- Review moderation (flag/remove abusive or fake reviews).
- Config: commission % per specialty/city, cancellation windows, subscription pricing, sponsored-listing slots.
- Dashboards: GMV, bookings, cancellations, consult completion, no-show rate, NPS, doctor supply by city.

---

## 7. Core User Flows

**Flow A — Book in-clinic appointment**
Home → search "dermatologist, Pune" → apply "available today" → open Dr. Mehta → pick 4:15 pm slot (soft-locked 5 min) → login via OTP → pay ₹500 via UPI → confirmation + calendar add + directions → 24 h and 1 h reminders → visit → review prompt.

**Flow B — Instant online consult**
Home → "Consult now" → pick "Dermatology" → fill pre-consult form + upload photo → pay ₹399 → matched to available dermatologist in < 60 s → enter waiting room → video consult → receive e-prescription → 7-day follow-up chat opens → prompted to order medicine / book test.

**Flow C — Doctor onboarding**
Sign up → upload degree + NMC registration + ID + clinic proof → status `UNDER_REVIEW` (ETA 48 h) → admin approves → set schedule, fees, modes → profile goes live in search → first booking received.

**Flow D — Cancellation with refund**
My appointments → select booking → cancel → system checks time-to-slot → if > 2 h, show "100% refund" → confirm → refund initiated → status "Refund processing (5-7 business days)".

**Flow E — Order medicine from prescription**
Health locker → open e-prescription → "Order medicines" → all drugs pre-filled in cart → select address → pay → pharmacist validates → dispatch → track → delivered.

---

## 8. Data Model (Core Entities)

**User**: id, phone, email, role (patient/doctor/admin), created_at, status.
**PatientProfile**: id, user_id, name, dob, gender, city, members[] (family), insurance_info (P2).
**DoctorProfile**: id, user_id, name, specialties[], registration_no, qualifications[], experience_years, languages[], verification_status, verified_at, fees{in_clinic, online}, rating_avg, rating_count.
**Clinic**: id, doctor_ids[], name, address, geo{lat,lng}, photos[], hours[].
**Slot**: id, doctor_id, clinic_id, start_ts, duration, mode, status(open/soft_locked/booked/blocked), locked_until.
**Appointment**: id, patient_id, member_id, doctor_id, slot_id, mode, status(booked/completed/cancelled/no_show), fee, payment_id, created_at.
**Consultation**: id, appointment_id or instant_request_id, mode, started_at, ended_at, prescription_id, followup_expires_at.
**Prescription**: id, consultation_id, doctor_id, patient_id, diagnosis, items[]{drug, strength, dosage, frequency, duration, notes}, signed_pdf_url, signed_at.
**Payment**: id, entity_type, entity_id, amount, gateway_ref, status, refund_status.
**Review**: id, doctor_id, patient_id, consultation_id, rating, text, doctor_reply, created_at.
**Order (pharmacy)**: id, patient_id, prescription_id, items[], pharmacy_id, status, delivery_eta.
**LabBooking**: id, patient_id, tests[], lab_id, collection_slot, status, report_url.
**Subscription**: id, account_id, tier, status, started_at, renews_at, payment_mandate_id.

---

## 9. Key API Contracts (Illustrative)

- `POST /auth/otp/request` { phone } → { request_id, expires_in }
- `POST /auth/otp/verify` { request_id, code } → { token, refresh, is_new_user }
- `GET /search/doctors?specialty=&city=&lat=&lng=&mode=&available=&sort=` → paginated doctor cards
- `GET /doctors/{id}` → full profile + next slots
- `POST /slots/{id}/lock` → { locked_until } (409 if already locked/booked)
- `POST /appointments` { slot_id, member_id, mode } → { appointment_id, payment_intent }
- `POST /payments/confirm` { payment_intent, gateway_ref } → { status }
- `POST /appointments/{id}/cancel` → { refund_amount, refund_eta }
- `POST /consult/instant` { specialty, member_id } → { match: doctor_id, room_token } | { queued: true, eta }
- `POST /consult/{id}/prescription` (doctor) → { prescription_id, pdf_url }

All endpoints: TLS 1.3, JWT auth, idempotency keys on POST that touch money.

---

## 10. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | API p95 < 400 ms; search p90 < 1.5 s; app cold start < 3 s |
| Availability | 99.9% for booking, payments, and live video |
| Scale | 5,000 concurrent video consults; 50,000 searches/min peak |
| Consistency | Slot booking must be race-safe (soft-lock + DB unique constraint) |
| Security | AES-256 at rest, TLS 1.3 in transit; per-user data isolation; audit logs on all record access |
| Compliance | India DPDP Act 2023; Telemedicine Practice Guidelines 2020; e-pharmacy rules; data residency in India (ap-south-1) |
| Privacy | No sale of health data; consults visible only to patient + doctor; recordings off by default with dual consent |
| Localization | English + Hindi at launch; +6 Indian languages within 6 months |
| Accessibility | WCAG 2.1 AA; dynamic font scaling; screen-reader labels; color-contrast ≥ 4.5:1 |
| Low-bandwidth | Usable on 3G; video works at 256 kbps; audio fallback |
| Platforms | Android (min SDK 24), iOS 15+, responsive web |
| Observability | Structured logs, distributed tracing, real-time alerting on booking/payment/video failure rates |

---

## 11. Technical Architecture (Recommended)

- **Mobile:** React Native (single codebase for iOS + Android, faster iteration).
- **Web:** Next.js responsive site.
- **Backend:** Node.js microservices (auth, search, booking, consult, payments, records, pharmacy, diagnostics) + a Python service for search ranking and, later, recommendations.
- **Real-time video:** WebRTC via managed provider (100ms / Agora) for v1; reassess self-hosting past ~50k consults/month.
- **Data stores:** PostgreSQL (transactional), Elasticsearch (doctor search), Redis (slot locks, sessions, availability cache), S3 (documents, prescriptions, reports).
- **Payments:** Razorpay (UPI, cards, netbanking, wallets; subscription mandates via UPI Autopay/e-mandate).
- **Notifications:** FCM + APNs for push; SMS via MSG91; email via SES.
- **Infra:** AWS ECS/EKS, multi-AZ, region ap-south-1 (Mumbai) for data residency; CDN for static/media.
- **CI/CD:** trunk-based, automated tests gate deploys, feature flags for staged rollout.

> **Current build divergence (see §0):** the app today is Next.js/Supabase (Postgres + Realtime + Storage + Auth) on a mock-fallback read layer, with self-hosted WebRTC signaling over Supabase Realtime and a Metered TURN server. Recommendation: deliver the MVP on this stack (Supabase Postgres ≈ PostgreSQL, Supabase Storage ≈ S3, Supabase Realtime/Redis-style locks) and migrate toward §11 (Elasticsearch, managed video, microservices, RN mobile) as scale demands.

---

## 12. Analytics & Instrumentation

Track these events end-to-end for funnel analysis:
- `search_performed` (query, filters, result_count)
- `doctor_profile_viewed`
- `slot_selected`, `slot_lock_failed`
- `booking_started`, `payment_succeeded`, `payment_failed`
- `instant_consult_requested`, `consult_matched` (match_time_ms)
- `consult_started`, `consult_ended` (duration, mode, drops)
- `prescription_issued`
- `review_submitted`
- `medicine_order_placed`, `lab_test_booked`
- `subscription_started`, `subscription_cancelled`

North-star: **completed consultations per active user per quarter.**

---

## 13. Notification Matrix

| Trigger | Patient | Doctor | Channel |
|---|---|---|---|
| Booking confirmed | Yes | Yes | Push + SMS |
| 24 h reminder | Yes | Yes | Push + SMS |
| 1 h reminder | Yes | Yes | Push |
| Instant consult matched | Yes | Yes | Push |
| Consult starting | Yes | Yes | Push |
| Prescription ready | Yes | - | Push |
| Cancellation/refund | Yes | Yes | Push + SMS |
| Follow-up chat message | Yes | Yes | Push |
| Medicine dispatched/delivered | Yes | - | Push + SMS |
| Lab report ready | Yes | - | Push |
| Subscription renewal/expiry | Yes | - | Push + email |

---

## 14. Monetization (Detailed)

1. **Consultation commission:** 15-25% per online consult (configurable per specialty/city).
2. **Provider SaaS:** practice-management software for clinics, ₹1,000-5,000/month tiers (Practo Ray equivalent) — scheduling, records, billing for the clinic itself.
3. **Patient subscription:** unlimited online consults, modeled on Practo Plus at ₹399/month; Family and Annual tiers; bundled medicine/diagnostics discounts.
4. **Sponsored listings:** doctors/clinics pay for higher placement, always labeled "Ad", capped per results page.
5. **Diagnostics & pharmacy margin:** 10-20% commission from partner labs and pharmacies.
6. **Corporate health plans:** B2B employee healthcare packages (Practo offers employee cover from ~₹101/employee/month as a reference point).

---

## 15. Release Plan

| Phase | Scope | Timeline |
|---|---|---|
| MVP build | P0: auth, search, in-clinic booking, instant + scheduled video consult, e-prescription, payments, health locker, doctor dashboard, admin verification | Months 1-4 |
| Closed beta | 2 cities, 500 doctors, 5,000 invited patients; instrument funnel; fix drop-offs | Month 5 |
| GA v1 | Public launch in 3 cities | Month 6 |
| v1.5 | P1: family profiles, 7-day follow-up chat, medicine ordering, diagnostics, lab report ingest | Months 7-9 |
| v2 | P2: subscription plans, symptom-based routing, doctor analytics, +6 languages, EMI/insurance capture | Months 10-12 |

---

## 16. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Fake/unverified doctors | Critical | Mandatory document verification before go-live; periodic re-verification; in-app report button; registration number shown in-consult |
| Doctor no-shows | High | Prepaid model; no-show penalty on doctor rating; 100% refund + free rebooking on doctor cancellation |
| Cold-start supply gap | High | City-by-city launch; onboarding team; commission waiver for first 6 months per doctor |
| Regulatory shift (telemed/e-pharmacy) | High | Quarterly legal review; drug whitelist per consult; pharmacist validation before dispatch |
| Video quality on weak networks | Medium | Adaptive bitrate; 256 kbps floor; audio fallback; callback option |
| Review fraud | Medium | Reviews gated to completed consults only; moderation queue |
| Payment failures at booking | Medium | Retry + alternate methods; hold slot lock through the retry window |
| Health-data breach | Critical | Encryption, access audit logs, annual pen-testing, DPDP compliance officer, least-privilege access |
| Race conditions on hot slots | Medium | Redis soft-lock + DB unique constraint; idempotent payment confirm |

---

## 17. Open Questions

1. Owned pharmacy inventory later, or stay pure marketplace? (affects margins vs. capital and licensing.)
2. Instant-consult pricing: flat per specialty, or doctor-set? (affects match speed and fairness.)
3. Insurance/cashless: build in v2, or only capture details now?
4. Doctor payout cadence: weekly vs. T+2, and minimum payout threshold?
5. Subscription: does "unlimited" need soft abuse limits beyond "one active consult at a time"?
6. Do we allow anonymous/pseudonymous consults for sensitive specialties (mental health, sexual health)?

---

## 18. Appendix A — Competitive Reference

| Feature | Practo | Apollo 24/7 | Tata 1mg |
|---|---|---|---|
| Doctor booking | Core | Yes | Limited |
| Video consult | Yes | Yes | Yes |
| Instant match | < 60 s | Yes | Yes |
| Medicine delivery | Yes | Yes | Core |
| Diagnostics | Yes | Yes | Yes |
| Provider SaaS | Yes (Ray) | No | No |
| Subscription | Practo Plus (₹399/mo) | Circle | Care Plan |

## 19. Appendix B — Glossary
- **Instant consult:** patient matched to next available doctor without pre-booking a slot.
- **Soft-lock:** temporary 5-minute hold on a slot during checkout.
- **Health locker:** patient-owned store of prescriptions and reports.
- **TAT:** turnaround time (for lab reports).
- **Take rate:** platform's commission as a % of transaction value.
