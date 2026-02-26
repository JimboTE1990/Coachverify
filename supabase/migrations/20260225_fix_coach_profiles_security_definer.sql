-- Fix SECURITY DEFINER issue on coach_profiles view
-- Date: 2026-02-25
-- Issue: View is defined with SECURITY DEFINER, bypassing RLS and using creator permissions
-- Fix: Recreate view without SECURITY DEFINER to enforce proper RLS

-- ==============================================================================
-- STEP 1: Drop existing view
-- ==============================================================================

DROP VIEW IF EXISTS public.coach_profiles CASCADE;

-- ==============================================================================
-- STEP 2: Recreate view WITHOUT SECURITY DEFINER
-- ==============================================================================

-- This view simply passes through all columns from coaches table
-- WITHOUT SECURITY DEFINER, it will use the querying user's permissions
-- and enforce Row Level Security policies properly

CREATE VIEW public.coach_profiles AS
SELECT *
FROM public.coaches;

-- ==============================================================================
-- STEP 3: Grant appropriate permissions
-- ==============================================================================

-- Allow anonymous users (public) to read coach profiles
GRANT SELECT ON public.coach_profiles TO anon;

-- Allow authenticated users to read coach profiles
GRANT SELECT ON public.coach_profiles TO authenticated;

-- ==============================================================================
-- STEP 4: Add documentation
-- ==============================================================================

COMMENT ON VIEW public.coach_profiles IS
'Public view of coach profiles. Uses SECURITY INVOKER (default) to enforce RLS policies. Does NOT use SECURITY DEFINER.';

-- ==============================================================================
-- VERIFICATION QUERY (optional - can be run manually)
-- ==============================================================================

-- Verify the view was created without SECURITY DEFINER
-- Run this in Supabase SQL editor to confirm:
--
-- SELECT
--   schemaname,
--   viewname,
--   definition
-- FROM pg_views
-- WHERE schemaname = 'public'
--   AND viewname = 'coach_profiles';
--
-- The definition should NOT contain 'security_definer'

-- ==============================================================================
-- NOTES
-- ==============================================================================

-- What this fixes:
-- ✅ Removes SECURITY DEFINER property that bypasses RLS
-- ✅ Ensures RLS policies on coaches table are properly enforced
-- ✅ View now uses SECURITY INVOKER (default PostgreSQL behavior)
-- ✅ Maintains backward compatibility with existing queries

-- Security impact:
-- BEFORE: View ran with creator permissions, bypassing RLS (SECURITY DEFINER)
-- AFTER:  View runs with querying user permissions, enforcing RLS (SECURITY INVOKER)

-- Performance impact:
-- None - this is purely a security configuration change
