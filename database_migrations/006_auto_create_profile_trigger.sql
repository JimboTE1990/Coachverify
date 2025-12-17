-- =============================================
-- AUTHENTICATION REBUILD: Auto-Create Coach Profile on Email Confirmation
-- =============================================
-- This migration eliminates the need for custom VerifyEmail.tsx logic
-- by creating coach profiles automatically when users confirm their email.
--
-- WHY THIS FIX WORKS:
-- - No more hanging setSession() calls in frontend
-- - No race conditions between auth state and profile creation
-- - Profile creation happens server-side in database trigger
-- - User can log in immediately after email confirmation
--
-- Date: December 13, 2025
-- Related to: Email verification hanging issue (setSession deadlock)
-- =============================================

-- Function to auto-create coach profile when user confirms email
CREATE OR REPLACE FUNCTION public.handle_new_user_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name_val TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
  trial_end_date TIMESTAMPTZ;
  existing_profile_id UUID;
BEGIN
  -- Only proceed if email was just confirmed (email_confirmed_at changed from NULL to a timestamp)
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN

    RAISE LOG 'handle_new_user_email_confirmation: Email confirmed for user %', NEW.id;

    -- Check if coach profile already exists (prevent duplicates)
    SELECT id INTO existing_profile_id
    FROM public.coaches
    WHERE user_id = NEW.id;

    IF existing_profile_id IS NOT NULL THEN
      RAISE LOG 'handle_new_user_email_confirmation: Profile already exists for user %, skipping', NEW.id;
      RETURN NEW;
    END IF;

    -- Extract name from user metadata
    full_name_val := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    );

    first_name_val := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(full_name_val, ' ', 1)
    );

    last_name_val := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NULLIF(substring(full_name_val from position(' ' in full_name_val) + 1), '')
    );

    -- Calculate trial end date (30 days from now)
    trial_end_date := NOW() + INTERVAL '30 days';

    RAISE LOG 'handle_new_user_email_confirmation: Creating profile for user % with name: %', NEW.id, full_name_val;

    -- Create coach profile with all required fields
    INSERT INTO public.coaches (
      user_id,
      name,
      first_name,
      last_name,
      email,
      is_verified,
      documents_submitted,
      subscription_status,
      billing_cycle,
      trial_ends_at,
      trial_used,
      two_factor_enabled,
      photo_url,
      bio,
      location,
      hourly_rate,
      years_experience,
      certifications,
      specialties,
      available_formats,
      phone_number,
      social_links,
      reviews,
      profile_visible,
      dashboard_access
    ) VALUES (
      NEW.id,
      full_name_val,
      first_name_val,
      last_name_val,
      NEW.email,
      true, -- Email confirmation = verified
      false, -- No documents submitted yet
      'trial', -- Auto-activate 30-day trial
      'monthly', -- Default billing cycle
      trial_end_date,
      false, -- Trial not consumed until payment
      false, -- 2FA disabled by default
      '', -- Empty photo URL
      '', -- Empty bio
      '', -- Empty location
      0, -- Coach will set rate later
      0, -- Coach will set experience later
      ARRAY[]::TEXT[], -- Empty certifications
      ARRAY[]::TEXT[], -- Empty specialties
      ARRAY[]::TEXT[], -- Empty formats
      '', -- Empty phone
      ARRAY[]::JSONB[], -- Empty social links
      ARRAY[]::JSONB[], -- Empty reviews
      true, -- Profile visible (trial users are visible)
      true -- Dashboard access enabled
    );

    RAISE LOG 'handle_new_user_email_confirmation: ✅ Profile created successfully for user %', NEW.id;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block email confirmation
    RAISE WARNING 'handle_new_user_email_confirmation: Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users table (only fires on UPDATE)
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_email_confirmation();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_email_confirmation() TO postgres, service_role;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these after migration to verify it works:
--
-- 1. Check if trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_email_confirmed';
--
-- 2. Check if function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'handle_new_user_email_confirmation';
--
-- 3. Test with a new signup:
--    - Sign up via app
--    - Click email verification link
--    - Check if profile was auto-created:
--      SELECT * FROM coaches WHERE email = 'your-test-email@example.com';
--
-- 4. Check trigger logs in Supabase Dashboard → Database → Logs
-- =============================================

COMMENT ON FUNCTION public.handle_new_user_email_confirmation() IS
'Auto-creates coach profile when user confirms their email. Eliminates need for custom VerifyEmail.tsx logic and prevents setSession() deadlock issues.';
