// Supabase Edge Function to verify EMCC accreditation via URL
// User provides their EMCC search result URL containing their EIA reference number

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  coachId: string;
  fullName: string;
  profileUrl: string;
  accreditationLevel?: string;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  matchDetails?: {
    name: string;
    eiaNumber?: string;
    level?: string;
    profileUrl?: string;
  };
  reason?: string;
  pendingManualReview?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { coachId, fullName, profileUrl, accreditationLevel }: VerificationRequest = await req.json();

    if (!coachId || !fullName || !profileUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName, profileUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EMCC URL Verification] Starting verification for:', { coachId, fullName, profileUrl });

    // STEP 1: Validate URL format
    const urlValidation = validateEMCCUrl(profileUrl);
    if (!urlValidation.valid) {
      return new Response(
        JSON.stringify({
          verified: false,
          confidence: 0,
          reason: urlValidation.reason
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eiaNumber = urlValidation.eiaNumber!;
    console.log('[EMCC URL Verification] Extracted EIA:', eiaNumber);

    // STEP 2: Check if URL is already used by another coach
    const { data: existingCoaches } = await supabase
      .from('coach_profiles')
      .select('id, name')
      .eq('emcc_profile_url', profileUrl)
      .neq('id', coachId);

    if (existingCoaches && existingCoaches.length > 0) {
      return new Response(
        JSON.stringify({
          verified: false,
          confidence: 0,
          reason: `This EMCC profile URL is already registered to another coach (${existingCoaches[0].name}). Please contact support if this is an error.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 3: Check internal cache for this EIA number
    const normalizedEIA = eiaNumber.trim().toUpperCase().replace(/\s+/g, '');
    const { data: cachedCredential } = await supabase
      .from('verified_credentials')
      .select('*')
      .eq('accreditation_body', 'EMCC')
      .eq('credential_number', normalizedEIA)
      .eq('is_active', true)
      .single();

    if (cachedCredential) {
      console.log('[EMCC URL Verification] Found in cache:', cachedCredential.full_name);

      const nameSimilarity = calculateSimilarity(
        cachedCredential.full_name.toLowerCase().trim(),
        fullName.toLowerCase().trim()
      );

      if (nameSimilarity >= 0.85) {
        const isTempId = coachId.startsWith('temp_');
        if (!isTempId) {
          await supabase.from('coach_profiles').update({
            emcc_verified: true,
            emcc_verified_at: new Date().toISOString(),
            emcc_profile_url: profileUrl,
            accreditation_level: cachedCredential.accreditation_level || accreditationLevel || null,
            verification_status: 'verified',
          }).eq('id', coachId);
        }

        return new Response(
          JSON.stringify({
            verified: true,
            confidence: 100,
            matchDetails: {
              name: cachedCredential.full_name,
              eiaNumber: normalizedEIA,
              level: cachedCredential.accreditation_level,
              profileUrl: profileUrl
            },
            reason: 'Verified from internal database (previously verified)'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `The EIA number ${normalizedEIA} is registered to a different coach. Please verify you're using your own EMCC profile URL.`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // STEP 4: Fetch URL and verify content
    const result = await verifyEMCCUrlContent(profileUrl, fullName, normalizedEIA);

    console.log('[EMCC URL Verification] Verification result:', result);

    // STEP 5: Update database if verified
    const isTempId = coachId.startsWith('temp_');

    if (result.verified && result.matchDetails && !isTempId) {
      await supabase.from('coach_profiles').update({
        emcc_verified: true,
        emcc_verified_at: new Date().toISOString(),
        emcc_profile_url: profileUrl,
        accreditation_level: result.matchDetails.level || accreditationLevel || null,
        verification_status: 'verified',
      }).eq('id', coachId);

      // Add to cache
      await supabase.from('verified_credentials').insert({
        accreditation_body: 'EMCC',
        credential_number: normalizedEIA,
        full_name: result.matchDetails.name,
        accreditation_level: result.matchDetails.level,
        profile_url: profileUrl,
        verified_by: 'url'
      });

      console.log('[EMCC URL Verification] Coach verified and cached');
    } else if (!result.verified && !isTempId) {
      await supabase.from('coach_profiles').update({
        emcc_verified: false,
        verification_status: 'rejected',
      }).eq('id', coachId);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[EMCC URL Verification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Validate EMCC URL format and extract EIA number
 */
function validateEMCCUrl(url: string): { valid: boolean; eiaNumber?: string; reason?: string } {
  try {
    const parsedUrl = new URL(url);

    // Check 1: Must be emccglobal.org domain
    if (!parsedUrl.hostname.includes('emccglobal.org')) {
      return {
        valid: false,
        reason: 'URL must be from emccglobal.org. Please copy the URL from the EMCC directory search results.'
      };
    }

    // Check 2: Must be the EIA awards page
    if (!parsedUrl.pathname.includes('/eia-awards/')) {
      return {
        valid: false,
        reason: 'This is not an EMCC profile URL. Please search for your EIA number on the EMCC directory and copy the results URL.'
      };
    }

    // Check 3: Must have search=1 parameter (indicates it's a search result)
    const searchParam = parsedUrl.searchParams.get('search');
    if (searchParam !== '1') {
      return {
        valid: false,
        reason: 'Please search for your EIA number on the EMCC directory first, then copy the results URL.'
      };
    }

    // Check 4: Must have a reference parameter with EIA number
    const reference = parsedUrl.searchParams.get('reference');
    if (!reference || !reference.trim()) {
      return {
        valid: false,
        reason: 'URL must contain your EIA reference number. Please search by EIA number (not name) and copy that URL.'
      };
    }

    // Check 5: Reference must be in EIA format
    const eiaPattern = /^EIA\d+$/i;
    if (!eiaPattern.test(reference.trim())) {
      return {
        valid: false,
        reason: 'Invalid EIA number format in URL. EIA numbers should look like "EIA20230480".'
      };
    }

    return {
      valid: true,
      eiaNumber: reference.trim().toUpperCase()
    };

  } catch (error) {
    return {
      valid: false,
      reason: 'Invalid URL format. Please copy the complete URL from your browser address bar.'
    };
  }
}

/**
 * Fetch URL and verify content matches expected name
 */
async function verifyEMCCUrlContent(
  url: string,
  expectedName: string,
  expectedEIA: string
): Promise<VerificationResult> {
  try {
    console.log('[EMCC Content Verification] Fetching URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      return {
        verified: false,
        confidence: 0,
        reason: `Could not access EMCC profile (HTTP ${response.status}). Please verify the URL is correct.`
      };
    }

    const html = await response.text();
    console.log('[EMCC Content Verification] Fetched HTML length:', html.length);

    // Validate content
    let confidence = 0;
    const checks: string[] = [];

    // Check 1: Contains EMCC-specific keywords
    const emccKeywords = ['EMCC', 'European', 'Mentoring', 'Coaching', 'Council'];
    const keywordCount = emccKeywords.filter(kw => html.includes(kw)).length;

    if (keywordCount >= 3) {
      confidence += 20;
      checks.push('EMCC page verified');
    } else {
      return {
        verified: false,
        confidence: 0,
        reason: 'Page does not appear to be an EMCC directory page. Please verify the URL is correct.'
      };
    }

    // Check 2: Contains EIA number
    if (html.includes(expectedEIA)) {
      confidence += 30;
      checks.push('EIA number found');
    } else {
      return {
        verified: false,
        confidence,
        reason: `EIA number ${expectedEIA} not found on the page. The search may have returned no results. Please verify the EIA number is correct.`
      };
    }

    // Check 3: Contains expected name parts
    const nameParts = expectedName.toLowerCase().split(' ');
    const htmlLower = html.toLowerCase();
    const nameMatches = nameParts.filter(part => part.length > 2 && htmlLower.includes(part));

    if (nameMatches.length >= nameParts.length * 0.8) {
      confidence += 40;
      checks.push('Name matches');
    } else {
      return {
        verified: false,
        confidence,
        reason: `Name "${expectedName}" not found on the page. Please verify the name matches your EMCC profile exactly.`
      };
    }

    // Check 4: Contains accreditation level keywords
    const levelKeywords = ['Foundation', 'Practitioner', 'Senior', 'Master', 'Advanced'];
    const levelMatch = levelKeywords.find(kw => html.includes(kw));

    if (levelMatch) {
      confidence += 10;
      checks.push('Accreditation level found');
    }

    // Success if confidence >= 70
    if (confidence >= 70) {
      return {
        verified: true,
        confidence,
        matchDetails: {
          name: expectedName,
          eiaNumber: expectedEIA,
          level: levelMatch || undefined,
          profileUrl: url
        },
        reason: `Successfully verified via EMCC profile URL (${checks.join(', ')})`
      };
    } else {
      return {
        verified: false,
        confidence,
        reason: 'Could not verify all required information on the page. Please ensure the URL shows your complete profile.'
      };
    }

  } catch (error) {
    console.error('[EMCC Content Verification] Error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: `Failed to verify profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
