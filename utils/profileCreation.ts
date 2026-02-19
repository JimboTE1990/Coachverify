import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface CoachProfileData {
  user_id: string;
  name: string;
  email: string;
  is_verified: boolean;
  documents_submitted?: boolean;
  subscription_status?: string;
  billing_cycle?: string;
  two_factor_enabled?: boolean;
}

/**
 * Robust coach profile creation with retry logic and comprehensive error handling
 *
 * @param userData - Supabase user object
 * @param additionalData - Optional additional profile data
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns The created coach profile ID or throws an error
 */
export async function createCoachProfile(
  userData: User,
  additionalData?: {
    name?: string;
    is_verified?: boolean;
    referral_source?: string;
  },
  maxRetries: number = 3
): Promise<string> {
  console.log('[ProfileCreation] Starting profile creation for user:', userData.id);
  console.log('[ProfileCreation] User metadata:', userData.user_metadata);
  console.log('[ProfileCreation] Additional data:', additionalData);

  // First, check if profile already exists
  const { data: existingCoach, error: checkError } = await supabase
    .from('coaches')
    .select('id')
    .eq('user_id', userData.id)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('[ProfileCreation] Error checking for existing profile:', checkError);
    throw new Error(`Failed to check for existing profile: ${checkError.message}`);
  }

  if (existingCoach) {
    console.log('[ProfileCreation] Profile already exists:', existingCoach.id);
    return existingCoach.id;
  }

  // Prepare profile data
  const fullName = additionalData?.name || userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'Coach';
  const firstName = userData.user_metadata?.first_name || fullName.split(' ')[0] || 'Coach';
  const lastName = userData.user_metadata?.last_name || fullName.split(' ').slice(1).join(' ') || '';

  // Calculate trial end date (30 days from now)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const profileData: CoachProfileData = {
    user_id: userData.id,
    name: fullName,
    email: userData.email || '',
    is_verified: additionalData?.is_verified ?? true, // Default to true if they've completed verification
    documents_submitted: false,
    subscription_status: 'trial', // Auto-activate trial immediately
    billing_cycle: 'monthly',
    two_factor_enabled: false,
  };

  // Add ALL required fields including those with no defaults
  const insertData: any = {
    ...profileData,
    first_name: firstName,
    last_name: lastName,
    trial_ends_at: trialEndsAt.toISOString(),
    trial_used: false, // Trial not consumed until they add payment method
    // Required fields that can't be null
    photo_url: '', // Empty string default
    bio: '', // Empty string default
    location: '', // Empty string default
    hourly_rate: 0, // Default to 0, coach will set later
    years_experience: 0, // Default to 0, coach will set later
    certifications: [], // Empty array
    specialties: [], // Empty array
    available_formats: [], // Empty array
    phone_number: '', // Empty string default
    social_links: [], // Empty array
    reviews: [], // Empty array
    // Optional fields for visibility management
    profile_visible: true, // Trial users should be visible
    dashboard_access: true, // Trial users have dashboard access
    // Partner referral source (if coach arrived via a partner URL)
    referral_source: additionalData?.referral_source || null,
  };

  console.log('[ProfileCreation] Profile data to insert:', insertData);

  // Retry logic for profile creation
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ProfileCreation] Attempt ${attempt}/${maxRetries} to create profile...`);

      const { data: newCoach, error: insertError } = await supabase
        .from('coaches')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        // Check if it's a duplicate key error (profile was created between check and insert)
        if (insertError.code === '23505') { // PostgreSQL unique violation
          console.log('[ProfileCreation] Profile was created concurrently, fetching it...');
          const { data: existingProfile } = await supabase
            .from('coaches')
            .select('id')
            .eq('user_id', userData.id)
            .single();

          if (existingProfile) {
            console.log('[ProfileCreation] Successfully fetched concurrently created profile:', existingProfile.id);
            return existingProfile.id;
          }
        }

        throw insertError;
      }

      if (!newCoach) {
        throw new Error('Profile creation returned no data');
      }

      console.log('[ProfileCreation] ✅ Profile created successfully:', newCoach.id);
      return newCoach.id;

    } catch (error: any) {
      lastError = error;
      console.error(`[ProfileCreation] Attempt ${attempt}/${maxRetries} failed:`, error);

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const waitTime = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
        console.log(`[ProfileCreation] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  console.error('[ProfileCreation] ❌ All retry attempts failed. Last error:', lastError);
  throw new Error(`Failed to create coach profile after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Ensures a coach profile exists for a given user, creating one if needed
 * Used as a safety check during login or after email verification
 *
 * @param userId - Supabase user ID
 * @param email - User email (fallback if user object not available)
 * @returns The coach profile ID
 */
export async function ensureCoachProfile(userId: string, email?: string): Promise<string | null> {
  console.log('[ProfileCreation] Ensuring profile exists for user:', userId);

  try {
    // Check if profile exists
    const { data: existingCoach, error: checkError } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[ProfileCreation] Error checking profile:', checkError);
      return null;
    }

    if (existingCoach) {
      console.log('[ProfileCreation] Profile exists:', existingCoach.id);
      return existingCoach.id;
    }

    // Profile doesn't exist, fetch user data and create it
    console.log('[ProfileCreation] Profile missing, fetching user data...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[ProfileCreation] Could not fetch user data:', userError);
      return null;
    }

    // Create profile with available data
    const profileId = await createCoachProfile(user, {
      is_verified: user.email_confirmed_at ? true : false
    });

    return profileId;

  } catch (error: any) {
    console.error('[ProfileCreation] Error in ensureCoachProfile:', error);
    return null;
  }
}
