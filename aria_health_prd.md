# Aria Health Product Requirements Document (PRD)

## 1. Introduction

### 1.1. Purpose

This Product Requirements Document (PRD) outlines the necessary features, functionalities, and technical specifications required to evolve the Aria Health application from its current state as a high-fidelity prototype into a production-ready telemedicine platform. It leverages insights from a comprehensive application audit to identify critical gaps and define a clear path for development, ensuring the product meets the demands of a real medical service.


### 1.2. Scope

The scope of this PRD encompasses the development and implementation of core telemedicine functionalities, robust user and administrative management systems, essential third-party integrations, and critical non-functional requirements related to performance, security, scalability, and user experience. The primary focus is on addressing the identified blockers and high-priority items from the audit to enable safe, compliant, and effective patient care.


### 1.3. Definitions and Acronyms

*   **PHI:** Protected Health Information
*   **PRD:** Product Requirements Document
*   **RLS:** Row Level Security
*   **WebRTC:** Web Real-Time Communication
*   **Supabase:** Backend-as-a-Service platform used for database, authentication, and real-time features.
*   **TURN Server:** Traversal Using Relays around NAT, used for WebRTC to relay media when direct peer-to-peer connection is not possible.
*   **Zod:** A TypeScript-first schema declaration and validation library.


### 1.4. Implementation Status Snapshot (updated 2026-07-14)

Since the original audit, several Phase 1 ("harden the demo") items have shipped. This snapshot reflects the **current codebase**; the requirements in sections 4–5 remain the target end-state.

**✅ Shipped since the audit**
*   **Doctor identity resolution** — the dashboard now resolves the real doctor catalog id instead of passing the doctor's name, so live appointment requests match. (`app/doctor/dashboard/page.tsx`)
*   **Real doctor schedule** — "Today's schedule" derives from the doctor's actual appointments, chronologically sorted, with an empty state (was a hardcoded array).
*   **Doctor availability save** — `saveAvailability` is wired through `AvailabilityClient` and persists.
*   **Prescriptions** — PDF generation (`lib/prescriptionPdf.ts`, `PrescriptionDownloadButton`) and in-consultation issuance tied to the appointment/patient (`issuePrescriptionForAppointment`, `CallPrescriptionPanel`).
*   **Notifications** — realtime INSERT stream plus mark-as-read / unread counts (`NotificationsRealtime`, `markNotificationsRead`).
*   **Live refresh** — pages re-fetch on relevant table changes (`RealtimeRefresh`).
*   **Interaction feedback** — link/submit spinners (`LinkPending`, `SubmitButton`, `Button loading`); stray debug `console.log`s removed.
*   **Mobile performance** — the ~246 KB Supabase realtime client is lazy-`import()`ed inside effects (Chat, Notifications, RealtimeRefresh) so it stays off the initial hydration path and taps stay responsive.
*   **Admin verification persistence** — `decideVerification` is now wired in `app/admin/verification/page.tsx` with optimistic state, a busy/disabled spinner, and success/error toasts.
*   **Prescription builder patient tie** — launched from a completed consultation (`/doctor/prescriptions?appointmentId=…`) it now issues via `issuePrescriptionForAppointment`, which resolves the real patient and doctor server-side; the header drops the hardcoded demo name in that mode. The no-arg builder remains a demo preview.
*   **Route-level loading & error** — root `app/loading.tsx` (Suspense spinner) and `app/error.tsx` (recoverable error boundary with retry), plus per-section `app/{patient,doctor,admin}/loading.tsx` that render the dashboard shell around a `PageSkeleton`, so navigating between portal pages shows an in-place skeleton (sidebar stays put) instead of a frozen screen.
*   **Profile management (Phase 2)** — patient/doctor/admin `/…/profile` pages let a signed-in user view and edit name, phone, DOB, and gender, persisted to the `profiles` table via `updateProfile`; auth metadata (name/initials) is kept in sync so the dashboard shell updates immediately. Reader `getMyProfile`, shared `ProfileForm`, and "Profile" nav links added. (`profiles` RLS already allows self-update.)
*   **Settings (Phase 2)** — patient/doctor/admin `/…/settings` pages with the two controls that are actually backed today: **change password** (`changePassword` → `supabase.auth.updateUser`) and **push notifications** (reusing the existing `PushSubscribe`). "Settings" nav links added. Deliberately excludes email/language/privacy toggles that nothing would honor yet (no email pipeline; i18n is out of scope) and account deletion (needs a `security definer` delete function / admin API).
*   **Forgot / reset password (Phase 2)** — `/forgot-password` (`requestPasswordReset` → `resetPasswordForEmail`) and `/reset-password` (`updatePassword` → `updateUser`, then sign out so the user logs in fresh). A new `/auth/callback` route handler exchanges the PKCE `code` for a session (also fixes email-confirmation links generally). The login page's dead "Forgot password? Contact support." is now a real link, with a post-reset success banner. Email enumeration avoided (always reports "sent").
*   **Server-side input validation (Phase 2)** — a small shared `lib/validate.ts` (required / maxLen / oneOf / isEmail / minPassword / firstError, no schema dependency) now guards the user-input write actions at the trust boundary: chat messages (non-empty, ≤4000, known sender), appointment reason (≤1000), prescription diagnosis/notes/medicine-count caps, profile field caps, and server-side sign-up email/password/name checks (previously client-only). Prevents unbounded-text bloat/abuse and untrusted-client writes.

*   **Booking — post-booking & policies (Phase 2)** — patients can now **cancel** and **reschedule** their own appointments from the appointments dashboard (`PatientAppointmentActions` → `cancelMyAppointment` / `rescheduleAppointment`), each notifying the doctor; booking confirmation now offers a **calendar invite (.ics)** download and a **booking reference number** (`lib/ics.ts`); the payment step requires an explicit **fee-acknowledgement** before confirming. See §4.1.1 for the full booking spec and remaining gaps (real payments, waiting list, reminders, timezones, rate limiting).

*   **Chat — realtime UX (Phase 2)** — the doctor↔patient chat gained **auto-scroll** to the newest message, **typing indicators** (Realtime broadcast in live mode, simulated in mock), **doctor quick-reply templates**, and **conversation search** (`components/ChatClient.tsx`). See §4.1.3 for the full chat spec and remaining gaps (attachments, read receipts, pagination, retention, encryption).

*   **Medical records — file storage (Phase 2)** — patients can upload lab reports/scans/etc. (Supabase Storage `medical-records` bucket, user-id-scoped upload paths) from the records page and attach documents during booking; records list gained real view/download links (`0010_medical_records_files.sql`, `lib/actions/records.ts`, `components/UploadRecordButton.tsx`). See §4.1.5 for remaining gaps (private bucket + signed URLs for PHI, license uploads, doctor-side access).

**🟡 Partially done**
*   The standalone (no-`appointmentId`) `/doctor/prescriptions` builder is still a demo preview hardcoded to "Dr. Anaya Rao"; the client-side PDF download preview likewise uses the demo name.

**🔴 Not started (unchanged from the audit)**
*   Payments, role-aware RLS, file storage, social login, pagination / server-side search, real LLM assistant, admin content management, real analytics, paid TURN.
*   **Validation — remaining:** the current guards are hand-rolled and server-only; adopt Zod with schemas shared client+server if validation grows complex or richer field-level client errors are wanted.
*   **Settings — remaining pieces:** email-notification preferences (needs an email pipeline first), account deletion (needs a `security definer` RPC or admin API), language/privacy (i18n is out of scope).


## 2. Goals and Objectives

The primary goal of this product development effort is to transform the Aria Health application from a high-fidelity prototype into a production-ready, secure, and scalable telemedicine platform capable of supporting real patient care. This will be achieved by focusing on the following key objectives:

*   **Ensure Clinical Integrity:** Implement robust mechanisms for persisting clinical actions (e.g., prescriptions, availability), accurate doctor identity resolution, and proper handling of medical records.
*   **Establish Financial Viability:** Integrate real payment processing capabilities, including charges, refunds, receipts, and doctor payouts.
*   **Guarantee Data Security and Privacy:** Implement role-aware Row Level Security (RLS) for Protected Health Information (PHI), secure file storage, and adhere to relevant compliance standards (e.g., HIPAA, GDPR).
*   **Enhance User Experience:** Address identified UX/UI inconsistencies, improve accessibility, and provide comprehensive profile and settings management for both patients and doctors.
*   **Improve Technical Robustness:** Implement server-side validation, comprehensive error handling, consistent loading states, and scalable solutions for search and data retrieval.
*   **Develop a Scalable Architecture:** Optimize for future growth by introducing pagination, server-side search, and efficient chat message loading.


## 3. User Stories / Personas

To ensure the Aria Health application meets the needs of its diverse user base, the following key personas and their associated user stories will guide the development process:

### 3.1. Patient Persona

**Name:** Rohan Mehta (example from audit)
**Role:** Patient seeking medical consultation and management of health records.

**User Stories:**
*   As a patient, I want to easily book and manage appointments with doctors, including rescheduling and cancellation options, so I can receive timely medical care.
*   As a patient, I want to securely pay for my consultations and receive receipts, ensuring a transparent financial process.
*   As a patient, I want to view and securely upload my medical records and reports, so I can maintain a comprehensive health history.
*   As a patient, I want to receive real-time notifications for appointment confirmations, reminders, and chat messages, so I stay informed.
*   As a patient, I want to have a secure and private video/audio consultation with my doctor, ensuring confidentiality and effective communication.
*   As a patient, I want to manage my personal profile, contact information, and privacy settings, so my data is accurate and controlled.
*   As a patient, I want to search and filter doctors by specialty, availability, and fees, so I can find the most suitable healthcare provider.

### 3.2. Doctor Persona

**Name:** Dr. Anaya Rao (example from audit)
**Role:** Healthcare provider offering consultations and managing patient care.

**User Stories:**
*   As a doctor, I want to manage my availability and accept/decline appointment requests efficiently, so I can optimize my schedule.
*   As a doctor, I want to conduct secure video/audio consultations with my patients, with options for screen sharing and recording (with consent), to provide comprehensive care.
*   As a doctor, I want to issue prescriptions that are accurately tied to specific patients and generate PDF versions, streamlining the prescription process.
*   As a doctor, I want to access a patient's medical history and records during a consultation, enabling informed decision-making.
*   As a doctor, I want to manage my professional profile, including license details, and personal settings, ensuring my information is current.
*   As a doctor, I want to receive real-time notifications for new appointment requests and patient messages, so I can respond promptly.
*   As a doctor, I want to view my earnings and manage payouts, ensuring accurate financial tracking.

### 3.3. Administrator Persona

**Role:** Platform administrator responsible for system oversight and management.

**User Stories:**
*   As an administrator, I want to verify doctor credentials and manage their status on the platform, ensuring compliance and quality of care.
*   As an administrator, I want to manage platform content and configurations, maintaining up-to-date information.
*   As an administrator, I want to access reports and analytics on platform usage, revenue, and doctor performance, to monitor and improve the service.


## 4. Functional Requirements

### 4.1. Core Telemedicine Functionality

#### 4.1.1 Appointment Booking System (Detailed)

The appointment booking system is a core user journey and must provide a smooth, intuitive, and trustworthy experience for patients while giving doctors full control over their schedule.

**Patient Booking Flow:**
1. **Doctor Discovery**
   - Patients can search doctors using server-side search with pagination.
   - Filters include: Specialty, Sub-specialty, Consultation Fee, Availability (Today/Tomorrow/This Week), Rating, Location (if applicable), Insurance Accepted, Language.
   - Display doctor cards with photo, name, title, rating, number of consultations, and "Book Now" button.

2. **Availability Viewing**
   - Real-time availability calendar (weekly view preferred, with daily slots).
   - Show available time slots in 15 or 30-minute intervals.
   - Clearly indicate doctor’s working hours, breaks, and blocked slots.
   - Support timezone handling (patient’s local time vs doctor’s time).

3. **Booking Form**
   - Selected date & time (pre-filled from availability).
   - Reason for visit / Chief complaint (textarea with common templates/suggestions).
   - Optional fields: Symptoms checklist, Upload relevant medical documents (before consultation).
   - Consultation type: Video, Audio, or Chat-only.
   - Patient must confirm they understand the consultation fee.

4. **Payment & Confirmation**
   - Seamless integration with payment gateway (Stripe/Razorpay) at time of booking.
   - Show clear fee breakdown (consultation fee + taxes).
   - Option for "Pay at Consultation" for select doctors (configurable).
   - Instant booking confirmation with calendar invite (.ics) download/link.
   - Booking reference number.

5. **Post-Booking Features**
   - Patient can view all upcoming/past appointments in a clean dashboard.
   - Reschedule (subject to doctor’s policy and availability).
   - Cancel appointment (with cancellation window and possible fee policy).
   - Join waiting list if desired slot is unavailable.

**Doctor-Side Appointment Management:**
- View all incoming appointment requests (pending, confirmed, completed, cancelled).
- Accept or decline requests with optional reason (for decline).
- Auto-approve option for trusted patients (configurable).
- Automatic calendar blocking once appointment is confirmed.
- Ability to add notes or mark as "No-Show".

**System Rules & Policies:**
- Minimum advance booking time (e.g., 2 hours).
- Cancellation policy: Free cancellation up to X hours before appointment; fee after that.
- Rescheduling allowed up to Y times per appointment.
- Double-booking prevention (real-time slot locking).
- Automatic reminders: 24 hours & 1 hour before appointment (email + in-app + push).

**Technical Requirements for Booking:**
- Server-side validation of all booking data using Zod.
- Optimistic UI updates with proper rollback on failure.
- Realtime updates (new booking requests appear instantly for doctors).
- Proper RLS policies to ensure patients can only see/modify their own bookings.
- Rate limiting on booking endpoints.

**Implementation status (updated 2026-07-14):** Booking wizard (mode → slot → details → payment), booking-slot double-booking dedup, doctor accept/decline, and realtime request delivery already shipped. Newly shipped: **patient cancel** (`cancelMyAppointment`) and **reschedule** (`rescheduleAppointment`) from the appointments dashboard with doctor notification; **calendar invite (.ics) download** and **booking reference number** on confirmation (`lib/ics.ts`); and a **fee-acknowledgement gate** before payment. Still open: real payment gateway, "Pay at Consultation", waiting list, auto-approve, no-show marking, timezone conversion, automatic reminders, Zod migration, rate limiting, and server-side paginated doctor search/filters.

#### 4.1.2 Real-time Video/Audio Consultation
*   The system shall support secure, peer-to-peer video and audio consultations between patients and doctors.
*   The system shall replace the free public TURN server with a paid/authenticated service (e.g., Twilio, Cloudflare, coturn) with short-lived credentials.
*   The system shall implement consent-based recording functionality for consultations.
*   The system shall display a network quality indicator during consultations.
*   The system shall support screen sharing during consultations.
*   The system shall provide a waiting room feature for patients before consultations.

#### 4.1.3 Realtime Chat Implementation (Detailed)

The realtime chat system is a core communication channel between patients and doctors, available both **during consultations** and **asynchronously** (Chat-only appointments or follow-ups).

**Key Features:**

**1. Core Chat Functionality**
- Real-time bidirectional messaging using Supabase Realtime.
- Support for text messages, emojis, and rich text formatting.
- File and image attachments (via Supabase Storage).
- Message read receipts (single & double ticks).
- Typing indicators (e.g., "Dr. Anaya is typing...").
- Message threading / replies (optional but recommended).

**2. Chat Contexts**
- **Pre-consultation chat**: For appointment-related questions before the call.
- **In-consultation chat**: Sidebar chat available during Video/Audio calls.
- **Post-consultation chat**: Continued conversation for follow-ups.
- **Chat-only appointments**: Full consultation happens entirely via chat.

**3. UI/UX Requirements**
- Clean, modern chat interface (similar to WhatsApp/Telegram but medical-grade).
- Message bubbles aligned left (doctor) / right (patient).
- Timestamps and date separators.
- Scroll to bottom on new messages.
- Message status indicators (sending, sent, delivered, read).
- Ability to view attached images/documents in full screen.
- Search within chat history.

**4. Doctor Features**
- Access to all patient chats from dashboard.
- Ability to send prescriptions directly from chat.
- Mark chat as "Resolved" or escalate to video/audio.
- Quick reply templates (e.g., common instructions, follow-up requests).

**5. Patient Features**
- View chat history with all their doctors.
- Easy access to chat from appointment card.
- Notification when doctor replies.

**6. Technical Implementation Details**

- **Backend**: Supabase Realtime (PostgreSQL + Broadcast + Presence).
- **Database Schema**:
  - `chat_threads` table (one thread per patient-doctor pair or per appointment).
  - `chat_messages` table with columns: `id`, `thread_id`, `sender_id`, `receiver_id`, `message`, `type` (text/file), `file_url`, `read_at`, `created_at`.
- **Row Level Security (RLS)**: Strict policies so users can only access threads they are part of.
- **Real-time Subscriptions**:
  - Subscribe to new messages in active thread.
  - Subscribe to thread list updates (unread counts).
- **Pagination**: Load messages in chunks (e.g., 50 at a time) with infinite scroll.
- **Optimistic Updates**: Messages appear instantly on send, with rollback on failure.
- **File Handling**: Upload to Supabase Storage → store secure URL in message.
- **Typing Indicators**: Use Supabase Presence or a dedicated `typing_status` table.
- **Offline Support**: Queue messages locally and sync when back online (optional for Phase 2).

**7. Security & Compliance**
- All messages containing PHI must be encrypted at rest.
- Audit logging for sensitive messages.
- Ability for users to delete messages (soft delete).
- Message retention policy (e.g., auto-delete after X months).

**8. Notifications**
- In-app + push + email notifications for new messages.
- Mute chat option.

**Implementation status (updated 2026-07-14):** Realtime bidirectional messaging (Supabase Realtime postgres_changes), left/right message bubbles, per-message timestamps, unread counts/badges, optimistic send with echo dedupe, and the mock-mode canned-reply demo already shipped. Newly shipped: **auto-scroll to newest message** on send/receive/thread-switch; **typing indicators** (Realtime broadcast on the shared channel in live mode, simulated during the mock reply); **doctor quick-reply templates** (one tap fills the composer); and **conversation search** over loaded threads (`components/ChatClient.tsx`). Still open: file/image attachments (needs Supabase Storage), read receipts / delivered ticks (needs a `read_at` column + read-status realtime path), message pagination/infinite scroll, threading/replies, soft delete + retention, mute, offline queue, at-rest PHI encryption + audit logging, and email notifications. Note the current demo-permissive RLS (`0002_chat.sql`) must be replaced with participant-scoped policies before production.

#### 4.1.4 Prescription Management
*   The system shall enable doctors to issue prescriptions that are accurately tied to specific patient IDs.
*   The system shall generate prescriptions in PDF format.
*   The system shall integrate with pharmacy or e-prescription services for direct prescription delivery.
*   The system shall ensure that the `issuePrescription` action persists and is not tied to hardcoded doctor/patient names.

#### 4.1.5 Medical Records, Doctor Search & AI Assistant
*(Chat is now specified in detail in §4.1.3.)*
*   **Medical Records Management:**
    *   The system shall provide secure file storage (e.g., Supabase Storage) for patient medical records, license documents, and report uploads.
    *   The system shall allow patients to view, download, and upload their medical records and reports.
    *   The system shall allow doctors to view patient medical history and records during consultations.
    *   **Implementation status (updated 2026-07-14):** Patients can **upload** records (title + type + file) from the records page and **attach documents during booking**, stored in a `medical-records` Supabase Storage bucket (uploads namespaced by user id; insert policy scopes each user to their own folder) with a `medical_records` row; the records list now offers real **view/download** links (`0010_medical_records_files.sql`, `lib/actions/records.ts`, `components/UploadRecordButton.tsx`). Still open: the bucket is **public** (PHI needs a private bucket + signed URLs — pairs with role-aware RLS), doctor license-document uploads, and doctor-side access to a patient's records during a consultation.
*   **Doctor Search & Filter:**
    *   The system shall implement server-side, paginated search for doctors by name, specialty, and tags.
    *   The system shall allow filtering doctors by specialty, mode, fee, rating, geographical location, and insurance providers.
*   **AI Health Assistant:**
    *   The system shall replace the current canned keyword branching with a real LLM-backed AI assistant.
    *   The AI assistant shall include safety guardrails for medical advice.


### 4.2. User Management

*   **Authentication:**
    *   The system shall implement a fully functional "Forgot Password" and "Reset Password" flow.
    *   The system shall provide email verification during registration and password reset.
    *   The system shall integrate with social login providers (e.g., Google, Apple).
*   **Profile Management (Patient & Doctor):**
    *   The system shall allow users (patients and doctors) to view and edit their personal information, including avatar, contact details, and password.
    *   The system shall allow doctors to upload and manage their license documents.
    *   The system shall allow patients to manage their medical history.
    *   The system shall ensure that patient onboarding step-2 data (DOB, gender, phone, concerns) is persisted.
*   **Settings Page:**
    *   The system shall provide a dedicated settings page for users to manage notification preferences, privacy settings, language, and account deletion.
*   **Notifications:**
    *   The system shall implement real-time notifications with mark-as-read functionality and unread counts.
    *   The system shall support push and email notifications.
    *   The system shall trigger notifications based on specific events (e.g., new message, appointment reminder).


### 4.3. Administrative Features

*   **Doctor Verification:**
    *   The system shall allow administrators to approve or reject doctor verification requests, with the decisions persisting in the database.
    *   The system shall ensure the `decideVerification` action is correctly invoked and persists changes.
*   **Content Management:**
    *   The system shall provide functionality for administrators to manage platform content (e.g., static forms, articles) via a database-backed system, or remove static content management if not required.
*   **Reporting & Analytics:**
    *   The system shall provide real-time aggregates and analytics for admin dashboards, including revenue, doctor earnings, and platform usage.


### 4.4. Integrations

*   **Payment Gateway:**
    *   The system shall integrate with a payment gateway (e.g., Stripe, Razorpay) to handle real charges, refunds, receipts, and doctor payouts.
*   **Calendar Integration:**
    *   The system shall integrate with external calendar applications for appointment synchronization.
*   **Pharmacy/e-Rx Integration:**
    *   The system shall integrate with pharmacy or e-prescription services.
*   **Wearables/Vitals Integration (Future):**
    *   The system may integrate with wearables and vitals devices to populate patient dashboard data.


## 5. Non-Functional Requirements

### 5.1. Performance

*   The system shall provide fast response times for all user interactions, with critical operations (e.g., appointment booking, consultation initiation) completing within 2 seconds under normal load.
*   The system shall implement server-side search and pagination for doctor listings and chat messages to ensure efficient data retrieval as data volume grows.
*   The system shall utilize efficient data loading strategies (e.g., `@tanstack/react-query` or RSC streaming with Suspense) to improve perceived speed and reduce blocking.


### 5.2. Security and Compliance

*   The system shall implement robust, role-aware Row Level Security (RLS) policies to ensure data isolation and prevent unauthorized access to Protected Health Information (PHI).
*   The system shall enforce server-side input validation (e.g., using Zod schemas) for all actions to prevent malicious data injection and ensure data integrity.
*   The system shall move TURN server credentials to a paid/authenticated service (e.g., Twilio, Cloudflare, coturn) and use short-lived, dynamically generated credentials.
*   The system shall implement rate limiting for API endpoints to prevent abuse and denial-of-service attacks.
*   The system shall implement CSRF protection beyond Next.js defaults.
*   The system shall maintain comprehensive audit logs for all critical user and administrative actions.
*   The system shall comply with relevant healthcare regulations such as HIPAA (for US) and GDPR (for EU), including data encryption at rest and in transit, consent management, and data retention policies.
*   The system shall ensure that `getOrCreatePatientThread`'s `.or()` filter string interpolation is audited for potential filter-injection vulnerabilities.


### 5.3. Scalability

*   The system shall support a growing number of users (patients, doctors, administrators) and concurrent consultations without degradation in performance.
*   The system shall implement pagination for all lists (e.g., doctor search results, chat messages, appointment history) to handle large datasets efficiently.
*   The system shall utilize appropriate database indexing strategies to optimize query performance.
*   The system shall be designed to allow for horizontal scaling of its backend services.


### 5.4. Usability and UI/UX

*   The system shall present a premium, calming healthcare aesthetic (teal + deep navy palette) at Hallmark-level design quality. *(Note: the current shipped design system is the PlayStation-inspired blue theme in `DESIGN-playstation.md`; adopting the teal + navy palette is a design-language change tracked here, not yet implemented in code.)*
*   The booking flow specifically shall be clear, trustworthy, and low-friction (explicit fee acknowledgement, visible cancellation policy, booking reference, calendar invite).
*   The system shall maintain the existing high-quality visual consistency, typography, spacing, and animations.
*   The system shall replace all emoji used as UI icons with a consistent line-icon set.
*   The system shall address accessibility gaps, including providing labels for icons, using multi-modal status indicators (not just color), ensuring proper focus management for modals, and providing visible value labeling for range sliders.
*   The system shall unify inconsistent UI elements, such as the send buttons.
*   The system shall implement consistent loading skeletons and error/empty states across the application.
*   The system shall provide clear and informative user-visible error messages and toasts.


### 5.5. Maintainability

*   The codebase shall adhere to clean architecture principles with clear separation of concerns (e.g., read layer, write actions).
*   The system shall eliminate hardcoded identities (e.g., doctor IDs) and replace them with dynamic resolution mechanisms.
*   The system shall remove `as string` casts that mask potential `undefined` values and introduce type-safe practices.
*   The system shall consolidate duplicated code, particularly for time-formatting utilities.
*   The system shall implement error boundaries and robust error handling mechanisms to prevent unhandled exceptions.
*   The system shall ensure all actions are properly wired and invoked from their respective UI elements.


## 6. Out of Scope

The following items are explicitly out of scope for the immediate next phase of development (Phase 1 & 2) but may be considered for future iterations:

*   Advanced AI diagnostic capabilities (beyond a conversational assistant).
*   Integration with physical medical hardware (e.g., remote stethoscopes).
*   Complex insurance claims processing and direct billing to insurance providers.
*   Multi-language support (i18n) and localization.
*   Dark mode toggle.


## 7. Future Considerations / Roadmap

The development of Aria Health will follow a phased approach:

*   **Phase 1: Harden the Demo (Immediate):** **Complete (see §1.4).** Doctor-id resolution, availability wiring, prescription PDF/issuance + patient tie, admin verification persistence, realtime notifications, interaction feedback, route-level loading/error boundaries, and mobile bundle performance are all done. The app is now a flawless demo; remaining gaps are Phase 2+ product work.
*   **Phase 2: Make it Real (Short-term):** Implement core production features including Role-Aware RLS, payment integration, file storage, comprehensive profile/settings management, and server-side validation.
*   **Phase 3: Compliance & Scale (Medium-term):** Address HIPAA/GDPR compliance, implement real notifications/email, introduce pagination and server-side search, integrate a real AI assistant, and enhance analytics.
*   **Phase 4: Differentiate (Long-term):** Integrate advanced features such as lab/pharmacy services, insurance integration, wearables connectivity, and care-team/referral management.


## 8. Open Questions / Assumptions

*   **Assumption:** The existing Supabase infrastructure will be scaled to meet production demands.
*   **Assumption:** A suitable payment gateway (e.g., Stripe) will be selected and approved for integration.
*   **Question:** What specific compliance standards (e.g., HIPAA, GDPR, local regulations) must be met before launch?
*   **Question:** Which third-party service will be used for the authenticated TURN server?
*   **Question:** What is the specific LLM provider and model to be used for the AI Health Assistant?

