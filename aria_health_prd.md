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

*   **Real-time Video/Audio Consultation:**
    *   The system shall support secure, peer-to-peer video and audio consultations between patients and doctors.
    *   The system shall replace the free public TURN server with a paid/authenticated service (e.g., Twilio, Cloudflare, coturn) with short-lived credentials.
    *   The system shall implement consent-based recording functionality for consultations.
    *   The system shall display a network quality indicator during consultations.
    *   The system shall support screen sharing during consultations.
    *   The system shall provide a waiting room feature for patients before consultations.
*   **Appointment Management:**
    *   The system shall allow patients to book, reschedule, and cancel appointments with doctors.
    *   The system shall implement policies for appointment cancellation and rescheduling.
    *   The system shall send automated reminders for upcoming appointments to both patients and doctors.
    *   The system shall integrate with calendar applications (.ics) for appointment synchronization.
    *   The system shall ensure that `saveAvailability` action is wired to the UI and persists doctor availability changes.
    *   The system shall correctly resolve the `doctorId` for availability management.
*   **Prescription Management:**
    *   The system shall enable doctors to issue prescriptions that are accurately tied to specific patient IDs.
    *   The system shall generate prescriptions in PDF format.
    *   The system shall integrate with pharmacy or e-prescription services for direct prescription delivery.
    *   The system shall ensure that the `issuePrescription` action persists and is not tied to hardcoded doctor/patient names.
*   **Medical Records Management:**
    *   The system shall provide secure file storage (e.g., Supabase Storage) for patient medical records, license documents, and report uploads.
    *   The system shall allow patients to view, download, and upload their medical records and reports.
    *   The system shall allow doctors to view patient medical history and records during consultations.
*   **Chat Functionality:**
    *   The system shall support real-time chat between patients and doctors.
    *   The system shall implement read receipts, typing indicators, and attachment capabilities within the chat.
    *   The system shall implement pagination for chat messages to improve scalability.
    *   The system shall replace canned keyword responses in mock mode with real-person interactions or an LLM-backed AI assistant.
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

*   **Phase 1: Harden the Demo (Immediate):** Focus on fixing critical bugs (e.g., doctor-id resolution), wiring unwired actions (availability, verification), adding loading/error states, and removing debug code.
*   **Phase 2: Make it Real (Short-term):** Implement core production features including Role-Aware RLS, payment integration, file storage, comprehensive profile/settings management, and server-side validation.
*   **Phase 3: Compliance & Scale (Medium-term):** Address HIPAA/GDPR compliance, implement real notifications/email, introduce pagination and server-side search, integrate a real AI assistant, and enhance analytics.
*   **Phase 4: Differentiate (Long-term):** Integrate advanced features such as lab/pharmacy services, insurance integration, wearables connectivity, and care-team/referral management.


## 8. Open Questions / Assumptions

*   **Assumption:** The existing Supabase infrastructure will be scaled to meet production demands.
*   **Assumption:** A suitable payment gateway (e.g., Stripe) will be selected and approved for integration.
*   **Question:** What specific compliance standards (e.g., HIPAA, GDPR, local regulations) must be met before launch?
*   **Question:** Which third-party service will be used for the authenticated TURN server?
*   **Question:** What is the specific LLM provider and model to be used for the AI Health Assistant?

