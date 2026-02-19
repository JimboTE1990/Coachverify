// Supabase Edge Function to verify ICF accreditation via URL + Location
// User provides their ICF directory search URL + location to disambiguate

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
  location: string; // NEW: City, Country (e.g., "London, UK")
  accreditationLevel: string; // ACC, PCC, MCC, ACTC
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  matchDetails?: {
    name: string;
    location?: string;
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

    const { coachId, fullName, profileUrl, location, accreditationLevel }: VerificationRequest = await req.json();

    if (!coachId || !fullName || !profileUrl || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName, profileUrl, location' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ICF URL Verification] Starting verification for:', { coachId, fullName, profileUrl, location });

    // STEP 1: Validate URL format
    const urlValidation = validateICFUrl(profileUrl);
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

    const { firstname, lastname } = urlValidation;

    // STEP 2: Verify entered name matches URL parameters
    const nameMatchesUrl = validateNameMatchesUrl(fullName, firstname || '', lastname || '');
    if (!nameMatchesUrl) {
      return new Response(
        JSON.stringify({
          verified: false,
          confidence: 0,
          reason: `The name in the URL (${firstname} ${lastname}) doesn't match the name you entered (${fullName}). Please verify both are correct.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 3: Check internal cache for this name + location combo
    // Note: We do NOT check URL uniqueness for ICF because search URLs can show multiple coaches
    // Unlike EMCC (which has unique EIA numbers), ICF search results can contain multiple people
    const cacheKey = `${fullName.trim().toUpperCase()}_${location.trim().toUpperCase()}`;
    const { data: cachedCredential } = await supabase
      .from('verified_credentials')
      .select('*')
      .eq('accreditation_body', 'ICF')
      .eq('credential_number', cacheKey)
      .eq('is_active', true)
      .single();

    if (cachedCredential) {
      console.log('[ICF URL Verification] Found in cache:', cachedCredential.full_name);

      const isTempId = coachId.startsWith('temp_');
      if (!isTempId) {
        await supabase.from('coach_profiles').update({
          icf_verified: true,
          icf_verified_at: new Date().toISOString(),
          icf_profile_url: profileUrl,
          icf_location: location,
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
            location: cachedCredential.location,
            level: cachedCredential.accreditation_level,
            profileUrl: profileUrl
          },
          reason: 'Verified from internal database (previously verified)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 5: Fetch URL and verify content
    const result = await verifyICFUrlContent(
      profileUrl,
      fullName,
      location,
      accreditationLevel
    );

    console.log('[ICF URL Verification] Verification result:', result);

    // STEP 6: Update database if verified
    const isTempId = coachId.startsWith('temp_');

    if (result.verified && result.matchDetails && !isTempId) {
      await supabase.from('coach_profiles').update({
        icf_verified: true,
        icf_verified_at: new Date().toISOString(),
        icf_profile_url: profileUrl,
        icf_location: location,
        accreditation_level: result.matchDetails.level || accreditationLevel || null,
        verification_status: 'verified',
      }).eq('id', coachId);

      // Add to cache
      await supabase.from('verified_credentials').insert({
        accreditation_body: 'ICF',
        credential_number: cacheKey,
        full_name: fullName,
        location: location,
        accreditation_level: result.matchDetails.level,
        profile_url: profileUrl,
        verified_by: 'url'
      });

      console.log('[ICF URL Verification] Coach verified and cached');
    } else if (!result.verified && !isTempId) {
      await supabase.from('coach_profiles').update({
        icf_verified: false,
        verification_status: result.pendingManualReview ? 'pending_review' : 'rejected',
      }).eq('id', coachId);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ICF URL Verification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Validate ICF URL format and extract name parameters
 */
function validateICFUrl(url: string): { valid: boolean; firstname?: string; lastname?: string; reason?: string } {
  try {
    const parsedUrl = new URL(url);

    // Check 1: Must be coachingfederation.org domain
    if (!parsedUrl.hostname.includes('coachingfederation.org')) {
      return {
        valid: false,
        reason: 'URL must be from coachingfederation.org. Please copy the URL from the ICF directory search results.'
      };
    }

    // Check 2: Must be the directory page
    if (!parsedUrl.pathname.includes('/DynamicPage.aspx')) {
      return {
        valid: false,
        reason: 'This is not an ICF directory search URL. Please search for your name on the ICF directory and copy the results URL.'
      };
    }

    // Check 3: Must have webcode=ICFDirectory
    const webcode = parsedUrl.searchParams.get('webcode');
    if (webcode !== 'ICFDirectory') {
      return {
        valid: false,
        reason: 'This is not an ICF directory search page. Please use the ICF member directory.'
      };
    }

    // Check 4: Must have firstname OR lastname parameter
    const firstname = parsedUrl.searchParams.get('firstname');
    const lastname = parsedUrl.searchParams.get('lastname');

    if ((!firstname || !firstname.trim()) && (!lastname || !lastname.trim())) {
      return {
        valid: false,
        reason: 'URL must contain your name in the search parameters. Please search for your name first, then copy the results URL.'
      };
    }

    // Check 5: Should have both firstname AND lastname (recommended)
    if (!firstname?.trim() || !lastname?.trim()) {
      return {
        valid: false,
        reason: 'Please search using both your first name and last name for accurate verification. Single name searches may return multiple results.'
      };
    }

    return {
      valid: true,
      firstname: firstname?.trim(),
      lastname: lastname?.trim()
    };

  } catch (error) {
    return {
      valid: false,
      reason: 'Invalid URL format. Please copy the complete URL from your browser address bar.'
    };
  }
}

/**
 * Verify that entered name matches URL parameters
 */
function validateNameMatchesUrl(enteredName: string, urlFirstname: string, urlLastname: string): boolean {
  const nameParts = enteredName.toLowerCase().split(' ').filter(p => p.length > 0);
  const urlFirst = urlFirstname.toLowerCase();
  const urlLast = urlLastname.toLowerCase();

  // Check if entered name parts match URL firstname/lastname
  const firstMatch = nameParts.some(part =>
    urlFirst.includes(part) || part.includes(urlFirst)
  );

  const lastMatch = nameParts.some(part =>
    urlLast.includes(part) || part.includes(urlLast)
  );

  // Accept if at least one name part matches
  return firstMatch && lastMatch;
}

/**
 * Fetch URL and verify content matches expected name + location
 */
async function verifyICFUrlContent(
  url: string,
  expectedName: string,
  expectedLocation: string,
  expectedCredential: string
): Promise<VerificationResult> {
  try {
    console.log('[ICF Content Verification] Fetching URL:', url);

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
        reason: `Could not access ICF directory (HTTP ${response.status}). Please verify the URL is correct.`
      };
    }

    const html = await response.text();
    console.log('[ICF Content Verification] Fetched HTML length:', html.length);

    // Check for "no results" message
    if (html.toLowerCase().includes('no results found') || html.toLowerCase().includes('no records found')) {
      return {
        verified: false,
        confidence: 0,
        reason: 'The search returned no results. Please verify your name is spelled exactly as it appears in the ICF directory.'
      };
    }

    // Validate content
    let confidence = 0;
    const checks: string[] = [];

    // Check 1: Contains ICF-specific keywords
    const icfKeywords = ['ICF', 'International Coach Federation', 'Coaching'];
    const keywordCount = icfKeywords.filter(kw => html.includes(kw)).length;

    if (keywordCount >= 2) {
      confidence += 10;
      checks.push('ICF page verified');
    } else {
      return {
        verified: false,
        confidence: 0,
        reason: 'Page does not appear to be an ICF directory page. Please verify the URL is correct.'
      };
    }

    // Check 2: Contains expected name parts (at least 80% of name parts)
    const nameParts = expectedName.toLowerCase().split(' ').filter(p => p.length > 2);
    const htmlLower = html.toLowerCase();
    const nameMatches = nameParts.filter(part => htmlLower.includes(part));

    if (nameMatches.length >= nameParts.length * 0.8) {
      confidence += 30;
      checks.push('Name matches');
    } else {
      return {
        verified: false,
        confidence,
        reason: `Name "${expectedName}" not found in the search results. Please verify the name matches your ICF profile exactly.`
      };
    }

    // Check 3: Contains expected location (CRITICAL for disambiguation)
    const locationParts = expectedLocation.toLowerCase().split(',').map(p => p.trim()).filter(p => p.length > 2);
    const locationMatches = locationParts.filter(part => htmlLower.includes(part));

    if (locationMatches.length > 0) {
      confidence += 40; // High weight - this is the key disambiguator
      checks.push('Location matches');
    } else {
      // Location is critical - if not found, might be wrong profile
      return {
        verified: false,
        confidence,
        reason: `Location "${expectedLocation}" not found in the results. Please verify your location matches your ICF profile exactly (City, Country). If multiple coaches have your name, location helps us identify the correct profile.`
      };
    }

    // Check 4: Contains credential level
    const credentialLevels = ['ACC', 'PCC', 'MCC', 'ACTC'];
    const levelMatch = credentialLevels.find(level => html.includes(level));

    if (levelMatch) {
      confidence += 10;
      checks.push('Credential level found');

      // Bonus: Check if it matches the expected level
      if (levelMatch === expectedCredential) {
        confidence += 10;
        checks.push('Credential level matches expected');
      }
    }

    // Success if confidence >= 70
    if (confidence >= 70) {
      return {
        verified: true,
        confidence,
        matchDetails: {
          name: expectedName,
          location: expectedLocation,
          level: levelMatch || expectedCredential,
          profileUrl: url
        },
        reason: `Successfully verified via ICF directory (${checks.join(', ')})`
      };
    } else {
      // Edge case: Name + partial location match but low confidence
      // Flag for manual review
      if (confidence >= 50 && nameMatches.length > 0) {
        return {
          verified: false,
          confidence,
          pendingManualReview: true,
          reason: 'Your profile requires manual verification. We found your name but need to confirm additional details. Our team will review within 24 hours.'
        };
      }

      return {
        verified: false,
        confidence,
        reason: 'Could not verify all required information. Please ensure the URL shows your complete profile with name, location, and credential level visible.'
      };
    }

  } catch (error) {
    console.error('[ICF Content Verification] Error:', error);
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
