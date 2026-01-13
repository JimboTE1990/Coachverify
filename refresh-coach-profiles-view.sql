-- ============================================
-- Refresh coach_profiles VIEW to include new columns
-- ============================================
-- Run this AFTER running supabase-add-missing-columns.sql
-- This recreates the view to include all new columns from coaches table
-- ============================================

-- Step 1: Check current view definition (for reference)
-- SELECT definition FROM pg_views WHERE viewname = 'coach_profiles';

-- Step 2: Drop the existing view
DROP VIEW IF EXISTS coach_profiles CASCADE;

-- Step 3: Recreate the view with ALL columns including new ones
CREATE VIEW coach_profiles AS
SELECT
  c.id,
  c.user_id,
  c.name,
  c.email,
  c.phone_number,
  c.photo_url,
  c.bio,
  c.location,
  c.hourly_rate,
  c.years_experience,
  c.is_verified,
  c.documents_submitted,
  c.subscription_status,
  c.trial_ends_at,
  c.trial_used,
  c.billing_cycle,
  c.last_payment_date,
  c.two_factor_enabled,
  c.created_at,
  c.updated_at,

  -- NEW: Enhanced profile fields
  c.currency,
  c.accreditation_level,
  c.additional_certifications,
  c.coaching_hours,
  c.location_radius,
  c.qualifications,
  c.acknowledgements,
  c.coaching_expertise,
  c.cpd_qualifications,
  c.coaching_languages,
  c.gender,

  -- Cancellation tracking
  c.cancelled_at,
  c.subscription_ends_at,
  c.cancel_reason,
  c.cancel_feedback,
  c.data_retention_preference,
  c.scheduled_deletion_at,

  -- Profile visibility
  c.profile_visible,
  c.dashboard_access,

  -- Stripe (future)
  c.stripe_customer_id,
  c.stripe_subscription_id,

  -- Verification body
  c.verification_body,

  -- Aggregated data from related tables
  COALESCE(
    (SELECT json_agg(s.specialty)
     FROM coach_specialties cs
     JOIN specialties s ON cs.specialty_id = s.id
     WHERE cs.coach_id = c.id),
    '[]'::json
  ) AS specialties,

  COALESCE(
    (SELECT json_agg(f.format)
     FROM coach_formats cf
     JOIN formats f ON cf.format_id = f.id
     WHERE cf.coach_id = c.id),
    '[]'::json
  ) AS formats,

  COALESCE(
    (SELECT json_agg(cert.certification)
     FROM coach_certifications cc
     JOIN certifications cert ON cc.certification_id = cert.id
     WHERE cc.coach_id = c.id),
    '[]'::json
  ) AS certifications,

  -- Languages (legacy field, may be superseded by coaching_languages)
  COALESCE(
    (SELECT json_agg(cl.language)
     FROM coach_languages cl
     WHERE cl.coach_id = c.id),
    '[]'::json
  ) AS languages,

  -- Review statistics
  COALESCE(
    (SELECT AVG(rating)::numeric(3,2)
     FROM reviews
     WHERE coach_id = c.id
     AND is_flagged = false),
    0
  ) AS average_rating,

  COALESCE(
    (SELECT COUNT(*)::integer
     FROM reviews
     WHERE coach_id = c.id
     AND is_flagged = false),
    0
  ) AS total_reviews

FROM coaches c;

-- Step 4: Grant permissions (if needed)
-- GRANT SELECT ON coach_profiles TO authenticated;
-- GRANT SELECT ON coach_profiles TO anon;

-- ============================================
-- Verification
-- ============================================
-- Check that the view was created successfully:
SELECT COUNT(*) as total_coaches_in_view FROM coach_profiles;

-- Check that new columns are accessible:
SELECT
  id,
  name,
  currency,
  gender,
  accreditation_level,
  coaching_hours
FROM coach_profiles
LIMIT 5;
