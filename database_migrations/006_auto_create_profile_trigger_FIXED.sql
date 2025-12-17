-- =============================================
-- CORRECTED: Auto-Create Coach Profile on Email Confirmation
-- =============================================
-- Fixed to match actual coaches table schema
-- Date: December 13, 2025
-- =============================================

-- Drop the broken trigger first
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_email_confirmation();

-- Create CORRECTED function
CREATE OR REPLACE FUNCTION public.handle_new_user_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name_val TEXT;
  trial_end_date TIMESTAMPTZ;
  existing_profile_id UUID;
BEGIN
  -- Only proceed if email was just confirmed
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

    -- Calculate trial end date (30 days from now)
    trial_end_date := NOW() + INTERVAL '30 days';

    RAISE LOG 'handle_new_user_email_confirmation: Creating profile for user % with name: %', NEW.id, full_name_val;

    -- Create coach profile with ONLY columns that exist in actual schema
    INSERT INTO public.coaches (
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
      subscription_status,
      billing_cycle,
      trial_ends_at,
      two_factor_enabled
    ) VALUES (
      NEW.id,
      full_name_val,
      NEW.email,
      '', -- Empty phone
      '', -- Empty photo URL
      '', -- Empty bio
      '', -- Empty location
      0, -- Rate to be set later
      0, -- Experience to be set later
      true, -- Email verification = verified
      false, -- No documents yet
      'trial', -- Auto-activate 30-day trial
      'monthly', -- Default billing cycle
      trial_end_date,
      false -- 2FA disabled by default
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

-- Create trigger
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_email_confirmation();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_email_confirmation() TO postgres, service_role;

-- =============================================
-- VERIFICATION
-- =============================================
-- 1. Check trigger exists:
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_email_confirmed';

-- 2. Test with next signup - profile should be created automatically
-- =============================================

COMMENT ON FUNCTION public.handle_new_user_email_confirmation() IS
'Auto-creates coach profile when user confirms their email. Schema corrected to match actual coaches table.';
