-- Create 10 Dummy Coach Profiles for Testing
-- Run this in Supabase SQL Editor
-- NOTE: These are demo profiles that can be deleted in bulk later

DO $$
DECLARE
  -- Specialty IDs
  career_id UUID;
  stress_id UUID;
  relations_id UUID;
  health_id UUID;
  exec_id UUID;
  general_id UUID;

  -- Format IDs
  online_id UUID;
  inperson_id UUID;
  hybrid_id UUID;

  -- Coach IDs (individual variables)
  coach1_id UUID;
  coach2_id UUID;
  coach3_id UUID;
  coach4_id UUID;
  coach5_id UUID;
  coach6_id UUID;
  coach7_id UUID;
  coach8_id UUID;
  coach9_id UUID;
  coach10_id UUID;

BEGIN
  -- Get specialty IDs
  SELECT id INTO career_id FROM specialties WHERE name = 'Career Growth';
  SELECT id INTO stress_id FROM specialties WHERE name = 'Stress Relief';
  SELECT id INTO relations_id FROM specialties WHERE name = 'Relationships';
  SELECT id INTO health_id FROM specialties WHERE name = 'Health & Wellness';
  SELECT id INTO exec_id FROM specialties WHERE name = 'Executive Coaching';
  SELECT id INTO general_id FROM specialties WHERE name = 'General';

  -- Get format IDs
  SELECT id INTO online_id FROM formats WHERE name = 'Online';
  SELECT id INTO inperson_id FROM formats WHERE name = 'In-Person';
  SELECT id INTO hybrid_id FROM formats WHERE name = 'Hybrid';

  -- Insert dummy coaches (no user_id as these are demo profiles)
  -- Coach 1: Budget Career Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Jennifer Martinez', 'demo1@coachdog.test', 'https://picsum.photos/200/200?random=101',
          'Recent ICF certified coach passionate about helping early-career professionals find their path.',
          'Remote', 60, 2, true, true, 'active', 'monthly')
  RETURNING id INTO coach1_id;

  -- Coach 2: Mid-Range Relationship Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Dr. Michael Chen', 'demo2@coachdog.test', 'https://picsum.photos/200/200?random=102',
          'Licensed therapist turned relationship coach. Helping couples build stronger connections.',
          'San Diego, CA', 120, 8, true, true, 'active', 'annual')
  RETURNING id INTO coach2_id;

  -- Coach 3: Premium Executive Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Amanda Richardson', 'demo3@coachdog.test', 'https://picsum.photos/200/200?random=103',
          'Fortune 500 executive coach specializing in C-suite leadership development and transition.',
          'New York, NY', 300, 20, true, true, 'active', 'monthly')
  RETURNING id INTO coach3_id;

  -- Coach 4: Health & Wellness Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Carlos Rodriguez', 'demo4@coachdog.test', 'https://picsum.photos/200/200?random=104',
          'Certified nutritionist and wellness coach. Transform your health through sustainable lifestyle changes.',
          'Miami, FL', 85, 5, true, true, 'active', 'monthly')
  RETURNING id INTO coach4_id;

  -- Coach 5: Stress Management Specialist
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Dr. Priya Sharma', 'demo5@coachdog.test', 'https://picsum.photos/200/200?random=105',
          'Mindfulness expert and stress management coach. Find your calm in the chaos.',
          'Seattle, WA', 95, 7, true, true, 'active', 'monthly')
  RETURNING id INTO coach5_id;

  -- Coach 6: Budget General Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Tom Anderson', 'demo6@coachdog.test', 'https://picsum.photos/200/200?random=106',
          'Life coach with a holistic approach. Whatever your goal, we can work together to achieve it.',
          'Remote', 50, 3, true, true, 'active', 'monthly')
  RETURNING id INTO coach6_id;

  -- Coach 7: Mid-Range Career Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Lisa Thompson', 'demo7@coachdog.test', 'https://picsum.photos/200/200?random=107',
          'Career transition specialist. Successfully helped 200+ professionals pivot to their dream careers.',
          'Austin, TX', 110, 10, true, true, 'active', 'annual')
  RETURNING id INTO coach7_id;

  -- Coach 8: Premium Health Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Dr. Robert Williams', 'demo8@coachdog.test', 'https://picsum.photos/200/200?random=108',
          'Medical doctor turned wellness coach. Evidence-based health optimization for busy executives.',
          'Boston, MA', 250, 15, true, true, 'active', 'monthly')
  RETURNING id INTO coach8_id;

  -- Coach 9: Budget Relationship Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('Sarah Kim', 'demo9@coachdog.test', 'https://picsum.photos/200/200?random=109',
          'Relationship and dating coach for millennials. Navigate modern love with confidence.',
          'Los Angeles, CA', 70, 4, true, true, 'active', 'monthly')
  RETURNING id INTO coach9_id;

  -- Coach 10: Mid-Range Executive Coach
  INSERT INTO coaches (name, email, photo_url, bio, location, hourly_rate, years_experience, is_verified, documents_submitted, subscription_status, billing_cycle)
  VALUES ('James Patterson', 'demo10@coachdog.test', 'https://picsum.photos/200/200?random=110',
          'Leadership development coach for emerging leaders. From manager to executive.',
          'Chicago, IL', 140, 12, true, true, 'active', 'monthly')
  RETURNING id INTO coach10_id;

  -- Add specialties
  INSERT INTO coach_specialties (coach_id, specialty_id) VALUES
    (coach1_id, career_id),
    (coach2_id, relations_id),
    (coach3_id, exec_id),
    (coach3_id, career_id),
    (coach4_id, health_id),
    (coach5_id, stress_id),
    (coach5_id, health_id),
    (coach6_id, general_id),
    (coach7_id, career_id),
    (coach8_id, health_id),
    (coach8_id, exec_id),
    (coach9_id, relations_id),
    (coach10_id, exec_id),
    (coach10_id, career_id);

  -- Add formats
  INSERT INTO coach_formats (coach_id, format_id) VALUES
    (coach1_id, online_id),
    (coach2_id, online_id),
    (coach2_id, hybrid_id),
    (coach3_id, online_id),
    (coach3_id, inperson_id),
    (coach4_id, online_id),
    (coach4_id, inperson_id),
    (coach5_id, online_id),
    (coach6_id, online_id),
    (coach7_id, online_id),
    (coach7_id, hybrid_id),
    (coach8_id, inperson_id),
    (coach8_id, online_id),
    (coach9_id, online_id),
    (coach10_id, online_id),
    (coach10_id, inperson_id);

  -- Add certifications
  INSERT INTO certifications (coach_id, name) VALUES
    (coach1_id, 'ICF ACC'),
    (coach2_id, 'LMFT License'),
    (coach2_id, 'Gottman Method Certified'),
    (coach3_id, 'ICF PCC'),
    (coach3_id, 'Harvard Leadership Certificate'),
    (coach4_id, 'Precision Nutrition L2'),
    (coach4_id, 'ACE Health Coach'),
    (coach5_id, 'MBSR Certified'),
    (coach5_id, 'PhD Psychology'),
    (coach6_id, 'Life Coach Certification'),
    (coach7_id, 'ICF PCC'),
    (coach7_id, 'SHRM-CP'),
    (coach8_id, 'MD Internal Medicine'),
    (coach8_id, 'Board Certified Lifestyle Medicine'),
    (coach9_id, 'Relationship Coach Certification'),
    (coach10_id, 'ICF PCC'),
    (coach10_id, 'MBA');

  -- Add social links
  INSERT INTO social_links (coach_id, platform, url, display_order) VALUES
    (coach1_id, 'LinkedIn', 'https://linkedin.com/in/jennifermartinez-coach', 1),
    (coach1_id, 'Website', 'https://jennifermartinezcoaching.com', 2),
    (coach2_id, 'LinkedIn', 'https://linkedin.com/in/drmichaelchen', 1),
    (coach2_id, 'Instagram', 'https://instagram.com/drmichaelchen', 2),
    (coach3_id, 'LinkedIn', 'https://linkedin.com/in/amandarichardson-exec', 1),
    (coach3_id, 'Website', 'https://amandarichardson.com', 2),
    (coach4_id, 'Instagram', 'https://instagram.com/carloswellness', 1),
    (coach4_id, 'Website', 'https://carloswellnesscoaching.com', 2),
    (coach5_id, 'LinkedIn', 'https://linkedin.com/in/drpriyasharma', 1),
    (coach5_id, 'Website', 'https://mindfulnesswithdrsharma.com', 2),
    (coach6_id, 'Website', 'https://tomandersoncoaching.com', 1),
    (coach7_id, 'LinkedIn', 'https://linkedin.com/in/lisathompson-career', 1),
    (coach7_id, 'Twitter', 'https://twitter.com/lisathompson', 2),
    (coach8_id, 'LinkedIn', 'https://linkedin.com/in/drrobertwilliams', 1),
    (coach8_id, 'Website', 'https://drwilliamswellness.com', 2),
    (coach9_id, 'Instagram', 'https://instagram.com/sarahkimcoach', 1),
    (coach9_id, 'TikTok', 'https://tiktok.com/@sarahkimcoach', 2),
    (coach10_id, 'LinkedIn', 'https://linkedin.com/in/jamespatterson-exec', 1),
    (coach10_id, 'Website', 'https://jamespatterson.coach', 2);

  -- Add some sample reviews
  INSERT INTO reviews (coach_id, author_name, rating, review_text, created_at) VALUES
    (coach1_id, 'Alex M.', 5, 'Jennifer helped me land my dream job! Her resume and interview coaching was invaluable.', NOW() - INTERVAL '15 days'),
    (coach2_id, 'Emily & John', 5, 'Saved our marriage. Dr. Chen gave us practical tools we still use every day.', NOW() - INTERVAL '30 days'),
    (coach3_id, 'CEO (Anonymous)', 5, 'Amanda coached me through my transition to CEO. Best investment I ever made.', NOW() - INTERVAL '60 days'),
    (coach4_id, 'Maria L.', 4, 'Lost 30 pounds and feel amazing! Carlos makes healthy living sustainable.', NOW() - INTERVAL '45 days'),
    (coach5_id, 'David K.', 5, 'My anxiety is finally under control. Dr. Sharma''s mindfulness techniques changed my life.', NOW() - INTERVAL '20 days'),
    (coach7_id, 'Rachel T.', 5, 'Lisa helped me pivot from finance to tech. I''m now doing work I love!', NOW() - INTERVAL '35 days'),
    (coach8_id, 'Executive (Confidential)', 5, 'Dr. Williams'' medical background makes all the difference. Real science, real results.', NOW() - INTERVAL '50 days'),
    (coach9_id, 'Mike S.', 4, 'Sarah''s dating advice actually works! Met my girlfriend using her strategies.', NOW() - INTERVAL '25 days'),
    (coach10_id, 'Manager Lisa', 5, 'James prepared me perfectly for my director role. Highly recommend!', NOW() - INTERVAL '40 days');

END $$;

-- Verify coaches were created
SELECT
  c.name,
  c.email,
  c.hourly_rate,
  c.location,
  STRING_AGG(DISTINCT s.name, ', ') as specialties
FROM coaches c
LEFT JOIN coach_specialties cs ON c.id = cs.coach_id
LEFT JOIN specialties s ON cs.specialty_id = s.id
WHERE c.email LIKE '%@coachdog.test'
GROUP BY c.id, c.name, c.email, c.hourly_rate, c.location
ORDER BY c.hourly_rate;

-- Success message
SELECT '✓ 10 dummy coaches created successfully!' AS status;
SELECT 'Run this to delete them later: DELETE FROM coaches WHERE email LIKE ''%@coachdog.test'';' AS cleanup_note;
