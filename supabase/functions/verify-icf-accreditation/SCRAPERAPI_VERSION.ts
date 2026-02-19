// Supabase Edge Function to verify ICF accreditation
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
  credentialLevel: string; // ACC, PCC, or MCC
  country?: string;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  matchDetails?: {
    name: string;
    credential?: string;
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

    const { coachId, fullName, credentialLevel, country }: VerificationRequest = await req.json();

    if (!coachId || !fullName || !credentialLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName, credentialLevel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ICF Verification] Starting verification for:', { coachId, fullName, credentialLevel });

    const normalizedName = fullName.trim().toLowerCase();
    const normalizedCredential = credentialLevel.trim().toUpperCase();

    // Parse name into first and last
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    // Create cache key (ICF uses name + credential level)
    const cacheKey = `${normalizedName}_${normalizedCredential}`;

    // STEP 1: Check internal verified_credentials cache first
    console.log('[ICF Verification] Checking internal cache for:', cacheKey);

    const { data: cachedCredential, error: cacheError } = await supabase
      .from('verified_credentials')
      .select('*')
      .eq('accreditation_body', 'ICF')
      .eq('credential_number', cacheKey)
      .eq('is_active', true)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') {
      console.warn('[ICF Verification] Cache lookup error:', cacheError);
    }

    if (cachedCredential) {
      console.log('[ICF Verification] Found in cache:', cachedCredential.full_name);

      const nameSimilarity = calculateSimilarity(
        cachedCredential.full_name.toLowerCase().trim(),
        normalizedName
      );

      console.log('[ICF Verification] Cache name match:', {
        cached: cachedCredential.full_name,
        provided: fullName,
        similarity: nameSimilarity
      });

      if (nameSimilarity >= 0.85) {
        console.log('[ICF Verification] Cache hit - verified from internal database');

        const result: VerificationResult = {
          verified: true,
          confidence: 100,
          matchDetails: {
            name: cachedCredential.full_name,
            credential: cachedCredential.accreditation_level || undefined,
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
              icf_verified: true,
              icf_verified_at: new Date().toISOString(),
              icf_profile_url: result.matchDetails.profileUrl || null,
              credential_level: result.matchDetails.credential || credentialLevel,
              verification_status: 'verified',
            })
            .eq('id', coachId);

          console.log('[ICF Verification] Coach verified successfully (from cache)');
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.warn('[ICF Verification] Cache found but name mismatch');
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `These credentials are registered to a different coach. Please verify you're using your own name and credential level, or contact support if you believe this is an error.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[ICF Verification] Not in cache, attempting live verification...');

    // STEP 2: Use ScraperAPI for live verification
    const result = await searchICFDirectory(firstName, lastName, fullName, normalizedCredential, country);

    console.log('[ICF Verification] Search result:', result);

    // STEP 3: Handle result
    const isTempId = coachId.startsWith('temp_');

    if (!result.verified && result.reason?.includes('ScraperAPI')) {
      // ScraperAPI failed or not configured - mark for manual review
      if (!isTempId) {
        await supabase
          .from('coach_profiles')
          .update({
            verification_status: 'manual_review',
            verification_notes: `ICF: ${fullName}, Credential: ${credentialLevel}, Reason: ${result.reason}`,
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
        .eq('icf_verified', true)
        .eq('credential_level', result.matchDetails.credential)
        .ilike('name', `%${lastName}%`)
        .neq('id', coachId);

      if (existingCoaches && existingCoaches.length > 0) {
        const existingCoach = existingCoaches[0];
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `This ICF credential appears to be already verified by another coach in our system (${existingCoach.name}). If you believe this is an error, please contact support at support@coachdog.com.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update and cache the verified credential
      await supabase.from('coach_profiles').update({
        icf_verified: true,
        icf_verified_at: new Date().toISOString(),
        icf_profile_url: result.matchDetails.profileUrl || null,
        credential_level: result.matchDetails.credential || credentialLevel,
        verification_status: 'verified',
      }).eq('id', coachId);

      // Add to cache for future verifications (using name+credential as key)
      await supabase.from('verified_credentials').insert({
        accreditation_body: 'ICF',
        credential_number: cacheKey,
        full_name: result.matchDetails.name,
        accreditation_level: result.matchDetails.credential,
        country: result.matchDetails.country,
        profile_url: result.matchDetails.profileUrl,
        verified_by: 'auto',
      });

      console.log('[ICF Verification] Coach verified successfully (from live check) and added to cache');
    } else if (!result.verified && !isTempId) {
      await supabase.from('coach_profiles').update({
        icf_verified: false,
        verification_status: 'rejected',
      }).eq('id', coachId);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ICF Verification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Search ICF directory using ScraperAPI
 */
async function searchICFDirectory(
  firstName: string,
  lastName: string,
  fullName: string,
  expectedCredential: string,
  expectedCountry?: string
): Promise<VerificationResult> {
  try {
    console.log('[ICF Directory Search] Starting search for:', { firstName, lastName, expectedCredential });

    // ICF Directory search URL and parameters
    const searchUrl = 'https://apps.coachingfederation.org/eweb/DynamicPage.aspx';
    const params = new URLSearchParams({
      'WebCode': 'ICFDirectory',
      'Site': 'ICFAppsR',
      'firstname': firstName,
      'lastname': lastName,
      'sort': '1'
    });
    const targetUrl = `${searchUrl}?${params.toString()}`;

    const scraperApiKey = Deno.env.get('SCRAPER_API_KEY');

    if (!scraperApiKey) {
      console.warn('[ICF Directory Search] No SCRAPER_API_KEY found');
      return {
        verified: false,
        confidence: 0,
        reason: 'ScraperAPI key not configured. Automatic verification is not available.',
      };
    }

    // Use ScraperAPI (PRIMARY METHOD)
    const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render=false&country_code=us`;

    console.log('[ICF Directory Search] Using ScraperAPI for:', targetUrl);

    const response = await fetch(scraperUrl, {
      signal: AbortSignal.timeout(30000),
    });

    console.log('[ICF Directory Search] ScraperAPI response status:', response.status);

    if (!response.ok) {
      return {
        verified: false,
        confidence: 0,
        reason: `ScraperAPI returned HTTP ${response.status}. Please try again or contact support.`,
      };
    }

    const html = await response.text();
    const matches = parseICFResults(html, fullName, expectedCredential);

    if (!matches || matches.length === 0) {
      return {
        verified: false,
        confidence: 0,
        reason: `No ${expectedCredential} credential found for ${fullName} in ICF directory. Please verify your name and credential level.`,
      };
    }

    // Find best match
    let bestMatch = matches[0];
    let bestSimilarity = calculateSimilarity(
      bestMatch.name.toLowerCase().trim(),
      fullName.toLowerCase().trim()
    );

    for (const match of matches) {
      const similarity = calculateSimilarity(
        match.name.toLowerCase().trim(),
        fullName.toLowerCase().trim()
      );
      if (similarity > bestSimilarity) {
        bestMatch = match;
        bestSimilarity = similarity;
      }
    }

    console.log('[ICF Directory Search] Best match:', {
      found: bestMatch.name,
      expected: fullName,
      similarity: bestSimilarity,
      credential: bestMatch.credential
    });

    if (bestSimilarity < 0.7) {
      return {
        verified: false,
        confidence: 0,
        reason: `Found coaches in ICF directory, but none match your name closely enough. Best match was "${bestMatch.name}" (${Math.round(bestSimilarity * 100)}% similar).`,
      };
    }

    // Verify credential matches
    if (bestMatch.credential && !bestMatch.credential.includes(expectedCredential)) {
      return {
        verified: false,
        confidence: 0,
        reason: `Found "${bestMatch.name}" in ICF directory with credential "${bestMatch.credential}", but you selected "${expectedCredential}". Please verify your credential level.`,
      };
    }

    return {
      verified: true,
      confidence: 100,
      matchDetails: {
        name: bestMatch.name,
        credential: bestMatch.credential,
        country: bestMatch.country,
        profileUrl: bestMatch.profileUrl,
      },
      reason: `Successfully verified ${expectedCredential} credential for ${bestMatch.name}`,
    };

  } catch (error) {
    console.error('[ICF Directory Search] Error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: `ScraperAPI verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse ICF directory HTML results
 */
function parseICFResults(
  html: string,
  searchName: string,
  expectedCredential: string
): Array<{ name: string; credential?: string; country?: string; profileUrl?: string }> | null {
  try {
    const results: Array<{ name: string; credential?: string; country?: string; profileUrl?: string }> = [];

    // ICF shows results in table rows or div containers
    // Look for patterns like:
    // <div class="result">Name: John Smith, Credential: PCC, Country: USA</div>

    // Pattern 1: Look for credential badges (ACC, PCC, MCC)
    const credentialPattern = new RegExp(`(${expectedCredential})`, 'gi');
    if (!credentialPattern.test(html)) {
      console.log('[ICF Parse] Credential not found in HTML');
      return null;
    }

    // Pattern 2: Extract result rows containing the credential
    const rowPatterns = [
      new RegExp(`<tr[^>]*>([\\s\\S]*?${expectedCredential}[\\s\\S]*?)<\\/tr>`, 'gi'),
      new RegExp(`<div[^>]*class="[^"]*(?:result|coach|member)[^"]*"[^>]*>([\\s\\S]*?${expectedCredential}[\\s\\S]*?)<\\/div>`, 'gi'),
    ];

    for (const pattern of rowPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const rowHtml = match[1];

        // Extract name
        const namePatterns = [
          /<(?:strong|b)>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/(?:strong|b)>/i,
          /<a[^>]+>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/a>/i,
          /Name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
        ];

        let name = '';
        for (const namePattern of namePatterns) {
          const nameMatch = rowHtml.match(namePattern);
          if (nameMatch && nameMatch[1]) {
            name = nameMatch[1].trim();
            if (name.length > 3 && name.length < 100) break;
          }
        }

        if (!name) continue;

        // Extract credential
        const credMatch = rowHtml.match(/(ACC|PCC|MCC)/i);
        const credential = credMatch ? credMatch[1].toUpperCase() : undefined;

        // Extract country
        const countryMatch = rowHtml.match(/Country[:\s]+([A-Za-z\s]+)/i);
        const country = countryMatch ? countryMatch[1].trim() : undefined;

        // Extract profile URL (if available)
        const urlMatch = rowHtml.match(/<a[^>]+href="([^"]+)"[^>]*>/i);
        const profileUrl = urlMatch ? urlMatch[1] : undefined;

        results.push({ name, credential, country, profileUrl });
      }
    }

    console.log('[ICF Parse] Found', results.length, 'results');
    return results.length > 0 ? results : null;

  } catch (error) {
    console.error('[ICF Parse] Error:', error);
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
