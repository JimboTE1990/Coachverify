-- Fix missing coach profile for verified user
-- Run this in Supabase SQL Editor

-- Insert coach profile for user 0dd9db9e-7d61-4297-8c10-f4356d53f683
INSERT INTO coaches (
  user_id,
  name,
  email,
  is_verified,
  documents_submitted,
  subscription_status,
  billing_cycle,
  two_factor_enabled
)
SELECT
  id as user_id,
  COALESCE(raw_user_meta_data->>'full_name', 'Coach User') as name,
  email,
  true as is_verified,
  false as documents_submitted,
  'onboarding' as subscription_status,
  'monthly' as billing_cycle,
  false as two_factor_enabled
FROM auth.users
WHERE id = '0dd9db9e-7d61-4297-8c10-f4356d53f683'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the coach was created
SELECT * FROM coaches WHERE user_id = '0dd9db9e-7d61-4297-8c10-f4356d53f683';
