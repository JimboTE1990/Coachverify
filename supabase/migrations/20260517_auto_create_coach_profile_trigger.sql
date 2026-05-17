-- Auto-create coach profile on email confirmation
--
-- The trigger in database_migrations/006_auto_create_profile_trigger_FIXED.sql was
-- never added to supabase/migrations/ so it was never applied to the live database.
-- This migration creates it properly, using the real live schema confirmed 2026-05-17.
--
-- Key design notes:
--   - accreditation_level is constrained to EMCC values only — ICF level goes to icf_accreditation_level
--   - SECURITY DEFINER bypasses the column-level REVOKE in 20260317_restrict_coaches_insert.sql

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_email_confirmation();

CREATE OR REPLACE FUNCTION public.handle_new_user_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name_val  TEXT;
  trial_end_date TIMESTAMPTZ;
  existing_id    UUID;
  meta           JSONB;
  body           TEXT;
  level          TEXT;
BEGIN
  -- Only fire when email_confirmed_at transitions from NULL → value
  IF NEW.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  RAISE LOG 'handle_new_user_email_confirmation: email confirmed for user %', NEW.id;

  -- Bail out if profile already exists (prevents duplicates on re-confirmation)
  SELECT id INTO existing_id FROM public.coaches WHERE user_id = NEW.id;
  IF existing_id IS NOT NULL THEN
    RAISE LOG 'handle_new_user_email_confirmation: profile already exists for %, skipping', NEW.id;
    RETURN NEW;
  END IF;

  meta           := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  full_name_val  := COALESCE(meta->>'full_name', NEW.email);
  trial_end_date := NOW() + INTERVAL '30 days';
  body           := meta->>'accreditation_body';
  level          := meta->>'accreditation_level';

  RAISE LOG 'handle_new_user_email_confirmation: creating profile for % (body: %, level: %)', NEW.id, body, level;

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
    two_factor_enabled,
    documents_submitted,
    -- Subscription / trial (SECURITY DEFINER bypasses REVOKE)
    is_verified,
    subscription_status,
    billing_cycle,
    trial_ends_at,
    -- Visibility
    profile_visible,
    dashboard_access,
    -- Accreditation body and verification flags
    accreditation_body,
    emcc_verified,
    icf_verified,
    ac_verified,
    verification_status,
    -- Body-specific level columns (constrained — must route to correct column)
    emcc_accreditation_level,
    icf_accreditation_level,
    -- Referral
    referral_source
  ) VALUES (
    NEW.id,
    full_name_val,
    NEW.email,
    '',
    '',
    '',
    '',
    0,
    0,
    false,
    false,
    -- Subscription / trial
    true,
    'trial',
    'monthly',
    trial_end_date,
    -- Visibility
    true,
    true,
    -- Accreditation
    body,
    COALESCE((meta->>'emcc_verified')::boolean, false),
    COALESCE((meta->>'icf_verified')::boolean, false),
    COALESCE((meta->>'ac_verified')::boolean, false),
    COALESCE(meta->>'verification_status', 'pending'),
    -- EMCC level only when body is EMCC (constrained to EMCC values)
    CASE WHEN body = 'EMCC' THEN level ELSE NULL END,
    -- ICF level only when body is ICF (constrained to ACC/PCC/MCC/ACTC)
    CASE WHEN body = 'ICF' AND level IN ('ACC', 'PCC', 'MCC', 'ACTC') THEN level ELSE NULL END,
    -- Referral source if stored in metadata
    meta->>'referral_source'
  );

  RAISE LOG 'handle_new_user_email_confirmation: profile created for %', NEW.id;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log but never block email confirmation
    RAISE WARNING 'handle_new_user_email_confirmation: failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_email_confirmation();

GRANT EXECUTE ON FUNCTION public.handle_new_user_email_confirmation() TO postgres, service_role;
