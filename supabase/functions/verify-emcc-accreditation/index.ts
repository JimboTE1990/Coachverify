// Supabase Edge Function to verify EMCC accreditation
// Mimics human search on EMCC public directory: https://www.emccglobal.org/directory

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  coachId: string;
  fullName: string;
  accreditationLevel?: string;
  country?: string;
  eiaNumber: string; // EIA (EMCC Individual Accreditation) number - REQUIRED for verification
}

interface VerificationResult {
  verified: boolean;
  confidence: number; // 0-100
  matchDetails?: {
    name: string;
    level?: string;
    country?: string;
    profileUrl?: string;
  };
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { coachId, fullName, accreditationLevel, country, eiaNumber }: VerificationRequest = await req.json();

    if (!coachId || !fullName || !eiaNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName, eiaNumber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EMCC Verification] Starting verification for:', {
      coachId,
      fullName,
      accreditationLevel,
      country,
      eiaNumber
    });

    // Normalize name for search
    const normalizedName = fullName.trim().toLowerCase();

    // Verify using EIA number (100% confidence)
    const result = await verifyFromEIANumber(eiaNumber, normalizedName, accreditationLevel, country);

    console.log('[EMCC Verification] Search result:', result);

    // Update coach profile with verification result
    if (result.verified && result.matchDetails) {
      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          emcc_verified: true,
          emcc_verified_at: new Date().toISOString(),
          emcc_profile_url: result.matchDetails.profileUrl || null,
          accreditation_level: result.matchDetails.level || accreditationLevel || null,
        })
        .eq('id', coachId);

      if (updateError) {
        console.error('[EMCC Verification] Error updating coach:', updateError);
        throw updateError;
      }

      console.log('[EMCC Verification] Coach verified successfully');
    } else {
      // Mark as unverified
      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          emcc_verified: false,
        })
        .eq('id', coachId);

      if (updateError) {
        console.error('[EMCC Verification] Error updating coach:', updateError);
        throw updateError;
      }

      console.log('[EMCC Verification] Coach not verified:', result.reason);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EMCC Verification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Verify coach using EIA number lookup in EMCC database
 * This is the BEST verification method (100% confidence when matched)
 * EIA numbers are unique identifiers in the "Reference" column
 */
async function verifyFromEIANumber(
  eiaNumber: string,
  expectedName: string,
  expectedLevel?: string,
  expectedCountry?: string
): Promise<VerificationResult> {
  try {
    console.log('[EMCC EIA Verification] Starting verification for EIA:', eiaNumber);

    // Normalize EIA number (ensure uppercase, remove spaces)
    const normalizedEIA = eiaNumber.trim().toUpperCase().replace(/\s+/g, '');

    // Validate EIA format (should be like EIA20260083)
    if (!/^EIA\d+$/i.test(normalizedEIA)) {
      return {
        verified: false,
        confidence: 0,
        reason: 'Invalid EIA number format. EIA numbers should look like "EIA20260083".',
      };
    }

    // Search EMCC directory by EIA number
    // Mimicking human form submission with reference/EIA number search
    const searchUrl = 'https://www.emccglobal.org/directory';
    const params = new URLSearchParams({
      'search': normalizedEIA,
      'reference': normalizedEIA, // Search specifically in Reference field
    });

    const headers = {
      'User-Agent': 'Mozilla/5.0 (compatible; CoachVerify/1.0; +https://coachverify.vercel.app)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.emccglobal.org/',
    };

    console.log('[EMCC EIA Verification] Querying:', `${searchUrl}?${params.toString()}`);

    const response = await fetch(`${searchUrl}?${params.toString()}`, {
      headers,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        verified: false,
        confidence: 0,
        reason: `EMCC directory search failed (HTTP ${response.status}). Please try again later.`,
      };
    }

    const html = await response.text();

    // Parse results looking for EIA number match
    const match = parseEIAResult(html, normalizedEIA);

    if (!match || !match.name) {
      return {
        verified: false,
        confidence: 0,
        reason: `No EMCC record found with EIA number ${normalizedEIA}. Please verify your EIA number is correct.`,
      };
    }

    console.log('[EMCC EIA Verification] Found match:', match);
    console.log('[EMCC EIA Verification] Expected:', { expectedName, expectedLevel, expectedCountry });

    // Verify name matches (fuzzy matching OK since EIA is unique)
    const nameSimilarity = calculateSimilarity(
      match.name.toLowerCase(),
      expectedName.toLowerCase()
    );

    console.log('[EMCC EIA Verification] Name similarity:', nameSimilarity);

    if (nameSimilarity < 0.7) {
      return {
        verified: false,
        confidence: 0,
        reason: `EIA ${normalizedEIA} belongs to "${match.name}", which doesn't match the name you provided ("${expectedName}"). Please check your EIA number.`,
      };
    }

    // Verify accreditation level matches (if provided)
    if (expectedLevel && match.level) {
      const levelMatch = match.level.toLowerCase().includes(expectedLevel.toLowerCase()) ||
                        expectedLevel.toLowerCase().includes(match.level.toLowerCase());

      if (!levelMatch) {
        return {
          verified: false,
          confidence: 0,
          reason: `EIA ${normalizedEIA} shows accreditation level "${match.level}", but you selected "${expectedLevel}". Please verify your level.`,
        };
      }
    }

    // EIA number + name match = 100% confidence!
    return {
      verified: true,
      confidence: 100,
      matchDetails: {
        name: match.name,
        level: match.level,
        country: match.country,
        profileUrl: match.profileUrl,
      },
      reason: `Successfully verified via EIA number ${normalizedEIA}`,
    };

  } catch (error) {
    console.error('[EMCC EIA Verification] Error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: `EIA verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse EMCC search result to extract coach data for a specific EIA number
 */
function parseEIAResult(
  html: string,
  eiaNumber: string
): { name: string; level?: string; country?: string; profileUrl?: string } | null {
  try {
    // Look for the EIA number in the HTML and extract surrounding data
    // EMCC typically displays results in table rows or div containers

    // Pattern 1: Find EIA number in text
    const eiaPattern = new RegExp(eiaNumber, 'i');
    if (!eiaPattern.test(html)) {
      console.log('[EMCC EIA Parse] EIA number not found in HTML');
      return null;
    }

    // Pattern 2: Extract coach entry containing this EIA number
    // Look for table row or div containing the EIA
    const rowPatterns = [
      new RegExp(`<tr[^>]*>([\\s\\S]*?${eiaNumber}[\\s\\S]*?)<\\/tr>`, 'i'),
      new RegExp(`<div[^>]*class="[^"]*(?:coach|member|result)[^"]*"[^>]*>([\\s\\S]*?${eiaNumber}[\\s\\S]*?)<\\/div>`, 'i'),
    ];

    let rowHtml = '';
    for (const pattern of rowPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        rowHtml = match[1];
        break;
      }
    }

    if (!rowHtml) {
      // Fallback: Get HTML context around EIA number (500 chars before and after)
      const eiaIndex = html.search(eiaPattern);
      if (eiaIndex >= 0) {
        rowHtml = html.substring(Math.max(0, eiaIndex - 500), eiaIndex + 500);
      }
    }

    if (!rowHtml) {
      console.log('[EMCC EIA Parse] Could not extract row HTML');
      return null;
    }

    // Extract name (look for common name patterns)
    const namePatterns = [
      /<td[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/td>/i,
      /<a[^>]+href="[^"]+"[^>]*>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/a>/i,
      /<(?:strong|b)>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/(?:strong|b)>/i,
      /(?:Dr\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/,
    ];

    let name = '';
    for (const pattern of namePatterns) {
      const match = rowHtml.match(pattern);
      if (match && match[1]) {
        name = match[1].trim();
        if (name.length > 3 && name.length < 100) break;
      }
    }

    // Extract level
    const levelPatterns = [
      /(Foundation|Practitioner|Senior Practitioner|Master Practitioner)/i,
      /<td[^>]*class="[^"]*level[^"]*"[^>]*>([^<]+)<\/td>/i,
    ];

    let level = '';
    for (const pattern of levelPatterns) {
      const match = rowHtml.match(pattern);
      if (match && match[1]) {
        level = match[1].trim();
        break;
      }
    }

    // Extract country
    const countryPatterns = [
      /<td[^>]*class="[^"]*country[^"]*"[^>]*>([^<]+)<\/td>/i,
      /(?:Country|Location):\s*([A-Za-z\s]+)/i,
    ];

    let country = '';
    for (const pattern of countryPatterns) {
      const match = rowHtml.match(pattern);
      if (match && match[1]) {
        country = match[1].trim();
        break;
      }
    }

    // Extract profile URL
    const urlPattern = /<a[^>]+href="([^"]+profile[^"]+)"[^>]*>/i;
    const urlMatch = rowHtml.match(urlPattern);
    let profileUrl = '';
    if (urlMatch && urlMatch[1]) {
      profileUrl = urlMatch[1].startsWith('http')
        ? urlMatch[1]
        : `https://www.emccglobal.org${urlMatch[1]}`;
    }

    if (!name) {
      console.log('[EMCC EIA Parse] Could not extract name from row HTML');
      return null;
    }

    console.log('[EMCC EIA Parse] Extracted:', { name, level, country, profileUrl });

    return {
      name,
      level: level || undefined,
      country: country || undefined,
      profileUrl: profileUrl || undefined,
    };

  } catch (error) {
    console.error('[EMCC EIA Parse] Error:', error);
    return null;
  }
}

/**
 * Calculate string similarity (Levenshtein distance normalized)
 * Used by verifyFromEIANumber to match names
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

/**
 * Levenshtein distance algorithm
 * Used to calculate string similarity for name matching
 */
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
