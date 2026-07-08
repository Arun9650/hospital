-- ===========================================================================
-- Aria Health — seed data (mirrors lib/data.ts)
-- Run AFTER 0001_schema.sql. Safe to re-run (on conflict do nothing).
-- Personal rows (appointments / prescriptions / records / notifications) are
-- seeded with a NULL patient so they appear as demo data for any signed-in user.
-- ===========================================================================

-- Specialties ---------------------------------------------------------------
insert into public.specialties (slug, name, icon, doctors_count, blurb) values
  ('cardiology','Cardiology','🫀',128,'Heart & vascular care'),
  ('dermatology','Dermatology','🧴',96,'Skin, hair & nails'),
  ('pediatrics','Pediatrics','🧸',142,'Care for children'),
  ('neurology','Neurology','🧠',74,'Brain & nervous system'),
  ('orthopedics','Orthopedics','🦴',88,'Bones & joints'),
  ('psychiatry','Mental Health','🌿',110,'Therapy & psychiatry'),
  ('gynecology','Gynecology','🌺',102,'Women''s health'),
  ('general','General Physician','🩺',210,'Everyday concerns'),
  ('dentistry','Dentistry','🦷',67,'Oral & dental care'),
  ('ophthalmology','Eye Care','👁️',54,'Vision & eye health'),
  ('ent','ENT','👂',61,'Ear, nose & throat'),
  ('nutrition','Nutrition','🥗',45,'Diet & wellness')
on conflict (slug) do nothing;

-- Doctors -------------------------------------------------------------------
insert into public.doctors
  (id, name, specialty, specialty_slug, qualifications, experience, rating, reviews, fee, location, languages, photo, initials, verified, next_slot, modes, about, tags) values
  ('dr-anaya-rao','Dr. Anaya Rao','Cardiology','cardiology','MD, DM (Cardiology)',14,4.9,512,45,'Bengaluru, IN',
    '{"English","Hindi","Kannada"}','#0070d1','AR',true,'Today, 4:30 PM','{"Video","Audio","In-person"}',
    'Interventional cardiologist focused on preventive heart care and remote monitoring. Believes the best consultation begins with a real conversation.',
    '{"Heart Failure","Hypertension","Preventive Care"}'),
  ('dr-liam-fischer','Dr. Liam Fischer','Dermatology','dermatology','MBBS, MD (Dermatology)',9,4.8,388,38,'Berlin, DE',
    '{"English","German"}','#1f6f5c','LF',true,'Today, 6:00 PM','{"Video","Chat"}',
    'Clinical and cosmetic dermatology with a focus on acne, eczema and teledermatology triage using patient-uploaded photos.',
    '{"Acne","Eczema","Skin Cancer Screening"}'),
  ('dr-sofia-mendes','Dr. Sofia Mendes','Pediatrics','pediatrics','MD (Pediatrics)',11,4.9,640,32,'Lisbon, PT',
    '{"English","Portuguese","Spanish"}','#7a4bd1','SM',true,'Tomorrow, 10:00 AM','{"Video","Audio","Chat"}',
    'Pediatrician caring for newborns to teens. Calm, parent-friendly guidance for fevers, growth, sleep and vaccinations.',
    '{"Newborn Care","Vaccination","Growth"}'),
  ('dr-noah-kim','Dr. Noah Kim','Neurology','neurology','MD, DM (Neurology)',16,4.7,274,55,'Seoul, KR',
    '{"English","Korean"}','#c25b2e','NK',true,'Tomorrow, 2:15 PM','{"Video","In-person"}',
    'Neurologist specialising in migraine, epilepsy and sleep disorders with a data-driven, patient-education approach.',
    '{"Migraine","Epilepsy","Sleep"}'),
  ('dr-maya-okonkwo','Dr. Maya Okonkwo','Mental Health','psychiatry','MD (Psychiatry)',8,4.9,421,60,'London, UK',
    '{"English"}','#2e7cc2','MO',true,'Today, 7:30 PM','{"Video","Audio"}',
    'Psychiatrist and therapist supporting anxiety, burnout and mood. A safe, unhurried space that begins with one conversation.',
    '{"Anxiety","Depression","Burnout"}'),
  ('dr-raj-patel','Dr. Raj Patel','Orthopedics','orthopedics','MS (Ortho)',18,4.8,356,48,'Mumbai, IN',
    '{"English","Hindi","Gujarati"}','#b03a6a','RP',true,'Today, 5:45 PM','{"Video","In-person"}',
    'Orthopedic surgeon focused on sports injuries, joint pain and post-operative rehab guidance over video.',
    '{"Sports Injury","Joint Pain","Rehab"}'),
  ('dr-elena-rossi','Dr. Elena Rossi','Gynecology','gynecology','MD (OBGYN)',13,4.9,489,42,'Milan, IT',
    '{"English","Italian"}','#3a8f7a','ER',true,'Tomorrow, 11:30 AM','{"Video","Audio","In-person"}',
    'Gynecologist supporting reproductive health, pregnancy and menopause with warmth and evidence-based care.',
    '{"Pregnancy","PCOS","Menopause"}'),
  ('dr-david-chen','Dr. David Chen','General Physician','general','MBBS, MRCGP',10,4.8,712,25,'Singapore, SG',
    '{"English","Mandarin"}','#5b6bd1','DC',true,'Today, 3:15 PM','{"Video","Audio","Chat"}',
    'Family physician for everyday concerns — fever, infections, chronic condition follow-ups and second opinions.',
    '{"Fever","Diabetes","Follow-up"}')
on conflict (id) do nothing;

-- Reviews -------------------------------------------------------------------
insert into public.reviews (id, doctor_id, patient, initials, rating, date_label, body) values
  ('rv1','dr-liam-fischer','Priya S.','PS',5,'2 weeks ago','The whole thing felt human. I described my symptoms, uploaded a photo, and had a video call within the hour. Prescription arrived on the app before I hung up.'),
  ('rv2','dr-maya-okonkwo','Marcus T.','MT',5,'1 month ago','I was nervous about talking to a psychiatrist online. Dr. Okonkwo made it feel like a conversation with someone who genuinely cared. Booking again.'),
  ('rv3','dr-sofia-mendes','Aisha K.','AK',5,'3 weeks ago','My daughter had a fever at midnight. Dr. Mendes was calm, thorough and reassuring. Aria Health saved us a stressful ER trip.'),
  ('rv4',null,'Jonas W.','JW',4,'2 months ago','Clean, fast and premium. Records, prescriptions and lab bookings all live in one place. This is what healthcare software should feel like.')
on conflict (id) do nothing;

-- Appointments (demo; patient_id null) --------------------------------------
insert into public.appointments (id, doctor_id, doctor_name, specialty, patient_name, date_label, time_label, mode, status, fee, reason) values
  ('00000000-0000-0000-0000-000000001001','dr-anaya-rao','Dr. Anaya Rao','Cardiology','You','Today','4:30 PM','Video','Upcoming',45,'Blood pressure follow-up'),
  ('00000000-0000-0000-0000-000000001002','dr-david-chen','Dr. David Chen','General Physician','You','Jul 12','11:00 AM','Audio','Upcoming',25,'Recurring cough'),
  ('00000000-0000-0000-0000-000000000994','dr-liam-fischer','Dr. Liam Fischer','Dermatology','You','Jun 28','6:00 PM','Video','Completed',38,'Skin rash review'),
  ('00000000-0000-0000-0000-000000000987','dr-maya-okonkwo','Dr. Maya Okonkwo','Mental Health','You','Jun 15','7:30 PM','Video','Completed',60,'Therapy session'),
  ('00000000-0000-0000-0000-000000002001','dr-anaya-rao','Dr. Anaya Rao','Cardiology','Rohan Mehta','Today','4:30 PM','Video','Pending',45,'Chest tightness, family history of CAD'),
  ('00000000-0000-0000-0000-000000002002','dr-anaya-rao','Dr. Anaya Rao','Cardiology','Grace Lin','Today','5:15 PM','Audio','Pending',45,'Palpitations after exercise'),
  ('00000000-0000-0000-0000-000000002003','dr-anaya-rao','Dr. Anaya Rao','Cardiology','Ahmed Farah','Tomorrow','10:00 AM','Video','Upcoming',45,'Post-angioplasty follow-up')
on conflict (id) do nothing;

-- Prescriptions -------------------------------------------------------------
insert into public.prescriptions (id, patient_id, doctor_name, specialty, date_label, diagnosis, medicines, tests, notes) values
  ('00000000-0000-0000-0000-000000005001', null, 'Dr. Anaya Rao','Cardiology','Jul 8, 2026','Stage 1 Hypertension',
    '[{"name":"Amlodipine","dose":"5 mg","frequency":"Once daily","duration":"30 days"},{"name":"Aspirin","dose":"75 mg","frequency":"Once daily","duration":"30 days"}]'::jsonb,
    '{"Lipid Profile","ECG","Kidney Function Test"}',
    'Reduce salt intake, 30 min brisk walk daily. Monitor BP twice a week and log in the app. Follow-up in 4 weeks.'),
  ('00000000-0000-0000-0000-000000004988', null, 'Dr. Liam Fischer','Dermatology','Jun 28, 2026','Mild Atopic Dermatitis',
    '[{"name":"Hydrocortisone 1%","dose":"Apply thin layer","frequency":"Twice daily","duration":"10 days"},{"name":"Cetirizine","dose":"10 mg","frequency":"At night","duration":"7 days"}]'::jsonb,
    '{}',
    'Fragrance-free moisturiser twice daily. Avoid hot showers. Photo review in 2 weeks.')
on conflict (id) do nothing;

-- Medical records -----------------------------------------------------------
insert into public.medical_records (id, patient_id, title, type, date_label, issued_by, size) values
  ('mr1', null, 'Complete Blood Count','Lab Report','Jul 2, 2026','Aria Labs','1.2 MB'),
  ('mr2', null, 'Lipid Profile','Lab Report','Jun 20, 2026','Aria Labs','0.8 MB'),
  ('mr3', null, 'Chest X-Ray','Scan','Jun 10, 2026','City Imaging','4.4 MB'),
  ('mr4', null, 'Hypertension Rx','Prescription','Jul 8, 2026','Dr. Anaya Rao','0.3 MB'),
  ('mr5', null, 'COVID-19 Booster','Vaccination','Jan 14, 2026','Aria Clinic','0.2 MB'),
  ('mr6', null, 'ENT Discharge Note','Discharge Summary','Dec 3, 2025','Metro Hospital','0.6 MB')
on conflict (id) do nothing;

-- Notifications -------------------------------------------------------------
insert into public.notifications (id, user_id, title, body, time_label, kind, unread) values
  ('n1', null, 'Appointment confirmed','Your video consultation with Dr. Anaya Rao is today at 4:30 PM.','10 min ago','appointment',true),
  ('n2', null, 'New prescription available','Dr. Liam Fischer issued a digital prescription for your skin review.','2 hours ago','prescription',true),
  ('n3', null, 'Payment successful','$38.00 paid for your dermatology consultation. Receipt saved to records.','Yesterday','payment',false),
  ('n4', null, 'Lab results are in','Your Lipid Profile results have been added to your health records.','2 days ago','system',false)
on conflict (id) do nothing;

-- Availability (Dr. Anaya Rao) ----------------------------------------------
insert into public.availability (doctor_id, day, enabled, slots) values
  ('dr-anaya-rao','Monday',   true,  '{"9:00","10:00","11:00","16:00","17:00"}'),
  ('dr-anaya-rao','Tuesday',  true,  '{"9:00","10:00","14:00","15:00"}'),
  ('dr-anaya-rao','Wednesday',true,  '{"16:00","17:00","18:00"}'),
  ('dr-anaya-rao','Thursday', true,  '{"9:00","10:00","11:00"}'),
  ('dr-anaya-rao','Friday',   true,  '{"10:00","14:00","15:00","16:00"}'),
  ('dr-anaya-rao','Saturday', true,  '{"9:00","10:00","11:00"}'),
  ('dr-anaya-rao','Sunday',   false, '{}')
on conflict (doctor_id, day) do nothing;

-- Verification queue --------------------------------------------------------
insert into public.verification_queue (id, name, specialty, submitted, docs, status) values
  ('vq1','Dr. Hannah Weber','Endocrinology','2 hours ago',4,'Pending'),
  ('vq2','Dr. Omar Haddad','Nephrology','5 hours ago',3,'Pending'),
  ('vq3','Dr. Yuki Tanaka','Oncology','1 day ago',5,'In review'),
  ('vq4','Dr. Clara Núñez','Rheumatology','1 day ago',4,'Pending'),
  ('vq5','Dr. Samuel Boateng','Gastroenterology','2 days ago',3,'In review')
on conflict (id) do nothing;
