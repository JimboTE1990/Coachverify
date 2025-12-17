-- CoachDog Sample Data
-- Run this AFTER running supabase-schema.sql to populate with test data

-- Note: This assumes you've already created user accounts via Supabase Auth
-- Replace the user_id values with actual UUIDs from your auth.users table

-- Sample Coach 1: Dr. Sarah Jenkins
INSERT INTO coaches (
  user_id,
  name,
  email,
  phone_number,
  photo_url,
  bio,
  location,
  hourly_rate,
  years_experience,
  is_verified,
  documents_submitted,
  verification_body,
  verification_number,
  verified_at,
  subscription_status,
  billing_cycle,
  last_payment_date,
  two_factor_enabled
) VALUES (
  'replace-with-user-id-1', -- Replace with actual user UUID
  'Dr. Sarah Jenkins',
  'sarah@coachdog.example',
  '+1-555-0101',
  'https://picsum.photos/200/200?random=1',
  'Helping corporate leaders find balance and accelerate their career paths with 15 years of HR experience. I specialize in executive coaching and career transitions.',
  'New York, NY',
  150,
  15,
  true,
  true,
  'ICF',
  'PCC-12345',
  NOW(),
  'active',
  'monthly',
  NOW() - INTERVAL '1 day',
  true
) RETURNING id;

-- Get the coach ID for relationships (you'll need to adjust these based on actual IDs)
-- For this example, let's say the coach ID is stored in a variable

-- Sample Coach 2: Marcus Thorne
INSERT INTO coaches (
  user_id,
  name,
  email,
  photo_url,
  bio,
  location,
  hourly_rate,
  years_experience,
  is_verified,
  documents_submitted,
  subscription_status,
  billing_cycle,
  last_payment_date,
  two_factor_enabled
) VALUES (
  'replace-with-user-id-2',
  'Marcus Thorne',
  'marcus@coachdog.example',
  'https://picsum.photos/200/200?random=2',
  'Holistic approach to stress management through mindfulness and nutrition. Transform your relationship with stress.',
  'Austin, TX',
  80,
  5,
  true,
  true,
  'active',
  'annual',
  NOW() - INTERVAL '180 days',
  false
);

-- Sample Coach 3: Elena Rodriguez
INSERT INTO coaches (
  user_id,
  name,
  email,
  photo_url,
  bio,
  location,
  hourly_rate,
  years_experience,
  is_verified,
  documents_submitted,
  subscription_status,
  billing_cycle,
  trial_ends_at,
  two_factor_enabled
) VALUES (
  'replace-with-user-id-3',
  'Elena Rodriguez',
  'elena@coachdog.example',
  'https://picsum.photos/200/200?random=3',
  'Navigating complex relationship dynamics with empathy and actionable strategies. Building stronger connections.',
  'Los Angeles, CA',
  120,
  8,
  false,
  true,
  'trial',
  'monthly',
  NOW() + INTERVAL '5 days',
  false
);

-- Sample Coach 4: James O'Connor
INSERT INTO coaches (
  user_id,
  name,
  email,
  photo_url,
  bio,
  location,
  hourly_rate,
  years_experience,
  is_verified,
  documents_submitted,
  subscription_status,
  billing_cycle,
  two_factor_enabled
) VALUES (
  'replace-with-user-id-4',
  'James O''Connor',
  'james@coachdog.example',
  'https://picsum.photos/200/200?random=4',
  'Tech industry veteran helping engineers transition into management. From code to leadership.',
  'San Francisco, CA',
  200,
  20,
  true,
  true,
  'expired',
  'monthly',
  false
);

-- Get specialty IDs for relationships
DO $$
DECLARE
  coach1_id UUID;
  coach2_id UUID;
  coach3_id UUID;
  coach4_id UUID;
  career_id UUID;
  stress_id UUID;
  relations_id UUID;
  health_id UUID;
  exec_id UUID;
  general_id UUID;
  online_id UUID;
  inperson_id UUID;
  hybrid_id UUID;
BEGIN
  -- Get coach IDs (assuming they were just created)
  SELECT id INTO coach1_id FROM coaches WHERE email = 'sarah@coachdog.example';
  SELECT id INTO coach2_id FROM coaches WHERE email = 'marcus@coachdog.example';
  SELECT id INTO coach3_id FROM coaches WHERE email = 'elena@coachdog.example';
  SELECT id INTO coach4_id FROM coaches WHERE email = 'james@coachdog.example';

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

  -- Assign specialties to coaches
  -- Sarah: Career Growth, Executive Coaching
  INSERT INTO coach_specialties (coach_id, specialty_id) VALUES
    (coach1_id, career_id),
    (coach1_id, exec_id);

  -- Marcus: Health & Wellness, Stress Relief
  INSERT INTO coach_specialties (coach_id, specialty_id) VALUES
    (coach2_id, health_id),
    (coach2_id, stress_id);

  -- Elena: Relationships, Stress Relief
  INSERT INTO coach_specialties (coach_id, specialty_id) VALUES
    (coach3_id, relations_id),
    (coach3_id, stress_id);

  -- James: Career Growth
  INSERT INTO coach_specialties (coach_id, specialty_id) VALUES
    (coach4_id, career_id);

  -- Assign formats
  -- Sarah: Online, In-Person
  INSERT INTO coach_formats (coach_id, format_id) VALUES
    (coach1_id, online_id),
    (coach1_id, inperson_id);

  -- Marcus: Online
  INSERT INTO coach_formats (coach_id, format_id) VALUES
    (coach2_id, online_id);

  -- Elena: Online, Hybrid
  INSERT INTO coach_formats (coach_id, format_id) VALUES
    (coach3_id, online_id),
    (coach3_id, hybrid_id);

  -- James: Online
  INSERT INTO coach_formats (coach_id, format_id) VALUES
    (coach4_id, online_id);

  -- Add certifications
  INSERT INTO certifications (coach_id, name, issuing_organization) VALUES
    (coach1_id, 'ICF PCC', 'International Coach Federation'),
    (coach1_id, 'MBA', 'Harvard Business School'),
    (coach2_id, 'Certified Health Coach', 'Institute for Integrative Nutrition'),
    (coach2_id, 'Yoga Instructor', '200-Hour RYT'),
    (coach3_id, 'LMFT', 'California Board of Behavioral Sciences'),
    (coach3_id, 'Relationship Expert', 'Gottman Institute'),
    (coach4_id, 'Agile Coach', 'Scrum Alliance'),
    (coach4_id, 'Leadership Certificate', 'Stanford Graduate School of Business');

  -- Add social links
  INSERT INTO social_links (coach_id, platform, url, display_order) VALUES
    (coach1_id, 'LinkedIn', 'https://linkedin.com/in/sarahjenkins', 1),
    (coach1_id, 'Website', 'https://drjenkins.com', 2),
    (coach2_id, 'Instagram', 'https://instagram.com/marcus_wellness', 1),
    (coach3_id, 'Website', 'https://elenacoaching.com', 1),
    (coach4_id, 'LinkedIn', 'https://linkedin.com/in/jamesoconnor', 1),
    (coach4_id, 'Twitter', 'https://twitter.com/jamesoconnor_coach', 2);

  -- Add reviews
  INSERT INTO reviews (coach_id, author_name, rating, review_text, created_at) VALUES
    (coach1_id, 'Mike T.', 5, 'Sarah changed my life. I got the promotion within 3 months of working with her. Highly recommend!', NOW() - INTERVAL '60 days'),
    (coach1_id, 'Anonymous', 4, 'Great advice and very professional, but sometimes hard to schedule sessions.', NOW() - INTERVAL '30 days'),
    (coach2_id, 'Jessica L.', 5, 'I feel lighter and happier after every session with Marcus. His holistic approach really works.', NOW() - INTERVAL '45 days'),
    (coach3_id, 'Tom B.', 2, 'Did not click with her coaching style. Not what I was looking for.', NOW() - INTERVAL '10 days'),
    (coach4_id, 'Sarah K.', 5, 'James helped me transition from senior engineer to engineering manager seamlessly. Worth every penny.', NOW() - INTERVAL '90 days');

  -- Flag one review as an example
  UPDATE reviews SET is_flagged = true WHERE author_name = 'Tom B.';

  -- Add some sample analytics data (profile views)
  INSERT INTO profile_views (coach_id, viewed_at, referrer, session_id)
  SELECT
    coach1_id,
    NOW() - (random() * INTERVAL '30 days'),
    CASE (random() * 3)::INT
      WHEN 0 THEN 'https://google.com'
      WHEN 1 THEN 'https://linkedin.com'
      ELSE 'direct'
    END,
    'session_' || generate_series::text
  FROM generate_series(1, 50);

  INSERT INTO profile_views (coach_id, viewed_at, referrer, session_id)
  SELECT
    coach2_id,
    NOW() - (random() * INTERVAL '30 days'),
    CASE (random() * 3)::INT
      WHEN 0 THEN 'https://google.com'
      WHEN 1 THEN 'https://instagram.com'
      ELSE 'direct'
    END,
    'session_' || (100 + generate_series)::text
  FROM generate_series(1, 30);

END $$;

-- Success message
SELECT 'Sample data inserted successfully!' AS status;
SELECT 'Total coaches: ' || COUNT(*)::text FROM coaches;
SELECT 'Total reviews: ' || COUNT(*)::text FROM reviews;
SELECT 'Total profile views: ' || COUNT(*)::text FROM profile_views;
