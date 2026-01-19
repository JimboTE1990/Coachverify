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
  eiaNumber?: string; // EIA (EMCC Individual Accreditation) number - BEST for verification
  profileUrl?: string; // EMCC directory profile URL for direct verification
  membershipNumber?: string; // DEPRECATED: Not publicly available
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
    const { coachId, fullName, accreditationLevel, country, membershipNumber, profileUrl }: VerificationRequest = await req.json();

    if (!coachId || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EMCC Verification] Starting verification for:', {
      coachId,
      fullName,
      accreditationLevel,
      country,
      hasMembershipNumber: !!membershipNumber,
      hasProfileUrl: !!profileUrl
    });

    // Normalize name for search
    const normalizedName = fullName.trim().toLowerCase();

    // If profile URL provided, use direct verification (higher confidence)
    // Otherwise, fall back to directory search
    const result = profileUrl
      ? await verifyFromProfileUrl(profileUrl, normalizedName, accreditationLevel, country, membershipNumber)
      : await searchEMCCDirectory(normalizedName, accreditationLevel, country, membershipNumber);

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
 * Verify coach by fetching their EMCC profile URL directly
 * This is the HIGHEST confidence verification method
 */
async function verifyFromProfileUrl(
  profileUrl: string,
  expectedName: string,
  expectedLevel?: string,
  expectedCountry?: string,
  membershipNumber?: string
): Promise<VerificationResult> {
  try {
    console.log('[EMCC Verification] Verifying from profile URL:', profileUrl);

    // Validate URL format
    if (!profileUrl.includes('emccglobal.org')) {
      return {
        verified: false,
        confidence: 0,
        reason: 'Invalid EMCC profile URL. Please copy the URL from the EMCC directory.',
      };
    }

    // Fetch the profile page
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CoachVerify/1.0; +https://coachverify.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        verified: false,
        confidence: 0,
        reason: `Could not access profile page (HTTP ${response.status}). Please verify the URL is correct.`,
      };
    }

    const html = await response.text();

    // Extract profile data from the HTML
    const profileData = extractProfileData(html);

    if (!profileData.name) {
      return {
        verified: false,
        confidence: 0,
        reason: 'Could not extract coach name from profile page. The page format may have changed.',
      };
    }

    // Calculate name similarity
    const nameSimilarity = calculateSimilarity(
      profileData.name.toLowerCase(),
      expectedName.toLowerCase()
    );

    console.log('[EMCC Profile Verification] Extracted:', profileData);
    console.log('[EMCC Profile Verification] Expected:', { expectedName, expectedLevel, expectedCountry });
    console.log('[EMCC Profile Verification] Name similarity:', nameSimilarity);

    // Check if name matches (exact or very close)
    if (nameSimilarity < 0.8) {
      return {
        verified: false,
        confidence: Math.round(nameSimilarity * 100),
        reason: `Name on profile page ("${profileData.name}") doesn't match the name you provided ("${expectedName}"). Please double-check.`,
      };
    }

    // Check if level matches (if we have both)
    let levelMatch = true;
    if (expectedLevel && profileData.level) {
      levelMatch = profileData.level.toLowerCase().includes(expectedLevel.toLowerCase()) ||
                   expectedLevel.toLowerCase().includes(profileData.level.toLowerCase());
    }

    if (!levelMatch) {
      return {
        verified: false,
        confidence: 70,
        reason: `Accreditation level on profile ("${profileData.level}") doesn't match what you selected ("${expectedLevel}").`,
      };
    }

    // Calculate final confidence score
    let confidence = 95; // Base confidence for profile URL verification

    // Boost for exact name match
    if (nameSimilarity >= 0.95) {
      confidence = 98;
    }

    // Boost if membership number provided (shows genuine knowledge)
    if (membershipNumber) {
      confidence = Math.min(100, confidence + 2);
    }

    // Return successful verification
    return {
      verified: true,
      confidence,
      matchDetails: {
        name: profileData.name,
        level: profileData.level,
        country: profileData.country,
        profileUrl: profileUrl,
      },
    };

  } catch (error) {
    console.error('[EMCC Profile Verification] Error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: `Could not verify profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Extract coach profile data from EMCC profile page HTML
 */
function extractProfileData(html: string): {
  name?: string;
  level?: string;
  country?: string;
} {
  const data: { name?: string; level?: string; country?: string } = {};

  try {
    // Pattern 1: Extract name from common HTML structures
    // Look for h1, h2, or strong tags that typically contain the coach name
    const namePatterns = [
      /<h1[^>]*>(.*?)<\/h1>/i,
      /<h2[^>]*class="[^"]*name[^"]*"[^>]*>(.*?)<\/h2>/i,
      /<div[^>]*class="[^"]*coach-name[^"]*"[^>]*>(.*?)<\/div>/i,
      /<strong[^>]*>(Dr\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/strong>/i,
    ];

    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // Clean HTML tags and extract text
        data.name = match[1].replace(/<[^>]+>/g, '').trim();
        if (data.name.length > 3 && data.name.length < 100) break;
      }
    }

    // Pattern 2: Extract accreditation level
    const levelPatterns = [
      /(?:Accreditation|Level|Credential):\s*<[^>]*>([^<]+)</i,
      /(Foundation|Practitioner|Senior Practitioner|Master Practitioner)/i,
      /<span[^>]*class="[^"]*level[^"]*"[^>]*>([^<]+)<\/span>/i,
    ];

    for (const pattern of levelPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        data.level = match[1].trim();
        break;
      }
    }

    // Pattern 3: Extract country/location
    const countryPatterns = [
      /(?:Country|Location):\s*<[^>]*>([^<]+)</i,
      /<span[^>]*class="[^"]*country[^"]*"[^>]*>([^<]+)<\/span>/i,
    ];

    for (const pattern of countryPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        data.country = match[1].trim();
        break;
      }
    }

  } catch (error) {
    console.error('[Profile Data Extraction] Error:', error);
  }

  return data;
}

/**
 * Search EMCC public directory for a coach by name
 * Mimics human search behavior on https://www.emccglobal.org/directory
 */
async function searchEMCCDirectory(
  fullName: string,
  accreditationLevel?: string,
  country?: string,
  membershipNumber?: string
): Promise<VerificationResult> {
  try {
    // EMCC directory search endpoint (based on their public search form)
    const searchUrl = 'https://www.emccglobal.org/directory';

    // Build search params (mimicking human search form submission)
    const params = new URLSearchParams({
      'search': fullName,
      // Add optional filters if provided
      ...(accreditationLevel && { 'accreditation_level': accreditationLevel }),
      ...(country && { 'country': country }),
    });

    // Polite headers (mimic browser, respect robots.txt)
    const headers = {
      'User-Agent': 'Mozilla/5.0 (compatible; CoachVerify/1.0; +https://coachverify.vercel.app)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.emccglobal.org/',
    };

    console.log('[EMCC Search] Querying:', `${searchUrl}?${params.toString()}`);

    // Perform search with timeout and rate limiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${searchUrl}?${params.toString()}`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[EMCC Search] HTTP error:', response.status);
      return {
        verified: false,
        confidence: 0,
        reason: `EMCC directory returned status ${response.status}`,
      };
    }

    // Parse HTML response
    const html = await response.text();

    // Simple HTML parsing to find coach entries
    // Look for common patterns in EMCC directory results
    const matches = parseEMCCResults(html, fullName, accreditationLevel);

    if (matches.length === 0) {
      return {
        verified: false,
        confidence: 0,
        reason: 'No matches found in EMCC directory',
      };
    }

    // Check for exact match
    const exactMatch = matches.find(m =>
      m.name.toLowerCase() === fullName.toLowerCase()
    );

    if (exactMatch) {
      // If membership number provided, boost confidence even higher
      const confidence = membershipNumber ? 98 : 95;
      return {
        verified: true,
        confidence,
        matchDetails: exactMatch,
      };
    }

    // Check for close match (fuzzy matching)
    const closeMatch = matches.find(m => {
      const similarity = calculateSimilarity(m.name.toLowerCase(), fullName.toLowerCase());
      return similarity > 0.85; // 85% similarity threshold
    });

    if (closeMatch) {
      // If membership number provided, consider it verified with higher confidence
      const confidence = membershipNumber ? 90 : 80;
      return {
        verified: true,
        confidence,
        matchDetails: closeMatch,
      };
    }

    // If membership number was provided but no match found, it's likely incorrect
    if (membershipNumber) {
      return {
        verified: false,
        confidence: 0,
        reason: 'No match found in EMCC directory. Please verify your name and membership number exactly match your EMCC profile.',
      };
    }

    // Multiple ambiguous matches without membership number
    return {
      verified: false,
      confidence: 30,
      reason: `Found ${matches.length} possible matches, but none exact. Please provide your EMCC membership number for verification.`,
    };

  } catch (error) {
    console.error('[EMCC Search] Error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse EMCC directory HTML results
 * Looks for coach entries and extracts name, level, country, profile URL
 */
function parseEMCCResults(
  html: string,
  searchName: string,
  expectedLevel?: string
): Array<{ name: string; level?: string; country?: string; profileUrl?: string }> {
  const results: Array<{ name: string; level?: string; country?: string; profileUrl?: string }> = [];

  try {
    // EMCC directory typically shows results in a structured format
    // Look for common HTML patterns (div.coach-entry, tr.result, etc.)

    // Pattern 1: Look for coach names in common result containers
    const namePattern = /<(?:div|td|h\d)[^>]*class="[^"]*(?:coach|member|result)[^"]*"[^>]*>([^<]+)<\/(?:div|td|h\d)>/gi;
    const nameMatches = [...html.matchAll(namePattern)];

    // Pattern 2: Look for profile links
    const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    const linkMatches = [...html.matchAll(linkPattern)];

    // Combine patterns to extract coach info
    for (const match of linkMatches) {
      const profileUrl = match[1];
      const text = match[2].trim();

      // Check if this looks like a coach name
      if (text && isLikelyName(text, searchName)) {
        results.push({
          name: text,
          profileUrl: profileUrl.startsWith('http') ? profileUrl : `https://www.emccglobal.org${profileUrl}`,
        });
      }
    }

    // Fallback: Extract any text that looks like names
    if (results.length === 0) {
      for (const match of nameMatches) {
        const text = match[1].trim();
        if (isLikelyName(text, searchName)) {
          results.push({ name: text });
        }
      }
    }

    console.log('[EMCC Parse] Found', results.length, 'potential matches');

  } catch (error) {
    console.error('[EMCC Parse] Error parsing HTML:', error);
  }

  return results;
}

/**
 * Check if a text string is likely a person's name (not a title, heading, etc.)
 */
function isLikelyName(text: string, searchName: string): boolean {
  // Basic heuristics
  if (text.length < 3 || text.length > 100) return false;
  if (!/[a-z]/i.test(text)) return false; // Must contain letters
  if (/^(search|results|directory|members?|coach|profile)/i.test(text)) return false; // Exclude common headings

  // Check if it has at least one word in common with search name
  const searchWords = searchName.toLowerCase().split(/\s+/);
  const textWords = text.toLowerCase().split(/\s+/);
  return searchWords.some(sw => textWords.some(tw => tw.includes(sw) || sw.includes(tw)));
}

/**
 * Calculate string similarity (Levenshtein distance normalized)
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
