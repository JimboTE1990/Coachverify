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
  pendingManualReview?: boolean; // If true, verification is pending manual review
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
    const normalizedEIA = eiaNumber.trim().toUpperCase().replace(/\s+/g, '');

    // STEP 1: Check internal verified_credentials cache first
    console.log('[EMCC Verification] Checking internal cache for EIA:', normalizedEIA);

    const { data: cachedCredential, error: cacheError } = await supabase
      .from('verified_credentials')
      .select('*')
      .eq('accreditation_body', 'EMCC')
      .eq('credential_number', normalizedEIA)
      .eq('is_active', true)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116 = not found
      console.warn('[EMCC Verification] Cache lookup error:', cacheError);
    }

    if (cachedCredential) {
      console.log('[EMCC Verification] Found in cache:', cachedCredential.full_name);

      // Verify name matches cached credential
      const nameSimilarity = calculateSimilarity(
        cachedCredential.full_name.toLowerCase().trim(),
        normalizedName
      );

      console.log('[EMCC Verification] Cache name match:', {
        cached: cachedCredential.full_name,
        provided: fullName,
        similarity: nameSimilarity
      });

      if (nameSimilarity >= 0.7) {
        console.log('[EMCC Verification] Cache hit - verified from internal database');

        const result: VerificationResult = {
          verified: true,
          confidence: 100,
          matchDetails: {
            name: cachedCredential.full_name,
            level: cachedCredential.accreditation_level || undefined,
            country: cachedCredential.country || undefined,
            profileUrl: cachedCredential.profile_url || undefined,
          },
          reason: 'Verified from internal database (previously verified)',
        };

        // Skip to database update section
        console.log('[EMCC Verification] Search result:', result);

        // Check if this is a temporary ID (onboarding verification)
        const isTempId = coachId.startsWith('temp_');

        // Update coach profile with verification result (skip for temp IDs during onboarding)
        if (!isTempId) {
          const { error: updateError } = await supabase
            .from('coach_profiles')
            .update({
              emcc_verified: true,
              emcc_verified_at: new Date().toISOString(),
              emcc_profile_url: result.matchDetails.profileUrl || null,
              accreditation_level: result.matchDetails.level || accreditationLevel || null,
              verification_status: 'verified',
            })
            .eq('id', coachId);

          if (updateError) {
            console.error('[EMCC Verification] Error updating coach:', updateError);
          } else {
            console.log('[EMCC Verification] Coach verified successfully (from cache)');
          }
        } else {
          console.log('[EMCC Verification] Skipping database update for temporary ID (onboarding)');
        }

        return new Response(
          JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.warn('[EMCC Verification] Cache found but name mismatch');
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `EIA ${normalizedEIA} belongs to "${cachedCredential.full_name}", which doesn't match the name you provided ("${fullName}"). Please check that you're using YOUR OWN EIA number.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[EMCC Verification] Not in cache, attempting live verification...');

    // STEP 2: Attempt live verification (will likely get 403)
    const result = await verifyFromEIANumber(normalizedEIA, normalizedName, accreditationLevel, country);

    console.log('[EMCC Verification] Search result:', result);

    // STEP 3: If live verification failed due to 403, mark as pending manual review
    if (!result.verified && result.reason?.includes('403')) {
      console.log('[EMCC Verification] Live verification blocked (403), marking for manual review');

      const isTempId = coachId.startsWith('temp_');

      if (!isTempId) {
        // Store for manual review
        const { error: updateError } = await supabase
          .from('coach_profiles')
          .update({
            verification_status: 'manual_review',
            verification_notes: `EIA: ${normalizedEIA}, Name: ${fullName}, Level: ${accreditationLevel || 'N/A'}, Reason: EMCC website blocked verification (HTTP 403)`,
          })
          .eq('id', coachId);

        if (updateError) {
          console.error('[EMCC Verification] Error updating coach for manual review:', updateError);
        }
      }

      return new Response(
        JSON.stringify({
          verified: false,
          confidence: 0,
          pendingManualReview: true,
          reason: 'Your credentials have been submitted and are pending manual verification. You can complete your onboarding, and we\'ll verify your credentials within 24 hours.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a temporary ID (onboarding verification)
    const isTempId = coachId.startsWith('temp_');

    // Update coach profile with verification result (skip for temp IDs during onboarding)
    if (result.verified && result.matchDetails && !isTempId) {
      // Check if EIA number is already used by another coach
      // Note: Only checks active coaches (not soft-deleted ones if you use deleted_at pattern)
      const { data: existingCoaches, error: checkError } = await supabase
        .from('coaches')
        .select('id, name, email')
        .eq('emcc_verified', true)
        .eq('accreditation_level', result.matchDetails.level)
        .ilike('name', `%${fullName.split(' ')[fullName.split(' ').length - 1]}%`) // Check by last name
        .neq('id', coachId);

      if (checkError) {
        console.error('[EMCC Verification] Error checking for duplicates:', checkError);
      }

      // If another verified coach exists with similar name and same level, flag potential duplicate
      if (existingCoaches && existingCoaches.length > 0) {
        const existingCoach = existingCoaches[0];
        console.warn('[EMCC Verification] Potential duplicate detected:', existingCoach);
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `This EIA number appears to be already verified by another coach in our system (${existingCoach.name}). If you believe this is an error, please contact support at support@coachdog.com with your EIA number: ${eiaNumber}`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
    } else if (!result.verified && !isTempId) {
      // Mark as unverified (skip for temp IDs)
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
    } else if (isTempId) {
      console.log('[EMCC Verification] Skipping database update for temporary ID (onboarding)');
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

    // STEP 1: Visit homepage first to get cookies and appear more human-like
    const homepageUrl = 'https://www.emccglobal.org/';
    console.log('[EMCC EIA Verification] Step 1: Visiting homepage to establish session...');

    const baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="131", "Google Chrome";v="131"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
    };

    let cookieJar = '';

    try {
      const homepageResponse = await fetch(homepageUrl, {
        headers: baseHeaders,
        signal: AbortSignal.timeout(10000),
      });

      // Extract and store cookies from homepage visit
      const setCookieHeader = homepageResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        // Parse cookies and store them
        const cookies = setCookieHeader.split(',').map(c => c.split(';')[0].trim());
        cookieJar = cookies.join('; ');
        console.log('[EMCC EIA Verification] Cookies stored:', cookieJar.substring(0, 50) + '...');
      } else {
        console.log('[EMCC EIA Verification] No cookies received from homepage');
      }

      // Wait 2-3 seconds (simulate human reading homepage)
      await new Promise(resolve => setTimeout(resolve, 2500));

    } catch (homepageError) {
      console.warn('[EMCC EIA Verification] Homepage visit failed:', homepageError);
      // Continue anyway - maybe it will work without cookies
    }

    // STEP 2: Visit directory page (before searching) - with cookies
    console.log('[EMCC EIA Verification] Step 2: Visiting directory page...');
    const directoryUrl = 'https://www.emccglobal.org/directory';

    const directoryHeaders = {
      ...baseHeaders,
      'Referer': homepageUrl,
      'sec-fetch-site': 'same-origin',
      ...(cookieJar && { 'Cookie': cookieJar }),
    };

    try {
      const directoryResponse = await fetch(directoryUrl, {
        headers: directoryHeaders,
        signal: AbortSignal.timeout(10000),
      });

      // Update cookies if new ones are set
      const newCookies = directoryResponse.headers.get('set-cookie');
      if (newCookies) {
        const cookies = newCookies.split(',').map(c => c.split(';')[0].trim());
        cookieJar = cookieJar ? `${cookieJar}; ${cookies.join('; ')}` : cookies.join('; ');
        console.log('[EMCC EIA Verification] Cookies updated from directory page');
      }

      console.log('[EMCC EIA Verification] Directory page visited');

      // Wait 2-3 seconds (simulate human looking at directory page)
      await new Promise(resolve => setTimeout(resolve, 2500));

    } catch (directoryError) {
      console.warn('[EMCC EIA Verification] Directory visit failed:', directoryError);
      // Continue anyway
    }

    // STEP 3: Now perform the actual search - with all cookies
    console.log('[EMCC EIA Verification] Step 3: Performing search...');
    const searchUrl = 'https://www.emccglobal.org/directory';
    const params = new URLSearchParams({
      'search': normalizedEIA,
      'reference': normalizedEIA, // Search specifically in Reference field
    });

    const searchHeaders = {
      ...baseHeaders,
      'Referer': directoryUrl,
      'sec-fetch-site': 'same-origin',
      'cache-control': 'max-age=0',
      ...(cookieJar && { 'Cookie': cookieJar }),
    };

    console.log('[EMCC EIA Verification] Querying with cookies:', `${searchUrl}?${params.toString()}`);

    // Wait 1-2 seconds (simulate human typing/clicking)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if ScraperAPI key is available (Deno is available in Supabase Edge Functions)
    // @ts-ignore - Deno is available in edge runtime
    const scraperApiKey = Deno.env.get('SCRAPER_API_KEY');
    let response: Response;

    if (scraperApiKey) {
      // Use ScraperAPI for bypassing 403 blocks
      const targetUrl = `${searchUrl}?${params.toString()}`;
      const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render=false&country_code=gb`;

      console.log('[EMCC EIA Verification] Using ScraperAPI to bypass anti-bot detection');

      try {
        response = await fetch(scraperUrl, {
          signal: AbortSignal.timeout(30000), // 30 second timeout for proxy
        });

        console.log('[EMCC EIA Verification] ScraperAPI response status:', response.status);
      } catch (scraperError) {
        console.error('[EMCC EIA Verification] ScraperAPI error:', scraperError);
        return {
          verified: false,
          confidence: 0,
          reason: `EMCC directory search failed via proxy: ${scraperError instanceof Error ? scraperError.message : 'Unknown error'}`,
        };
      }
    } else {
      // Direct request (will likely get 403, but try anyway)
      console.log('[EMCC EIA Verification] No ScraperAPI key found, attempting direct request');

      response = await fetch(`${searchUrl}?${params.toString()}`, {
        headers: searchHeaders,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
    }

    if (!response.ok) {
      const errorMessage = scraperApiKey
        ? `EMCC directory search failed even with proxy (HTTP ${response.status}). Please contact support.`
        : `EMCC directory search failed (HTTP ${response.status}). Please add SCRAPER_API_KEY to environment variables or contact support.`;

      return {
        verified: false,
        confidence: 0,
        reason: errorMessage,
      };
    }

    const html = await response.text();

    // Parse results looking for EIA number match
    const match = parseEIAResult(html, normalizedEIA);

    console.log('[EMCC EIA Verification] Parse result:', match);
    console.log('[EMCC EIA Verification] Expected name:', expectedName);

    if (!match) {
      console.error('[EMCC EIA Verification] Failed to parse HTML - no match found');
      return {
        verified: false,
        confidence: 0,
        reason: `No EMCC record found with EIA number ${normalizedEIA}. Please verify your EIA number is correct.`,
      };
    }

    if (!match.name || match.name.trim().length === 0) {
      console.error('[EMCC EIA Verification] Failed to extract name from HTML');
      return {
        verified: false,
        confidence: 0,
        reason: `Found EIA ${normalizedEIA} in EMCC directory, but couldn't extract the coach name. This may be a technical issue - please contact support.`,
      };
    }

    console.log('[EMCC EIA Verification] Found match:', match);
    console.log('[EMCC EIA Verification] Expected:', { expectedName, expectedLevel, expectedCountry });

    // Verify name matches (fuzzy matching OK since EIA is unique)
    const nameSimilarity = calculateSimilarity(
      match.name.toLowerCase().trim(),
      expectedName.toLowerCase().trim()
    );

    console.log('[EMCC EIA Verification] Name similarity:', nameSimilarity);
    console.log('[EMCC EIA Verification] Comparing:', {
      found: match.name,
      expected: expectedName,
      similarity: nameSimilarity,
      threshold: 0.7
    });

    // Strict name matching: 70% similarity threshold
    if (nameSimilarity < 0.7) {
      console.warn('[EMCC EIA Verification] Name mismatch detected');
      return {
        verified: false,
        confidence: 0,
        reason: `EIA ${normalizedEIA} belongs to "${match.name}", which doesn't match the name you provided ("${expectedName}"). Please check that you're using YOUR OWN EIA number.`,
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
