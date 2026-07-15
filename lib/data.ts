/* -------------------------------------------------------------------------
   Mock data for Aria Health. Purely client-side dummy data — no backend.
   ---------------------------------------------------------------------- */

export type Specialty = {
  slug: string;
  name: string;
  icon: string; // emoji stand-in for a premium line icon
  doctors: number;
  blurb: string;
};

export type Doctor = {
  id: string;
  /** Linked auth profile id — only real (registered) doctors have one. */
  profile_id?: string;
  name: string;
  specialty: string;
  specialtySlug: string;
  qualifications: string;
  experience: number;
  rating: number;
  reviews: number;
  fee: number;
  location: string;
  languages: string[];
  photo: string; // gradient seed color
  initials: string;
  verified: boolean;
  nextSlot: string;
  modes: ("Video" | "Audio" | "Chat" | "In-person")[];
  about: string;
  tags: string[];
};

export type Review = {
  id: string;
  patient: string;
  initials: string;
  rating: number;
  date: string;
  body: string;
  doctorId?: string;
};

export type Appointment = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  date: string;
  time: string;
  mode: "Video" | "Audio" | "Chat" | "In-person";
  status: "Upcoming" | "Completed" | "Pending" | "Cancelled";
  fee: number;
  reason: string;
};

export type Prescription = {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  diagnosis: string;
  medicines: { name: string; dose: string; frequency: string; duration: string }[];
  tests: string[];
  notes: string;
};

export type MedicalRecord = {
  id: string;
  title: string;
  type: "Lab Report" | "Prescription" | "Scan" | "Discharge Summary" | "Vaccination";
  date: string;
  by: string;
  size: string;
  /** Download/view URL for uploaded files; absent for seeded demo rows. */
  url?: string;
};

export type ServiceItem = {
  title: string;
  desc: string;
  icon: string;
};

/** One row of the admin audit trail (see supabase 0016_audit_log.sql). */
export type AuditEntry = {
  id: string;
  actor: string;
  actorRole?: string;
  action: string;
  target: string;
  meta: Record<string, unknown>;
  time: string;
  createdAt?: string;
};

/** One entry in a patient's recent clinical timeline. */
export type PatientHistory = { date: string; title: string; by: string };

/** A patient on a doctor's panel (doctor portal → Patient records). */
export type Patient = {
  id: string;
  doctorId: string;
  name: string;
  initials: string;
  age: number;
  gender: string;
  condition: string;
  visits: number;
  lastVisit: string;
  bloodGroup: string;
  allergies: string;
  height: string;
  weight: string;
  color: string;
  history: PatientHistory[];
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: "appointment" | "prescription" | "payment" | "system";
  unread: boolean;
  /** UTC ISO timestamp; the UI recomputes the relative "time" label from this. */
  createdAt?: string;
  /** The appointment this notification is about, when applicable. */
  appointmentId?: string;
};

/* ---- Specialties ------------------------------------------------------ */
export const specialties: Specialty[] = [
  { slug: "cardiology", name: "Cardiology", icon: "🫀", doctors: 128, blurb: "Heart & vascular care" },
  { slug: "dermatology", name: "Dermatology", icon: "🧴", doctors: 96, blurb: "Skin, hair & nails" },
  { slug: "pediatrics", name: "Pediatrics", icon: "🧸", doctors: 142, blurb: "Care for children" },
  { slug: "neurology", name: "Neurology", icon: "🧠", doctors: 74, blurb: "Brain & nervous system" },
  { slug: "orthopedics", name: "Orthopedics", icon: "🦴", doctors: 88, blurb: "Bones & joints" },
  { slug: "psychiatry", name: "Mental Health", icon: "🌿", doctors: 110, blurb: "Therapy & psychiatry" },
  { slug: "gynecology", name: "Gynecology", icon: "🌺", doctors: 102, blurb: "Women's health" },
  { slug: "general", name: "General Physician", icon: "🩺", doctors: 210, blurb: "Everyday concerns" },
  { slug: "dentistry", name: "Dentistry", icon: "🦷", doctors: 67, blurb: "Oral & dental care" },
  { slug: "ophthalmology", name: "Eye Care", icon: "👁️", doctors: 54, blurb: "Vision & eye health" },
  { slug: "ent", name: "ENT", icon: "👂", doctors: 61, blurb: "Ear, nose & throat" },
  { slug: "nutrition", name: "Nutrition", icon: "🥗", doctors: 45, blurb: "Diet & wellness" },
];

const seedColors = [
  "#0070d1", "#1f6f5c", "#7a4bd1", "#c25b2e", "#2e7cc2",
  "#b03a6a", "#3a8f7a", "#5b6bd1", "#c28b2e", "#2eb0a0",
];

/* ---- Doctors ---------------------------------------------------------- */
export const doctors: Doctor[] = [
  {
    id: "dr-anaya-rao",
    name: "Dr. Anaya Rao",
    specialty: "Cardiology",
    specialtySlug: "cardiology",
    qualifications: "MD, DM (Cardiology)",
    experience: 14,
    rating: 4.9,
    reviews: 512,
    fee: 45,
    location: "Bengaluru, IN",
    languages: ["English", "Hindi", "Kannada"],
    photo: seedColors[0],
    initials: "AR",
    verified: true,
    nextSlot: "Today, 4:30 PM",
    modes: ["Video", "Audio", "In-person"],
    about:
      "Interventional cardiologist focused on preventive heart care and remote monitoring. Believes the best consultation begins with a real conversation.",
    tags: ["Heart Failure", "Hypertension", "Preventive Care"],
  },
  {
    id: "dr-liam-fischer",
    name: "Dr. Liam Fischer",
    specialty: "Dermatology",
    specialtySlug: "dermatology",
    qualifications: "MBBS, MD (Dermatology)",
    experience: 9,
    rating: 4.8,
    reviews: 388,
    fee: 38,
    location: "Berlin, DE",
    languages: ["English", "German"],
    photo: seedColors[1],
    initials: "LF",
    verified: true,
    nextSlot: "Today, 6:00 PM",
    modes: ["Video", "Chat"],
    about:
      "Clinical and cosmetic dermatology with a focus on acne, eczema and teledermatology triage using patient-uploaded photos.",
    tags: ["Acne", "Eczema", "Skin Cancer Screening"],
  },
  {
    id: "dr-sofia-mendes",
    name: "Dr. Sofia Mendes",
    specialty: "Pediatrics",
    specialtySlug: "pediatrics",
    qualifications: "MD (Pediatrics)",
    experience: 11,
    rating: 4.9,
    reviews: 640,
    fee: 32,
    location: "Lisbon, PT",
    languages: ["English", "Portuguese", "Spanish"],
    photo: seedColors[2],
    initials: "SM",
    verified: true,
    nextSlot: "Tomorrow, 10:00 AM",
    modes: ["Video", "Audio", "Chat"],
    about:
      "Pediatrician caring for newborns to teens. Calm, parent-friendly guidance for fevers, growth, sleep and vaccinations.",
    tags: ["Newborn Care", "Vaccination", "Growth"],
  },
  {
    id: "dr-noah-kim",
    name: "Dr. Noah Kim",
    specialty: "Neurology",
    specialtySlug: "neurology",
    qualifications: "MD, DM (Neurology)",
    experience: 16,
    rating: 4.7,
    reviews: 274,
    fee: 55,
    location: "Seoul, KR",
    languages: ["English", "Korean"],
    photo: seedColors[3],
    initials: "NK",
    verified: true,
    nextSlot: "Tomorrow, 2:15 PM",
    modes: ["Video", "In-person"],
    about:
      "Neurologist specialising in migraine, epilepsy and sleep disorders with a data-driven, patient-education approach.",
    tags: ["Migraine", "Epilepsy", "Sleep"],
  },
  {
    id: "dr-maya-okonkwo",
    name: "Dr. Maya Okonkwo",
    specialty: "Mental Health",
    specialtySlug: "psychiatry",
    qualifications: "MD (Psychiatry)",
    experience: 8,
    rating: 4.9,
    reviews: 421,
    fee: 60,
    location: "London, UK",
    languages: ["English"],
    photo: seedColors[4],
    initials: "MO",
    verified: true,
    nextSlot: "Today, 7:30 PM",
    modes: ["Video", "Audio"],
    about:
      "Psychiatrist and therapist supporting anxiety, burnout and mood. A safe, unhurried space that begins with one conversation.",
    tags: ["Anxiety", "Depression", "Burnout"],
  },
  {
    id: "dr-raj-patel",
    name: "Dr. Raj Patel",
    specialty: "Orthopedics",
    specialtySlug: "orthopedics",
    qualifications: "MS (Ortho)",
    experience: 18,
    rating: 4.8,
    reviews: 356,
    fee: 48,
    location: "Mumbai, IN",
    languages: ["English", "Hindi", "Gujarati"],
    photo: seedColors[5],
    initials: "RP",
    verified: true,
    nextSlot: "Today, 5:45 PM",
    modes: ["Video", "In-person"],
    about:
      "Orthopedic surgeon focused on sports injuries, joint pain and post-operative rehab guidance over video.",
    tags: ["Sports Injury", "Joint Pain", "Rehab"],
  },
  {
    id: "dr-elena-rossi",
    name: "Dr. Elena Rossi",
    specialty: "Gynecology",
    specialtySlug: "gynecology",
    qualifications: "MD (OBGYN)",
    experience: 13,
    rating: 4.9,
    reviews: 489,
    fee: 42,
    location: "Milan, IT",
    languages: ["English", "Italian"],
    photo: seedColors[6],
    initials: "ER",
    verified: true,
    nextSlot: "Tomorrow, 11:30 AM",
    modes: ["Video", "Audio", "In-person"],
    about:
      "Gynecologist supporting reproductive health, pregnancy and menopause with warmth and evidence-based care.",
    tags: ["Pregnancy", "PCOS", "Menopause"],
  },
  {
    id: "dr-david-chen",
    name: "Dr. David Chen",
    specialty: "General Physician",
    specialtySlug: "general",
    qualifications: "MBBS, MRCGP",
    experience: 10,
    rating: 4.8,
    reviews: 712,
    fee: 25,
    location: "Singapore, SG",
    languages: ["English", "Mandarin"],
    photo: seedColors[7],
    initials: "DC",
    verified: true,
    nextSlot: "Today, 3:15 PM",
    modes: ["Video", "Audio", "Chat"],
    about:
      "Family physician for everyday concerns — fever, infections, chronic condition follow-ups and second opinions.",
    tags: ["Fever", "Diabetes", "Follow-up"],
  },
];

/* ---- Featured subset -------------------------------------------------- */
export const featuredDoctors = doctors.slice(0, 4);

/* ---- Reviews ---------------------------------------------------------- */
export const reviews: Review[] = [
  {
    id: "rv1",
    patient: "Priya S.",
    initials: "PS",
    rating: 5,
    date: "2 weeks ago",
    body:
      "The whole thing felt human. I described my symptoms, uploaded a photo, and had a video call within the hour. Prescription arrived on the app before I hung up.",
    doctorId: "dr-liam-fischer",
  },
  {
    id: "rv2",
    patient: "Marcus T.",
    initials: "MT",
    rating: 5,
    date: "1 month ago",
    body:
      "I was nervous about talking to a psychiatrist online. Dr. Okonkwo made it feel like a conversation with someone who genuinely cared. Booking again.",
    doctorId: "dr-maya-okonkwo",
  },
  {
    id: "rv3",
    patient: "Aisha K.",
    initials: "AK",
    rating: 5,
    date: "3 weeks ago",
    body:
      "My daughter had a fever at midnight. Dr. Mendes was calm, thorough and reassuring. Aria Health saved us a stressful ER trip.",
    doctorId: "dr-sofia-mendes",
  },
  {
    id: "rv4",
    patient: "Jonas W.",
    initials: "JW",
    rating: 4,
    date: "2 months ago",
    body:
      "Clean, fast and premium. Records, prescriptions and lab bookings all live in one place. This is what healthcare software should feel like.",
  },
];

/* ---- Appointments (patient view) ------------------------------------- */
export const appointments: Appointment[] = [
  {
    id: "apt-1001",
    doctorId: "dr-anaya-rao",
    doctorName: "Dr. Anaya Rao",
    specialty: "Cardiology",
    patientName: "You",
    date: "Today",
    time: "4:30 PM",
    mode: "Video",
    status: "Upcoming",
    fee: 45,
    reason: "Blood pressure follow-up",
  },
  {
    id: "apt-1002",
    doctorId: "dr-david-chen",
    doctorName: "Dr. David Chen",
    specialty: "General Physician",
    patientName: "You",
    date: "Jul 12",
    time: "11:00 AM",
    mode: "Audio",
    status: "Upcoming",
    fee: 25,
    reason: "Recurring cough",
  },
  {
    id: "apt-0994",
    doctorId: "dr-liam-fischer",
    doctorName: "Dr. Liam Fischer",
    specialty: "Dermatology",
    patientName: "You",
    date: "Jun 28",
    time: "6:00 PM",
    mode: "Video",
    status: "Completed",
    fee: 38,
    reason: "Skin rash review",
  },
  {
    id: "apt-0987",
    doctorId: "dr-maya-okonkwo",
    doctorName: "Dr. Maya Okonkwo",
    specialty: "Mental Health",
    patientName: "You",
    date: "Jun 15",
    time: "7:30 PM",
    mode: "Video",
    status: "Completed",
    fee: 60,
    reason: "Therapy session",
  },
];

/* ---- Doctor-side incoming appointment requests ----------------------- */
export const appointmentRequests: Appointment[] = [
  {
    id: "req-2001",
    doctorId: "dr-anaya-rao",
    doctorName: "Dr. Anaya Rao",
    specialty: "Cardiology",
    patientName: "Rohan Mehta",
    date: "Today",
    time: "4:30 PM",
    mode: "Video",
    status: "Pending",
    fee: 45,
    reason: "Chest tightness, family history of CAD",
  },
  {
    id: "req-2002",
    doctorId: "dr-anaya-rao",
    doctorName: "Dr. Anaya Rao",
    specialty: "Cardiology",
    patientName: "Grace Lin",
    date: "Today",
    time: "5:15 PM",
    mode: "Audio",
    status: "Pending",
    fee: 45,
    reason: "Palpitations after exercise",
  },
  {
    id: "req-2003",
    doctorId: "dr-anaya-rao",
    doctorName: "Dr. Anaya Rao",
    specialty: "Cardiology",
    patientName: "Ahmed Farah",
    date: "Tomorrow",
    time: "10:00 AM",
    mode: "Video",
    status: "Upcoming",
    fee: 45,
    reason: "Post-angioplasty follow-up",
  },
];

/* ---- Prescriptions ---------------------------------------------------- */
export const prescriptions: Prescription[] = [
  {
    id: "rx-5001",
    doctorName: "Dr. Anaya Rao",
    specialty: "Cardiology",
    date: "Jul 8, 2026",
    diagnosis: "Stage 1 Hypertension",
    medicines: [
      { name: "Amlodipine", dose: "5 mg", frequency: "Once daily", duration: "30 days" },
      { name: "Aspirin", dose: "75 mg", frequency: "Once daily", duration: "30 days" },
    ],
    tests: ["Lipid Profile", "ECG", "Kidney Function Test"],
    notes:
      "Reduce salt intake, 30 min brisk walk daily. Monitor BP twice a week and log in the app. Follow-up in 4 weeks.",
  },
  {
    id: "rx-4988",
    doctorName: "Dr. Liam Fischer",
    specialty: "Dermatology",
    date: "Jun 28, 2026",
    diagnosis: "Mild Atopic Dermatitis",
    medicines: [
      { name: "Hydrocortisone 1%", dose: "Apply thin layer", frequency: "Twice daily", duration: "10 days" },
      { name: "Cetirizine", dose: "10 mg", frequency: "At night", duration: "7 days" },
    ],
    tests: [],
    notes: "Fragrance-free moisturiser twice daily. Avoid hot showers. Photo review in 2 weeks.",
  },
];

/* ---- Medical records -------------------------------------------------- */
export const medicalRecords: MedicalRecord[] = [
  { id: "mr1", title: "Complete Blood Count", type: "Lab Report", date: "Jul 2, 2026", by: "Aria Labs", size: "1.2 MB" },
  { id: "mr2", title: "Lipid Profile", type: "Lab Report", date: "Jun 20, 2026", by: "Aria Labs", size: "0.8 MB" },
  { id: "mr3", title: "Chest X-Ray", type: "Scan", date: "Jun 10, 2026", by: "City Imaging", size: "4.4 MB" },
  { id: "mr4", title: "Hypertension Rx", type: "Prescription", date: "Jul 8, 2026", by: "Dr. Anaya Rao", size: "0.3 MB" },
  { id: "mr5", title: "COVID-19 Booster", type: "Vaccination", date: "Jan 14, 2026", by: "Aria Clinic", size: "0.2 MB" },
  { id: "mr6", title: "ENT Discharge Note", type: "Discharge Summary", date: "Dec 3, 2025", by: "Metro Hospital", size: "0.6 MB" },
];

/* ---- Doctor's patient panel (doctor portal) --------------------------- */
export const patients: Patient[] = [
  {
    id: "pat-rohan",
    doctorId: "dr-anaya-rao",
    name: "Rohan Mehta",
    initials: "RM",
    age: 34,
    gender: "Male",
    condition: "Hypertension",
    visits: 6,
    lastVisit: "Today",
    bloodGroup: "B+",
    allergies: "Penicillin",
    height: "178 cm",
    weight: "82 kg",
    color: "#7a4bd1",
    history: [
      { date: "Jul 8, 2026", title: "Hypertension follow-up", by: "You" },
      { date: "Jun 2, 2026", title: "Lipid profile review", by: "You" },
      { date: "Apr 18, 2026", title: "Chest X-ray — clear", by: "City Imaging" },
    ],
  },
  {
    id: "pat-grace",
    doctorId: "dr-anaya-rao",
    name: "Grace Lin",
    initials: "GL",
    age: 41,
    gender: "Female",
    condition: "Palpitations",
    visits: 3,
    lastVisit: "Today",
    bloodGroup: "O+",
    allergies: "None",
    height: "165 cm",
    weight: "60 kg",
    color: "#2e7cc2",
    history: [
      { date: "Jul 12, 2026", title: "Palpitations assessment", by: "You" },
      { date: "Jun 20, 2026", title: "Holter monitor fitted", by: "Aria Labs" },
    ],
  },
  {
    id: "pat-ahmed",
    doctorId: "dr-anaya-rao",
    name: "Ahmed Farah",
    initials: "AF",
    age: 58,
    gender: "Male",
    condition: "Post-angioplasty",
    visits: 11,
    lastVisit: "Jun 30",
    bloodGroup: "A+",
    allergies: "Sulfa drugs",
    height: "172 cm",
    weight: "78 kg",
    color: "#c25b2e",
    history: [
      { date: "Jun 30, 2026", title: "Post-angioplasty follow-up", by: "You" },
      { date: "May 15, 2026", title: "Angioplasty — LAD stent", by: "Metro Hospital" },
      { date: "May 2, 2026", title: "Coronary angiography", by: "Metro Hospital" },
    ],
  },
  {
    id: "pat-sara",
    doctorId: "dr-anaya-rao",
    name: "Sara Iqbal",
    initials: "SI",
    age: 29,
    gender: "Female",
    condition: "Anxiety, palpitations",
    visits: 2,
    lastVisit: "Jun 12",
    bloodGroup: "AB+",
    allergies: "None",
    height: "160 cm",
    weight: "55 kg",
    color: "#b03a6a",
    history: [
      { date: "Jun 12, 2026", title: "Anxiety & palpitations review", by: "You" },
      { date: "Apr 28, 2026", title: "Thyroid function test — normal", by: "Aria Labs" },
    ],
  },
  {
    id: "pat-tom",
    doctorId: "dr-anaya-rao",
    name: "Tom Becker",
    initials: "TB",
    age: 47,
    gender: "Male",
    condition: "High cholesterol",
    visits: 8,
    lastVisit: "May 28",
    bloodGroup: "O-",
    allergies: "Statins (myalgia)",
    height: "181 cm",
    weight: "90 kg",
    color: "#1f6f5c",
    history: [
      { date: "May 28, 2026", title: "Lipid management review", by: "You" },
      { date: "Apr 10, 2026", title: "Lipid profile — elevated LDL", by: "Aria Labs" },
    ],
  },
];

/* ---- Homepage service tiles ------------------------------------------ */
export const services: ServiceItem[] = [
  { title: "Online Consultation", desc: "Video, audio or chat with verified specialists in minutes.", icon: "💬" },
  { title: "Lab Tests at Home", desc: "Book blood work and diagnostics with home sample collection.", icon: "🧪" },
  { title: "Medicine Delivery", desc: "Order prescribed medicines to your door in a few taps.", icon: "💊" },
  { title: "Digital Prescriptions", desc: "Secure, shareable e-prescriptions the moment your call ends.", icon: "📄" },
  { title: "Health Records", desc: "Every report, scan and note in one encrypted timeline.", icon: "🗂️" },
  { title: "AI Health Assistant", desc: "Understand symptoms and prep for your visit, anytime.", icon: "✨" },
];

/* ---- How it works ----------------------------------------------------- */
export const howItWorks = [
  { step: "01", title: "Tell us what's going on", desc: "Describe your symptoms or search a specialty. It starts with one conversation." },
  { step: "02", title: "Choose your doctor", desc: "Compare verified specialists by rating, price, language and availability." },
  { step: "03", title: "Consult on your terms", desc: "Meet over secure video, audio or chat — from anywhere, on any device." },
  { step: "04", title: "Care that follows you", desc: "Get a digital prescription, book labs, order meds and schedule follow-ups." },
];

/* ---- FAQ -------------------------------------------------------------- */
export const faqs = [
  {
    q: "Are the doctors on Aria Health verified?",
    a: "Every doctor completes identity, license and qualification verification before their profile goes live. Look for the blue verified badge on each profile.",
  },
  {
    q: "How soon can I see a doctor?",
    a: "Many specialists offer same-day video slots. You'll see each doctor's next available time directly on their card before you book.",
  },
  {
    q: "Is my medical data private and secure?",
    a: "Your records are encrypted and only visible to you and the clinicians you consult. You control what is shared and can revoke access at any time.",
  },
  {
    q: "Will I get a valid prescription?",
    a: "Yes. After an eligible consultation your doctor issues a digital prescription you can use to order medicines or at any pharmacy.",
  },
  {
    q: "What does a consultation cost?",
    a: "Fees are set by each doctor and shown upfront — no hidden charges. You only pay after you confirm the appointment.",
  },
  {
    q: "Can I get a follow-up or second opinion?",
    a: "Absolutely. You can schedule follow-ups with the same doctor or seek a second opinion from another specialist directly from your dashboard.",
  },
];

/* ---- Notifications ---------------------------------------------------- */
export const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Appointment confirmed",
    body: "Your video consultation with Dr. Anaya Rao is today at 4:30 PM.",
    time: "10 min ago",
    kind: "appointment",
    unread: true,
  },
  {
    id: "n2",
    title: "New prescription available",
    body: "Dr. Liam Fischer issued a digital prescription for your skin review.",
    time: "2 hours ago",
    kind: "prescription",
    unread: true,
  },
  {
    id: "n3",
    title: "Payment successful",
    body: "$38.00 paid for your dermatology consultation. Receipt saved to records.",
    time: "Yesterday",
    kind: "payment",
    unread: false,
  },
  {
    id: "n4",
    title: "Lab results are in",
    body: "Your Lipid Profile results have been added to your health records.",
    time: "2 days ago",
    kind: "system",
    unread: false,
  },
];

/* ---- Doctor notifications --------------------------------------------- */
export const doctorNotifications: NotificationItem[] = [
  {
    id: "dn1",
    title: "New appointment request",
    body: "Rohan Mehta booked a Video consultation for Today at 4:30 PM.",
    time: "5 min ago",
    kind: "appointment",
    unread: true,
  },
  {
    id: "dn2",
    title: "New appointment request",
    body: "Grace Lin booked an Audio consultation for Today at 5:15 PM.",
    time: "40 min ago",
    kind: "appointment",
    unread: true,
  },
  {
    id: "dn3",
    title: "Payout scheduled",
    body: "Your weekly payout of $1,980 is scheduled for Aug 1, 2026.",
    time: "3 hours ago",
    kind: "payment",
    unread: false,
  },
  {
    id: "dn4",
    title: "New 5-star review",
    body: "A patient left a 5-star review after their cardiology consultation.",
    time: "Yesterday",
    kind: "system",
    unread: false,
  },
];

/* ---- Doctor earnings -------------------------------------------------- */
export const earnings = {
  today: 315,
  week: 1980,
  month: 8420,
  pending: 640,
  consultations: 214,
  avgRating: 4.9,
  breakdown: [
    { day: "Mon", value: 320 },
    { day: "Tue", value: 410 },
    { day: "Wed", value: 280 },
    { day: "Thu", value: 520 },
    { day: "Fri", value: 460 },
    { day: "Sat", value: 610 },
    { day: "Sun", value: 380 },
  ],
  payouts: [
    { id: "p1", date: "Jul 1, 2026", amount: 7840, status: "Paid" },
    { id: "p2", date: "Jun 1, 2026", amount: 8120, status: "Paid" },
    { id: "p3", date: "Aug 1, 2026", amount: 640, status: "Scheduled" },
  ],
};

/* ---- Admin data ------------------------------------------------------- */
export const adminStats = {
  patients: 48213,
  doctors: 1284,
  appointments: 9821,
  revenue: 428900,
  pendingVerifications: 37,
  activeConsults: 62,
};

export const verificationQueue = [
  { id: "vq1", name: "Dr. Hannah Weber", specialty: "Endocrinology", submitted: "2 hours ago", docs: 4, status: "Pending" },
  { id: "vq2", name: "Dr. Omar Haddad", specialty: "Nephrology", submitted: "5 hours ago", docs: 3, status: "Pending" },
  { id: "vq3", name: "Dr. Yuki Tanaka", specialty: "Oncology", submitted: "1 day ago", docs: 5, status: "In review" },
  { id: "vq4", name: "Dr. Clara Núñez", specialty: "Rheumatology", submitted: "1 day ago", docs: 4, status: "Pending" },
  { id: "vq5", name: "Dr. Samuel Boateng", specialty: "Gastroenterology", submitted: "2 days ago", docs: 3, status: "In review" },
];

export const adminPatients = [
  { id: "pt1", name: "Rohan Mehta", email: "rohan@mail.com", joined: "Jul 2026", appts: 6, status: "Active" },
  { id: "pt2", name: "Grace Lin", email: "grace@mail.com", joined: "Jun 2026", appts: 3, status: "Active" },
  { id: "pt3", name: "Ahmed Farah", email: "ahmed@mail.com", joined: "May 2026", appts: 11, status: "Active" },
  { id: "pt4", name: "Sara Iqbal", email: "sara@mail.com", joined: "May 2026", appts: 2, status: "Inactive" },
  { id: "pt5", name: "Tom Becker", email: "tom@mail.com", joined: "Apr 2026", appts: 8, status: "Active" },
];

export const adminAppointments = [
  { id: "aa1", patient: "Rohan Mehta", doctor: "Dr. Anaya Rao", date: "Today, 4:30 PM", mode: "Video", status: "Upcoming", fee: 45 },
  { id: "aa2", patient: "Grace Lin", doctor: "Dr. Anaya Rao", date: "Today, 5:15 PM", mode: "Audio", status: "Upcoming", fee: 45 },
  { id: "aa3", patient: "Sara Iqbal", doctor: "Dr. Sofia Mendes", date: "Today, 2:00 PM", mode: "Video", status: "Completed", fee: 32 },
  { id: "aa4", patient: "Tom Becker", doctor: "Dr. David Chen", date: "Yesterday", mode: "Chat", status: "Completed", fee: 25 },
  { id: "aa5", patient: "Ahmed Farah", doctor: "Dr. Anaya Rao", date: "Tomorrow, 10:00 AM", mode: "Video", status: "Upcoming", fee: 45 },
];

// Demo audit trail — mirrors what log_audit() records once the backend is wired.
export const auditLog: AuditEntry[] = [
  { id: "al1", actor: "Dr. Anaya Rao", actorRole: "doctor", action: "prescription.issue", target: "prescription · rx-2041", meta: { diagnosis: "Hypertension" }, time: "12 minutes ago" },
  { id: "al2", actor: "Admin", actorRole: "admin", action: "verification.decide", target: "verification · vq3", meta: { status: "approved" }, time: "1 hour ago" },
  { id: "al3", actor: "Rohan Mehta", actorRole: "patient", action: "record.upload", target: "medical_record", meta: { type: "Lab Report" }, time: "3 hours ago" },
  { id: "al4", actor: "Dr. Sofia Mendes", actorRole: "doctor", action: "appointment.status_change", target: "appointment · aa3", meta: { status: "Completed" }, time: "Yesterday" },
  { id: "al5", actor: "Admin", actorRole: "admin", action: "verification.decide", target: "verification · vq1", meta: { status: "rejected" }, time: "Yesterday" },
];

export function getDoctor(id: string): Doctor | undefined {
  return doctors.find((d) => d.id === id);
}

/* ---- AI assistant canned conversation -------------------------------- */
export const assistantSuggestions = [
  "I've had a headache for 3 days",
  "What could cause chest tightness?",
  "Help me prepare for my cardiology visit",
  "Is my blood pressure reading normal?",
];

/* ---- Doctor ↔ patient chat ------------------------------------------- */
export type ChatMessage = {
  id: string;
  from: "patient" | "doctor";
  text: string;
  time: string; // short label, e.g. "9:02 AM"
};

export type ChatThread = {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorInitials: string;
  doctorColor: string;
  specialty: string;
  patientName: string;
  patientInitials: string;
  patientColor: string;
  online: boolean;
  lastActive: string; // e.g. "2m ago"
  unread: number;
  messages: ChatMessage[];
};

/* The signed-in patient (mirrors PatientShell). */
export const currentPatient = { name: "Alex Morgan", initials: "AM", color: "#0070d1" };

/* Patient inbox — Alex Morgan's conversations with several doctors. */
export const patientChatThreads: ChatThread[] = [
  {
    id: "ct-anaya",
    doctorId: "dr-anaya-rao",
    doctorName: "Dr. Anaya Rao",
    doctorInitials: "AR",
    doctorColor: seedColors[0],
    specialty: "Cardiology",
    patientName: currentPatient.name,
    patientInitials: currentPatient.initials,
    patientColor: currentPatient.color,
    online: true,
    lastActive: "2m ago",
    unread: 1,
    messages: [
      { id: "m1", from: "doctor", text: "Hi Alex — I've reviewed your last two BP logs. How have the evening readings been this week?", time: "9:01 AM" },
      { id: "m2", from: "patient", text: "Mostly around 128/82, but one evening it was 138/88 after a stressful day.", time: "9:04 AM" },
      { id: "m3", from: "doctor", text: "That's reassuring overall. Keep logging twice a day and stay on Amlodipine 5mg. Let's not change the dose yet.", time: "9:06 AM" },
      { id: "m4", from: "doctor", text: "One occasional spike after stress is expected. Flag me if you cross 140/90 on three separate days.", time: "9:06 AM" },
    ],
  },
  {
    id: "ct-liam",
    doctorId: "dr-liam-fischer",
    doctorName: "Dr. Liam Fischer",
    doctorInitials: "LF",
    doctorColor: seedColors[1],
    specialty: "Dermatology",
    patientName: currentPatient.name,
    patientInitials: currentPatient.initials,
    patientColor: currentPatient.color,
    online: false,
    lastActive: "1h ago",
    unread: 0,
    messages: [
      { id: "m1", from: "patient", text: "The rash on my forearm looks a little better after the hydrocortisone. Still slightly itchy at night.", time: "Yesterday" },
      { id: "m2", from: "doctor", text: "Good progress. Keep applying a thin layer twice daily for the full 10 days, and a fragrance-free moisturiser on top.", time: "Yesterday" },
      { id: "m3", from: "patient", text: "Will do, thank you!", time: "Yesterday" },
    ],
  },
  {
    id: "ct-david",
    doctorId: "dr-david-chen",
    doctorName: "Dr. David Chen",
    doctorInitials: "DC",
    doctorColor: seedColors[7],
    specialty: "General Physician",
    patientName: currentPatient.name,
    patientInitials: currentPatient.initials,
    patientColor: currentPatient.color,
    online: true,
    lastActive: "5m ago",
    unread: 0,
    messages: [
      { id: "m1", from: "doctor", text: "Hi Alex, how's the cough — any better since we spoke?", time: "8:30 AM" },
      { id: "m2", from: "patient", text: "A bit better, but still there in the mornings.", time: "8:41 AM" },
    ],
  },
];

/* Doctor inbox — Dr. Anaya Rao's conversations with patients. */
export const doctorChatThreads: ChatThread[] = [
  {
    id: "dt-rohan",
    doctorId: "dr-anaya-rao",
    doctorName: "Dr. Anaya Rao",
    doctorInitials: "AR",
    doctorColor: seedColors[0],
    specialty: "Cardiology",
    patientName: "Rohan Mehta",
    patientInitials: "RM",
    patientColor: seedColors[2],
    online: true,
    lastActive: "just now",
    unread: 2,
    messages: [
      { id: "m1", from: "patient", text: "Doctor, the chest tightness came back briefly this morning while climbing stairs.", time: "10:12 AM" },
      { id: "m2", from: "patient", text: "It eased after a few minutes of rest. Should I be worried?", time: "10:12 AM" },
    ],
  },
  {
    id: "dt-grace",
    doctorId: "dr-anaya-rao",
    doctorName: "Dr. Anaya Rao",
    doctorInitials: "AR",
    doctorColor: seedColors[0],
    specialty: "Cardiology",
    patientName: "Grace Lin",
    patientInitials: "GL",
    patientColor: seedColors[6],
    online: false,
    lastActive: "20m ago",
    unread: 0,
    messages: [
      { id: "m1", from: "patient", text: "The palpitations after exercise have settled since I cut back on coffee.", time: "9:15 AM" },
      { id: "m2", from: "doctor", text: "That's great to hear, Grace. Let's keep the Holter monitor plan for next week just to confirm.", time: "9:20 AM" },
    ],
  },
  {
    id: "dt-ahmed",
    doctorId: "dr-anaya-rao",
    doctorName: "Dr. Anaya Rao",
    doctorInitials: "AR",
    doctorColor: seedColors[0],
    specialty: "Cardiology",
    patientName: "Ahmed Farah",
    patientInitials: "AF",
    patientColor: seedColors[3],
    online: false,
    lastActive: "Yesterday",
    unread: 0,
    messages: [
      { id: "m1", from: "doctor", text: "Post-angioplasty recovery looks on track. Any bleeding or swelling at the wrist site?", time: "Yesterday" },
      { id: "m2", from: "patient", text: "None at all. Feeling much stronger this week.", time: "Yesterday" },
    ],
  },
];
