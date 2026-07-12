-- ===========================================================================
-- Aria Health — patient records seed (mirrors lib/data.ts `patients`)
-- Run AFTER 0003_patients.sql. Rows belong to Dr. Anaya Rao's panel so the
-- demo doctor portal (/doctor/patients) shows a populated list.
-- Safe to re-run: clears this doctor's seeded rows first.
-- ===========================================================================

delete from public.patients where doctor_id = 'dr-anaya-rao';

insert into public.patients
  (doctor_id, name, initials, age, gender, condition, visits, last_visit, blood_group, allergies, height, weight, color, history) values
  ('dr-anaya-rao','Rohan Mehta','RM',34,'Male','Hypertension',6,'Today','B+','Penicillin','178 cm','82 kg','#7a4bd1',
    '[{"date":"Jul 8, 2026","title":"Hypertension follow-up","by":"You"},
      {"date":"Jun 2, 2026","title":"Lipid profile review","by":"You"},
      {"date":"Apr 18, 2026","title":"Chest X-ray — clear","by":"City Imaging"}]'::jsonb),
  ('dr-anaya-rao','Grace Lin','GL',41,'Female','Palpitations',3,'Today','O+','None','165 cm','60 kg','#2e7cc2',
    '[{"date":"Jul 12, 2026","title":"Palpitations assessment","by":"You"},
      {"date":"Jun 20, 2026","title":"Holter monitor fitted","by":"Aria Labs"}]'::jsonb),
  ('dr-anaya-rao','Ahmed Farah','AF',58,'Male','Post-angioplasty',11,'Jun 30','A+','Sulfa drugs','172 cm','78 kg','#c25b2e',
    '[{"date":"Jun 30, 2026","title":"Post-angioplasty follow-up","by":"You"},
      {"date":"May 15, 2026","title":"Angioplasty — LAD stent","by":"Metro Hospital"},
      {"date":"May 2, 2026","title":"Coronary angiography","by":"Metro Hospital"}]'::jsonb),
  ('dr-anaya-rao','Sara Iqbal','SI',29,'Female','Anxiety, palpitations',2,'Jun 12','AB+','None','160 cm','55 kg','#b03a6a',
    '[{"date":"Jun 12, 2026","title":"Anxiety & palpitations review","by":"You"},
      {"date":"Apr 28, 2026","title":"Thyroid function test — normal","by":"Aria Labs"}]'::jsonb),
  ('dr-anaya-rao','Tom Becker','TB',47,'Male','High cholesterol',8,'May 28','O-','Statins (myalgia)','181 cm','90 kg','#1f6f5c',
    '[{"date":"May 28, 2026","title":"Lipid management review","by":"You"},
      {"date":"Apr 10, 2026","title":"Lipid profile — elevated LDL","by":"Aria Labs"}]'::jsonb);
