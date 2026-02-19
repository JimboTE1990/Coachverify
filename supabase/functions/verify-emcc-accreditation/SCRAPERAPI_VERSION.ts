// Supabase Edge Function to verify EMCC accreditation
// Uses ScraperAPI as primary method to bypass anti-bot protection

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
  eiaNumber: string;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  matchDetails?: {
    name: string;
    level?: string;
    country?: string;
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

    const { coachId, fullName, accreditationLevel, country, eiaNumber }: VerificationRequest = await req.json();

    if (!coachId || !fullName || !eiaNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName, eiaNumber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EMCC Verification] Starting verification for:', { coachId, fullName, eiaNumber });

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

    if (cacheError && cacheError.code !== 'PGRST116') {
      console.warn('[EMCC Verification] Cache lookup error:', cacheError);
    }

    if (cachedCredential) {
      console.log('[EMCC Verification] Found in cache:', cachedCredential.full_name);

      const nameSimilarity = calculateSimilarity(
        cachedCredential.full_name.toLowerCase().trim(),
        normalizedName
      );

      console.log('[EMCC Verification] Cache name match:', {
        cached: cachedCredential.full_name,
        provided: fullName,
        similarity: nameSimilarity
      });

      if (nameSimilarity >= 0.85) {
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

        const isTempId = coachId.startsWith('temp_');

        if (!isTempId) {
          await supabase
            .from('coach_profiles')
            .update({
              emcc_verified: true,
              emcc_verified_at: new Date().toISOString(),
              emcc_profile_url: result.matchDetails.profileUrl || null,
              accreditation_level: result.matchDetails.level || accreditationLevel || null,
              verification_status: 'verified',
            })
            .eq('id', coachId);

          console.log('[EMCC Verification] Coach verified successfully (from cache)');
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.warn('[EMCC Verification] Cache found but name mismatch');
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `The EIA number ${normalizedEIA} is registered to a different coach. Please verify you're using your own EIA number, or contact support if you believe this is an error.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[EMCC Verification] Not in cache, attempting live verification...');

    // STEP 2: Use ScraperAPI for live verification
    const result = await verifyFromEIANumber(normalizedEIA, normalizedName, accreditationLevel, country);

    console.log('[EMCC Verification] Search result:', result);

    // STEP 3: Handle result
    const isTempId = coachId.startsWith('temp_');

    if (!result.verified && result.reason?.includes('ScraperAPI')) {
      // ScraperAPI failed or not configured - mark for manual review
      if (!isTempId) {
        await supabase
          .from('coach_profiles')
          .update({
            verification_status: 'manual_review',
            verification_notes: `EIA: ${normalizedEIA}, Name: ${fullName}, Level: ${accreditationLevel || 'N/A'}, Reason: ${result.reason}`,
          })
          .eq('id', coachId);
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

    if (result.verified && result.matchDetails && !isTempId) {
      // Check for duplicates
      const { data: existingCoaches } = await supabase
        .from('coaches')
        .select('id, name, email')
        .eq('emcc_verified', true)
        .eq('accreditation_level', result.matchDetails.level)
        .ilike('name', `%${fullName.split(' ')[fullName.split(' ').length - 1]}%`)
        .neq('id', coachId);

      if (existingCoaches && existingCoaches.length > 0) {
        const existingCoach = existingCoaches[0];
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `This EIA number appears to be already verified by another coach in our system (${existingCoach.name}). If you believe this is an error, please contact support at support@coachdog.com with your EIA number: ${eiaNumber}`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update and cache the verified credential
      await supabase.from('coach_profiles').update({
        emcc_verified: true,
        emcc_verified_at: new Date().toISOString(),
        emcc_profile_url: result.matchDetails.profileUrl || null,
        accreditation_level: result.matchDetails.level || accreditationLevel || null,
        verification_status: 'verified',
      }).eq('id', coachId);

      // Add to cache for future verifications
      await supabase.from('verified_credentials').insert({
        accreditation_body: 'EMCC',
        credential_number: normalizedEIA,
        full_name: result.matchDetails.name,
        accreditation_level: result.matchDetails.level,
        country: result.matchDetails.country,
        profile_url: result.matchDetails.profileUrl,
        verified_by: 'auto',
      });

      console.log('[EMCC Verification] Coach verified successfully (from live check) and added to cache');
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
    console.error('[EMCC Verification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Verify coach using ScraperAPI + EIA number lookup
 */
async function verifyFromEIANumber(
  eiaNumber: string,
  expectedName: string,
  expectedLevel?: string,
  expectedCountry?: string
): Promise<VerificationResult> {
  try {
    const normalizedEIA = eiaNumber.trim().toUpperCase().replace(/\s+/g, '');

    if (!/^EIA\d+$/i.test(normalizedEIA)) {
      return {
        verified: false,
        confidence: 0,
        reason: 'Invalid EIA number format. EIA numbers should look like "EIA20260083".',
      };
    }

    const scraperApiKey = Deno.env.get('SCRAPER_API_KEY');

    if (!scraperApiKey) {
      console.warn('[EMCC EIA Verification] No SCRAPER_API_KEY found');
      return {
        verified: false,
        confidence: 0,
        reason: 'ScraperAPI key not configured. Automatic verification is not available.',
      };
    }

    // STRATEGY 1: Search by EIA reference number (most reliable)
    console.log('[EMCC EIA Verification] Strategy 1: Searching by EIA reference number:', normalizedEIA);

    const searchUrl = 'https://www.emccglobal.org/directory';
    const refParams = new URLSearchParams({
      'reference': normalizedEIA,
    });
    const refTargetUrl = `${searchUrl}?${refParams.toString()}`;

    console.log('[EMCC EIA Verification] Target URL:', refTargetUrl);

    // ATTEMPT 1: Try without rendering first (faster, more reliable)
    // Note: Removed country_code to avoid potential routing issues with ScraperAPI
    let refScraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(refTargetUrl)}&render=false`;

    console.log('[EMCC EIA Verification] Attempt 1: Trying without JavaScript rendering (faster)');

    let response: Response;
    let usedRendering = false;
    try {
      response = await fetch(refScraperUrl, {
        signal: AbortSignal.timeout(45000), // 45 second timeout (increased from 30)
      });
      console.log('[EMCC EIA Verification] Reference search response status (no render):', response.status);
    } catch (timeoutError) {
      console.log('[EMCC EIA Verification] Attempt 1 timed out, trying with rendering');
      // If timeout, skip to rendering attempt
      usedRendering = true;
      refScraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(refTargetUrl)}&render=true`;
      response = await fetch(refScraperUrl, {
        signal: AbortSignal.timeout(60000), // 60 second timeout for rendering
      });
      console.log('[EMCC EIA Verification] Reference search response status (with render after timeout):', response.status);
    }

    // If first attempt fails with 500 and we haven't already tried rendering, try with rendering
    if (!usedRendering && !response.ok && response.status === 500) {
      console.log('[EMCC EIA Verification] Attempt 2: First attempt got 500, trying with JavaScript rendering');
      refScraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(refTargetUrl)}&render=true`;

      response = await fetch(refScraperUrl, {
        signal: AbortSignal.timeout(60000), // 60 second timeout for rendering
      });

      console.log('[EMCC EIA Verification] Reference search response status (with render):', response.status);
    }

    if (!response.ok) {
      return {
        verified: false,
        confidence: 0,
        reason: `ScraperAPI returned HTTP ${response.status}. Please try again or contact support.`,
      };
    }

    let html = await response.text();
    console.log('[EMCC EIA Verification] HTML length:', html.length);
    console.log('[EMCC EIA Verification] HTML snippet (first 500 chars):', html.substring(0, 500));
    console.log('[EMCC EIA Verification] HTML snippet (search for "table"):', html.toLowerCase().includes('table') ? 'Contains table tag' : 'No table tag found');
    console.log('[EMCC EIA Verification] HTML snippet (search for "result"):', html.toLowerCase().includes('result') ? 'Contains result' : 'No result found');
    console.log('[EMCC EIA Verification] HTML contains EIA?:', html.includes(normalizedEIA));

    // Log a larger chunk if EIA is not found to debug
    if (!html.includes(normalizedEIA)) {
      console.log('[EMCC EIA Verification] EIA not found - logging first 2000 chars:', html.substring(0, 2000));
    }

    let match = parseEIAResult(html, normalizedEIA);

    // STRATEGY 2: If no match by reference, try searching by name (fallback)
    if (!match || !match.name) {
      console.log('[EMCC EIA Verification] Strategy 2: No match by reference, trying name search as fallback');

      const nameParams = new URLSearchParams({
        'search': expectedName,
      });
      const nameTargetUrl = `${searchUrl}?${nameParams.toString()}`;

      console.log('[EMCC EIA Verification] Name search target URL:', nameTargetUrl);

      // Try name search without rendering first
      let nameScraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(nameTargetUrl)}&render=false`;

      console.log('[EMCC EIA Verification] Name search attempt 1: Without rendering');

      response = await fetch(nameScraperUrl, {
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      console.log('[EMCC EIA Verification] Name search response status (no render):', response.status);

      // If 500 error, try with rendering
      if (!response.ok && response.status === 500) {
        console.log('[EMCC EIA Verification] Name search attempt 2: With rendering');
        nameScraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(nameTargetUrl)}&render=true`;

        response = await fetch(nameScraperUrl, {
          signal: AbortSignal.timeout(60000), // 60 second timeout for rendering
        });

        console.log('[EMCC EIA Verification] Name search response status (with render):', response.status);
      }

      if (response.ok) {
        html = await response.text();
        console.log('[EMCC EIA Verification] Name search HTML length:', html.length);
        console.log('[EMCC EIA Verification] Name search HTML snippet (first 500 chars):', html.substring(0, 500));
        console.log('[EMCC EIA Verification] Name search HTML contains EIA?:', html.includes(normalizedEIA));

        // Log a larger chunk if EIA is not found
        if (!html.includes(normalizedEIA)) {
          console.log('[EMCC EIA Verification] Name search - EIA not found - logging first 2000 chars:', html.substring(0, 2000));
        }

        match = parseEIAResult(html, normalizedEIA);
      }
    }

    if (!match || !match.name) {
      console.log('[EMCC EIA Verification] No match found after both strategies');
      return {
        verified: false,
        confidence: 0,
        reason: `No EMCC record found with EIA number ${normalizedEIA}. Please verify your EIA number is correct.`,
      };
    }

    console.log('[EMCC EIA Verification] Match found:', match);

    const nameSimilarity = calculateSimilarity(
      match.name.toLowerCase().trim(),
      expectedName.toLowerCase().trim()
    );

    console.log('[EMCC EIA Verification] Name similarity:', {
      found: match.name,
      expected: expectedName,
      similarity: nameSimilarity
    });

    if (nameSimilarity < 0.85) {
      return {
        verified: false,
        confidence: 0,
        reason: `The EIA number ${normalizedEIA} is registered to a different coach. Please verify you're using your own EIA number, or contact support if you believe this is an error.`,
      };
    }

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
      reason: `ScraperAPI verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function parseEIAResult(html: string, eiaNumber: string): { name: string; level?: string; country?: string; profileUrl?: string } | null {
  try {
    const eiaPattern = new RegExp(eiaNumber, 'i');
    if (!eiaPattern.test(html)) {
      return null;
    }

    // EMCC uses table rows - extract the entire row containing the EIA
    const rowPatterns = [
      // Standard table row with EIA
      new RegExp(`<tr[^>]*>([\\s\\S]*?${eiaNumber}[\\s\\S]*?)<\\/tr>`, 'i'),
      // Table row with tbody wrapper
      new RegExp(`<tbody[^>]*>([\\s\\S]*?<tr[^>]*>[\\s\\S]*?${eiaNumber}[\\s\\S]*?<\\/tr>[\\s\\S]*?)<\\/tbody>`, 'i'),
      // Div-based result
      new RegExp(`<div[^>]*class="[^"]*(?:coach|member|result)[^"]*"[^>]*>([\\s\\S]*?${eiaNumber}[\\s\\S]*?)<\\/div>`, 'i'),
    ];

    let rowHtml = '';
    for (const pattern of rowPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        rowHtml = match[1];
        console.log('[EMCC Parse] Extracted row HTML (length):', rowHtml.length);
        break;
      }
    }

    // Fallback: extract context around EIA
    if (!rowHtml) {
      const eiaIndex = html.search(eiaPattern);
      if (eiaIndex >= 0) {
        rowHtml = html.substring(Math.max(0, eiaIndex - 1000), eiaIndex + 1000);
        console.log('[EMCC Parse] Using context extraction (length):', rowHtml.length);
      }
    }

    if (!rowHtml) return null;

    // EMCC table format: extract all <td> cells in order
    // Order: Country/Region, Name, Current Award Level, Reference, Original Award Date, Latest Renewal Date, Valid Until
    const tdMatches = rowHtml.match(/<td[^>]*>([^<]*(?:<[^\/](?:[^<]|<[^\/])*<\/[^>]+>)?[^<]*)<\/td>/gi);

    if (!tdMatches || tdMatches.length < 4) {
      console.log('[EMCC Parse] Not enough table cells found');
      return null;
    }

    console.log('[EMCC Parse] Found', tdMatches.length, 'table cells');

    // Extract text from each cell
    const cells = tdMatches.map(td => {
      const textMatch = td.match(/<td[^>]*>([^<]+)<\/td>/i);
      return textMatch ? textMatch[1].trim() : '';
    });

    // EMCC structure: cells[0]=Country, cells[1]=Name, cells[2]=Award Level, cells[3]=Reference
    const country = cells[0] || '';
    let name = cells[1] || '';
    let level = cells[2] || '';
    const reference = cells[3] || '';

    console.log('[EMCC Parse] Extracted:', { country, name, level, reference });

    // Blacklist validation for name
    const nameBlacklist = [
      'email address', 'view profile', 'send message', 'contact', 'more info',
      'read more', 'click here', 'download', 'register', 'login', 'sign up',
      'learn more', 'get started', 'find out', 'book now'
    ];

    const nameLower = name.toLowerCase();
    if (nameBlacklist.some(blocked => nameLower.includes(blocked))) {
      console.log('[EMCC Parse] Name rejected by blacklist:', name);
      name = '';
    }

    // Validate name format (should be capitalized words)
    if (name && !/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(name)) {
      console.log('[EMCC Parse] Name format invalid:', name);
      name = '';
    }

    // Validate level matches EMCC levels
    if (level && !/Foundation|Practitioner|Senior Practitioner|Master Practitioner|Advanced Practitioner/i.test(level)) {
      console.log('[EMCC Parse] Award level not recognized:', level);
      level = '';
    }

    // Country already extracted from cells[0], no need to re-extract

    const urlPattern = /<a[^>]+href="([^"]+profile[^"]+)"[^>]*>/i;
    const urlMatch = rowHtml.match(urlPattern);
    let profileUrl = '';
    if (urlMatch && urlMatch[1]) {
      profileUrl = urlMatch[1].startsWith('http')
        ? urlMatch[1]
        : `https://www.emccglobal.org${urlMatch[1]}`;
    }

    return name ? {
      name,
      level: level || undefined,
      country: country || undefined,
      profileUrl: profileUrl || undefined,
    } : null;

  } catch (error) {
    console.error('[EMCC EIA Parse] Error:', error);
    return null;
  }
}

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
