-- Create Demo User for Testing
-- Run this in Supabase SQL Editor to create sarah@example.com test account

-- This SQL creates a user directly in Supabase Auth
-- Note: You'll need to run this as a Supabase admin

-- Insert auth user (password will be 'demo123')
-- The password hash below is bcrypt for 'demo123'
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sarah@example.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- Note: Save the returned ID to use in the next step
-- Or use this query to get it:
-- SELECT id FROM auth.users WHERE email = 'sarah@example.com';
