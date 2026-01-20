/**
 * ICF Accreditation Verification Service
 * Calls Supabase Edge Function to verify coach ICF credentials
 */

import { supabase } from '../lib/supabase';

export interface ICFVerificationRequest {
  coachId: string;
  fullName: string;
  credentialLevel: 'ACC' | 'PCC' | 'MCC'; // ICF credential level - REQUIRED
  country?: string;
}

export interface ICFVerificationResult {
  verified: boolean;
  confidence: number;
  matchDetails?: {
    name: string;
    credential?: string;
    country?: string;
    profileUrl?: string;
  };
  reason?: string;
}

/**
 * Verify a coach's ICF credential by searching the public ICF directory
 * This is called automatically during onboarding when coach selects ICF as accreditation body
 */
export const verifyICFAccreditation = async (
  request: ICFVerificationRequest
): Promise<ICFVerificationResult> => {
  try {
    console.log('[ICF Verification] Starting verification:', request);

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('verify-icf-accreditation', {
      body: request,
    });

    if (error) {
      console.error('[ICF Verification] Error calling function:', error);
      throw error;
    }

    console.log('[ICF Verification] Result:', data);
    return data as ICFVerificationResult;

  } catch (error) {
    console.error('[ICF Verification] Unexpected error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Check if a coach needs ICF verification
 * Returns true if coach has selected ICF but hasn't been verified yet
 */
export const needsICFVerification = (coach: {
  accreditationBody?: string;
  icfVerified?: boolean;
}): boolean => {
  return coach.accreditationBody === 'ICF' && !coach.icfVerified;
};

/**
 * Get user-friendly status message for verification result
 */
export const getICFVerificationStatusMessage = (result: ICFVerificationResult): string => {
  if (result.verified) {
    if (result.confidence >= 90) {
      return '✅ ICF credential verified! Your profile has been updated.';
    } else if (result.confidence >= 80) {
      return '✅ ICF credential verified with high confidence. Your profile has been updated.';
    } else {
      return '⚠️ ICF credential verified, but with moderate confidence. Please ensure your details are correct.';
    }
  } else {
    if (result.confidence >= 30) {
      return '⚠️ We found possible matches in the ICF directory, but couldn\'t confirm your credential automatically. Please contact support for manual verification.';
    } else {
      return `❌ We couldn't verify your ICF credential automatically. ${result.reason || 'Please contact support for manual verification.'}`;
    }
  }
};
