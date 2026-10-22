-- Guard both coach profile triggers against community OTP users.
-- When signInWithOtp is called from AskQuestionModal it passes
-- data: { role: 'community' } in user metadata. Without this guard,
-- handle_new_user() (INSERT trigger) creates a coach profile immediately
-- on user creation, and handle_new_user_email_confirmation() (UPDATE trigger)
-- would create another on email confirmation.
--
-- Uses CREATE OR REPLACE to update existing functions in-place;
-- triggers themselves do not need to be recreated.

-- ── handle_new_user (fires on INSERT — this is the main culprit) ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip coach profile creation for community Q&A users
  IF (COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)->>'role') = 'community' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.coaches (
    user_id,
    name,
    email,
    subscription_status,
    trial_ends_at,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Coach'),
    NEW.email,
    'trial',
    NOW() + INTERVAL '30 days',
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- ── handle_new_user_email_confirmation (fires on UPDATE) ──────────────────────

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

  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  -- Only create a coach profile when the user came through the coach signup flow,
  -- which always sets accreditation_body. Community OTP users never set this field.
  IF (meta->>'accreditation_body') IS NULL THEN
    RAISE LOG 'handle_new_user_email_confirmation: no accreditation_body for user %, skipping coach profile', NEW.id;
    RETURN NEW;
  END IF;

  -- Bail out if profile already exists (prevents duplicates on re-confirmation)
  SELECT id INTO existing_id FROM public.coaches WHERE user_id = NEW.id;
  IF existing_id IS NOT NULL THEN
    RAISE LOG 'handle_new_user_email_confirmation: profile already exists for %, skipping', NEW.id;
    RETURN NEW;
  END IF;

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
    is_verified,
    subscription_status,
    billing_cycle,
    trial_ends_at,
    profile_visible,
    dashboard_access,
    accreditation_body,
    emcc_verified,
    icf_verified,
    ac_verified,
    verification_status,
    emcc_accreditation_level,
    icf_accreditation_level,
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
    true,
    'trial',
    'monthly',
    trial_end_date,
    true,
    true,
    body,
    COALESCE((meta->>'emcc_verified')::boolean, false),
    COALESCE((meta->>'icf_verified')::boolean, false),
    COALESCE((meta->>'ac_verified')::boolean, false),
    COALESCE(meta->>'verification_status', 'pending'),
    CASE WHEN body = 'EMCC' THEN level ELSE NULL END,
    CASE WHEN body = 'ICF' AND level IN ('ACC', 'PCC', 'MCC', 'ACTC') THEN level ELSE NULL END,
    meta->>'referral_source'
  );

  RAISE LOG 'handle_new_user_email_confirmation: profile created for %', NEW.id;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user_email_confirmation: failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
