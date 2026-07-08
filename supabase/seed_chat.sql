-- ===========================================================================
-- Aria Health — chat seed data (mirrors patientChatThreads / doctorChatThreads
-- in lib/data.ts). Run AFTER 0002_chat.sql. Safe to re-run (on conflict do nothing).
--
-- Patient-inbox threads use patient_name 'Alex Morgan' (the demo patient) so
-- they surface for any signed-in user. Doctor-inbox threads use real patient
-- names. created_at is offset from now() so the relative-time labels look fresh.
-- ===========================================================================

-- Threads -------------------------------------------------------------------
insert into public.chat_threads
  (id, doctor_id, patient_id, patient_name, patient_initials, patient_color, online, created_at, updated_at) values
  -- Patient (Alex Morgan) inbox
  ('00000000-0000-0000-0000-0000000000c1','dr-anaya-rao',   null,'Alex Morgan','AM','#0070d1',true,  now() - interval '20 minutes', now() - interval '2 minutes'),
  ('00000000-0000-0000-0000-0000000000c2','dr-liam-fischer',null,'Alex Morgan','AM','#0070d1',false, now() - interval '1 day',      now() - interval '1 hour'),
  ('00000000-0000-0000-0000-0000000000c3','dr-david-chen',  null,'Alex Morgan','AM','#0070d1',true,  now() - interval '40 minutes', now() - interval '5 minutes'),
  -- Doctor (Dr. Anaya Rao) inbox
  ('00000000-0000-0000-0000-0000000000d1','dr-anaya-rao',   null,'Rohan Mehta','RM','#7a4bd1',true,  now() - interval '15 minutes', now() - interval '1 minute'),
  ('00000000-0000-0000-0000-0000000000d2','dr-anaya-rao',   null,'Grace Lin',  'GL','#3a8f7a',false, now() - interval '2 hours',    now() - interval '20 minutes'),
  ('00000000-0000-0000-0000-0000000000d3','dr-anaya-rao',   null,'Ahmed Farah','AF','#c25b2e',false, now() - interval '1 day',      now() - interval '1 day')
on conflict (id) do nothing;

-- Messages ------------------------------------------------------------------
insert into public.chat_messages (id, thread_id, sender, body, created_at) values
  -- Alex ↔ Dr. Anaya Rao
  ('00000000-0000-0000-0000-00000000cd01','00000000-0000-0000-0000-0000000000c1','doctor', 'Hi Alex — I''ve reviewed your last two BP logs. How have the evening readings been this week?', now() - interval '20 minutes'),
  ('00000000-0000-0000-0000-00000000cd02','00000000-0000-0000-0000-0000000000c1','patient','Mostly around 128/82, but one evening it was 138/88 after a stressful day.', now() - interval '18 minutes'),
  ('00000000-0000-0000-0000-00000000cd03','00000000-0000-0000-0000-0000000000c1','doctor', 'That''s reassuring overall. Keep logging twice a day and stay on Amlodipine 5mg. Let''s not change the dose yet.', now() - interval '3 minutes'),
  ('00000000-0000-0000-0000-00000000cd04','00000000-0000-0000-0000-0000000000c1','doctor', 'One occasional spike after stress is expected. Flag me if you cross 140/90 on three separate days.', now() - interval '2 minutes'),
  -- Alex ↔ Dr. Liam Fischer
  ('00000000-0000-0000-0000-00000000cd11','00000000-0000-0000-0000-0000000000c2','patient','The rash on my forearm looks a little better after the hydrocortisone. Still slightly itchy at night.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000cd12','00000000-0000-0000-0000-0000000000c2','doctor', 'Good progress. Keep applying a thin layer twice daily for the full 10 days, and a fragrance-free moisturiser on top.', now() - interval '23 hours'),
  ('00000000-0000-0000-0000-00000000cd13','00000000-0000-0000-0000-0000000000c2','patient','Will do, thank you!', now() - interval '1 hour'),
  -- Alex ↔ Dr. David Chen
  ('00000000-0000-0000-0000-00000000cd21','00000000-0000-0000-0000-0000000000c3','doctor', 'Hi Alex, how''s the cough — any better since we spoke?', now() - interval '40 minutes'),
  ('00000000-0000-0000-0000-00000000cd22','00000000-0000-0000-0000-0000000000c3','patient','A bit better, but still there in the mornings.', now() - interval '5 minutes'),
  -- Rohan ↔ Dr. Anaya Rao
  ('00000000-0000-0000-0000-00000000cd31','00000000-0000-0000-0000-0000000000d1','patient','Doctor, the chest tightness came back briefly this morning while climbing stairs.', now() - interval '15 minutes'),
  ('00000000-0000-0000-0000-00000000cd32','00000000-0000-0000-0000-0000000000d1','patient','It eased after a few minutes of rest. Should I be worried?', now() - interval '1 minute'),
  -- Grace ↔ Dr. Anaya Rao
  ('00000000-0000-0000-0000-00000000cd41','00000000-0000-0000-0000-0000000000d2','patient','The palpitations after exercise have settled since I cut back on coffee.', now() - interval '2 hours'),
  ('00000000-0000-0000-0000-00000000cd42','00000000-0000-0000-0000-0000000000d2','doctor', 'That''s great to hear, Grace. Let''s keep the Holter monitor plan for next week just to confirm.', now() - interval '20 minutes'),
  -- Ahmed ↔ Dr. Anaya Rao
  ('00000000-0000-0000-0000-00000000cd51','00000000-0000-0000-0000-0000000000d3','doctor', 'Post-angioplasty recovery looks on track. Any bleeding or swelling at the wrist site?', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000cd52','00000000-0000-0000-0000-0000000000d3','patient','None at all. Feeling much stronger this week.', now() - interval '23 hours')
on conflict (id) do nothing;
