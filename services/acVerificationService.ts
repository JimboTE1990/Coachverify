/**
 * Association for Coaching (AC) Verification Service
 * Verifies coach accreditation status via AC Member Directory
 */

import { supabase } from './supabaseClient';

export interface ACVerificationResult {
  verified: boolean;
  level?: string;
  name?: string;
  location?: string;
  errorMessage?: string;
}

/**
 * Verify AC accreditation by scraping the coach's AC profile URL
 *
 * AC profiles show:
 * - "Coach Accredited: Yes/No"
 * - "Individual Accreditation Type: Coach Accreditation"
 * - "AC Coach Accreditation Level: AC Accredited Coach" (or other level)
 */
export const verifyACAccreditation = async (
  profileUrl: string,
  coachName: string
): Promise<ACVerificationResult> => {
  try {
    console.log('[AC Verification] Starting verification for:', { profileUrl, coachName });

    // Validate URL format
    if (!profileUrl.includes('associationforcoaching.com')) {
      return {
        verified: false,
        errorMessage: 'Invalid AC profile URL. Must be from associationforcoaching.com'
      };
    }

    // Call edge function to scrape AC profile
    const { data, error } = await supabase.functions.invoke('verify-ac-accreditation', {
      body: {
        profileUrl,
        coachName
      }
    });

    if (error) {
      console.error('[AC Verification] Edge function error:', error);
      return {
        verified: false,
        errorMessage: `Verification failed: ${error.message}`
      };
    }

    console.log('[AC Verification] Result:', data);

    if (!data || !data.verified) {
      return {
        verified: false,
        errorMessage: data?.errorMessage || 'Could not verify AC accreditation. Please check your profile URL and ensure your AC profile shows "Coach Accredited: Yes".'
      };
    }

    return {
      verified: true,
      level: data.level,
      name: data.name,
      location: data.location
    };

  } catch (error) {
    console.error('[AC Verification] Unexpected error:', error);
    return {
      verified: false,
      errorMessage: 'An unexpected error occurred during verification. Please try again.'
    };
  }
};

/**
 * Check if AC verification is needed for a coach
 */
export const needsACVerification = (coach: any): boolean => {
  // Need verification if:
  // 1. Accreditation body is AC
  // 2. Not already verified
  // 3. Has a profile URL
  return (
    coach.accreditationBody === 'AC' &&
    !coach.acVerified &&
    !!coach.acProfileUrl
  );
};

/**
 * Get user-friendly verification status message
 */
export const getACVerificationStatusMessage = (coach: any): string => {
  if (!coach.accreditationBody || coach.accreditationBody !== 'AC') {
    return '';
  }

  if (coach.acVerified) {
    return 'AC accreditation verified ✓';
  }

  if (!coach.acProfileUrl) {
    return 'Please add your AC member profile URL to verify your accreditation';
  }

  return 'Verification pending - click to verify your AC accreditation';
};
