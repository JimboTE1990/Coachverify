/**
 * EMCC Accreditation Verification Service
 * Calls Supabase Edge Function to verify coach accreditation
 */

import { supabase } from '../lib/supabase';

export interface EMCCVerificationRequest {
  coachId: string;
  fullName: string;
  accreditationLevel?: string;
  country?: string;
}

export interface EMCCVerificationResult {
  verified: boolean;
  confidence: number;
  matchDetails?: {
    name: string;
    level?: string;
    country?: string;
    profileUrl?: string;
  };
  reason?: string;
}

/**
 * Verify a coach's EMCC accreditation by searching the public EMCC directory
 * This is called automatically during onboarding when coach selects EMCC as accreditation body
 */
export const verifyEMCCAccreditation = async (
  request: EMCCVerificationRequest
): Promise<EMCCVerificationResult> => {
  try {
    console.log('[EMCC Verification] Starting verification:', request);

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('verify-emcc-accreditation', {
      body: request,
    });

    if (error) {
      console.error('[EMCC Verification] Error calling function:', error);
      throw error;
    }

    console.log('[EMCC Verification] Result:', data);
    return data as EMCCVerificationResult;

  } catch (error) {
    console.error('[EMCC Verification] Unexpected error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Check if a coach needs EMCC verification
 * Returns true if coach has selected EMCC but hasn't been verified yet
 */
export const needsEMCCVerification = (coach: {
  accreditationBody?: string;
  emccVerified?: boolean;
}): boolean => {
  return coach.accreditationBody === 'EMCC' && !coach.emccVerified;
};

/**
 * Get user-friendly status message for verification result
 */
export const getVerificationStatusMessage = (result: EMCCVerificationResult): string => {
  if (result.verified) {
    if (result.confidence >= 90) {
      return '✅ EMCC accreditation verified! Your profile has been updated.';
    } else if (result.confidence >= 80) {
      return '✅ EMCC accreditation verified with high confidence. Your profile has been updated.';
    } else {
      return '⚠️ EMCC accreditation verified, but with moderate confidence. Please ensure your details are correct.';
    }
  } else {
    if (result.confidence >= 30) {
      return '⚠️ We found possible matches in the EMCC directory, but couldn\'t confirm your accreditation automatically. Please contact support for manual verification.';
    } else {
      return `❌ We couldn't verify your EMCC accreditation automatically. ${result.reason || 'Please contact support for manual verification.'}`;
    }
  }
};
