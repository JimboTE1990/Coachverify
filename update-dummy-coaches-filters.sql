-- Update Dummy Coaches with Languages, Expertise, and CPD Qualifications
-- Run this in Supabase SQL Editor to populate the new filter fields

-- Update Coach 1: Jennifer Martinez (Budget Career Coach)
UPDATE coaches
SET
  coaching_languages = '["English"]'::jsonb,
  coaching_expertise = '["Career Transition", "Resume & Interview Prep", "Personal Branding", "Goal Setting"]'::jsonb,
  cpd_qualifications = '["ICF Associate Certified Coach (ACC)"]'::jsonb
WHERE email = 'demo1@coachdog.test';

-- Update Coach 2: Dr. Michael Chen (Relationship Coach)
UPDATE coaches
SET
  coaching_languages = '["English", "Mandarin"]'::jsonb,
  coaching_expertise = '["Couples Therapy", "Communication Skills", "Conflict Resolution", "Marriage Counseling"]'::jsonb,
  cpd_qualifications = '["Licensed Marriage and Family Therapist (LMFT)", "Gottman Method Level 1"]'::jsonb
WHERE email = 'demo2@coachdog.test';

-- Update Coach 3: Amanda Richardson (Premium Executive Coach)
UPDATE coaches
SET
  coaching_languages = '["English"]'::jsonb,
  coaching_expertise = '["Executive Leadership", "C-Suite Transition", "Strategic Planning", "Team Building", "Change Management"]'::jsonb,
  cpd_qualifications = '["ICF Professional Certified Coach (PCC)", "Harvard Leadership Certificate", "Certified Executive Coach (CEC)"]'::jsonb
WHERE email = 'demo3@coachdog.test';

-- Update Coach 4: Carlos Rodriguez (Health & Wellness Coach)
UPDATE coaches
SET
  coaching_languages = '["English", "Spanish"]'::jsonb,
  coaching_expertise = '["Nutrition Coaching", "Weight Management", "Fitness & Exercise", "Stress Management", "Habit Formation"]'::jsonb,
  cpd_qualifications = '["Precision Nutrition Level 2 Certification", "ACE Certified Health Coach", "National Board Certified Health & Wellness Coach (NBC-HWC)"]'::jsonb
WHERE email = 'demo4@coachdog.test';

-- Update Coach 5: Dr. Priya Sharma (Stress Management)
UPDATE coaches
SET
  coaching_languages = '["English", "Hindi"]'::jsonb,
  coaching_expertise = '["Stress Management", "Mindfulness & Meditation", "Anxiety Management", "Work-Life Balance", "Emotional Intelligence"]'::jsonb,
  cpd_qualifications = '["MBSR (Mindfulness-Based Stress Reduction) Certified Teacher", "PhD in Clinical Psychology", "ICF Associate Certified Coach (ACC)"]'::jsonb
WHERE email = 'demo5@coachdog.test';

-- Update Coach 6: Tom Anderson (Budget General Coach)
UPDATE coaches
SET
  coaching_languages = '["English"]'::jsonb,
  coaching_expertise = '["Goal Setting", "Personal Development", "Time Management", "Motivation & Accountability"]'::jsonb,
  cpd_qualifications = '["Certified Life Coach (CLC)"]'::jsonb
WHERE email = 'demo6@coachdog.test';

-- Update Coach 7: Lisa Thompson (Mid-Range Career Coach)
UPDATE coaches
SET
  coaching_languages = '["English"]'::jsonb,
  coaching_expertise = '["Career Transition", "Career Development", "Personal Branding", "Interview Preparation", "Negotiation Skills"]'::jsonb,
  cpd_qualifications = '["ICF Professional Certified Coach (PCC)", "SHRM Certified Professional (SHRM-CP)", "Certified Career Services Provider (CCSP)"]'::jsonb
WHERE email = 'demo7@coachdog.test';

-- Update Coach 8: Dr. Robert Williams (Premium Health Coach)
UPDATE coaches
SET
  coaching_languages = '["English"]'::jsonb,
  coaching_expertise = '["Health Optimization", "Executive Wellness", "Nutrition Coaching", "Stress Management", "Sleep Optimization"]'::jsonb,
  cpd_qualifications = '["MD (Doctor of Medicine)", "Board Certified Lifestyle Medicine", "National Board Certified Health & Wellness Coach (NBC-HWC)", "ICF Associate Certified Coach (ACC)"]'::jsonb
WHERE email = 'demo8@coachdog.test';

-- Update Coach 9: Sarah Kim (Budget Relationship Coach)
UPDATE coaches
SET
  coaching_languages = '["English", "Korean"]'::jsonb,
  coaching_expertise = '["Dating & Relationships", "Communication Skills", "Self-Confidence", "Boundary Setting"]'::jsonb,
  cpd_qualifications = '["Certified Relationship Coach", "ICF Associate Certified Coach (ACC)"]'::jsonb
WHERE email = 'demo9@coachdog.test';

-- Update Coach 10: James Patterson (Mid-Range Executive Coach)
UPDATE coaches
SET
  coaching_languages = '["English"]'::jsonb,
  coaching_expertise = '["Leadership Development", "Executive Coaching", "Team Management", "Career Development", "Performance Coaching"]'::jsonb,
  cpd_qualifications = '["ICF Professional Certified Coach (PCC)", "MBA", "Certified Executive Coach (CEC)", "EMCC Senior Practitioner"]'::jsonb
WHERE email = 'demo10@coachdog.test';

-- Verify updates
SELECT
  name,
  email,
  coaching_languages,
  coaching_expertise,
  cpd_qualifications
FROM coaches
WHERE email LIKE '%@coachdog.test'
ORDER BY hourly_rate;

-- Success message
SELECT '✓ All dummy coaches updated with languages, expertise, and qualifications!' AS status;
