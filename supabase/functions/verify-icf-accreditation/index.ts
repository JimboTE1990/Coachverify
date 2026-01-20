// Supabase Edge Function to verify ICF accreditation
// Mimics human search on ICF public directory: https://coachfederation.org/find-a-coach

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  coachId: string;
  fullName: string;
  credentialLevel: 'ACC' | 'PCC' | 'MCC'; // ICF credential level - REQUIRED
  country?: string;
}

interface VerificationResult {
  verified: boolean;
  confidence: number; // 0-100
  matchDetails?: {
    name: string;
    credential?: string;
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
    const { coachId, fullName, credentialLevel, country }: VerificationRequest = await req.json();

    if (!coachId || !fullName || !credentialLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName, credentialLevel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ICF Verification] Starting verification for:', {
      coachId,
      fullName,
      credentialLevel,
      country
    });

    // Parse full name into first and last name for ICF search
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // If only one name, use it as last name too

    // Verify using ICF directory search
    const result = await searchICFDirectory(firstName, lastName, fullName, credentialLevel, country);

    console.log('[ICF Verification] Search result:', result);

    // Update coach profile with verification result
    if (result.verified && result.matchDetails) {
      // Check if this credential is already used by another coach
      const { data: existingCoach, error: checkError } = await supabase
        .from('coaches')
        .select('id, name, email')
        .eq('icf_verified', true)
        .eq('icf_accreditation_level', credentialLevel)
        .ilike('name', `%${fullName.split(' ')[fullName.split(' ').length - 1]}%`) // Check by last name
        .neq('id', coachId)
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned (which is fine)
        console.error('[ICF Verification] Error checking for duplicates:', checkError);
      }

      // If another verified coach exists with similar name and same credential, flag potential duplicate
      if (existingCoach) {
        console.warn('[ICF Verification] Potential duplicate detected:', existingCoach);
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `This ${credentialLevel} credential appears to be already verified by another coach in our system (${existingCoach.name}). If you believe this is an error, please contact support at support@coachdog.com`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          icf_verified: true,
          icf_verified_at: new Date().toISOString(),
          icf_profile_url: result.matchDetails.profileUrl || null,
          icf_accreditation_level: credentialLevel,
        })
        .eq('id', coachId);

      if (updateError) {
        console.error('[ICF Verification] Error updating coach:', updateError);
        throw updateError;
      }

      console.log('[ICF Verification] Coach verified successfully');
    } else {
      // Mark as unverified
      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          icf_verified: false,
        })
        .eq('id', coachId);

      if (updateError) {
        console.error('[ICF Verification] Error updating coach:', updateError);
        throw updateError;
      }

      console.log('[ICF Verification] Coach not verified:', result.reason);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ICF Verification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Search ICF public directory for a coach by name
 * Mimics human search behavior - submitting first name and last name
 */
async function searchICFDirectory(
  firstName: string,
  lastName: string,
  fullName: string,
  expectedCredential: string,
  expectedCountry?: string
): Promise<VerificationResult> {
  try {
    console.log('[ICF Search] Searching for:', { firstName, lastName, expectedCredential });

    // ICF Directory search endpoint (verified URL and parameters)
    const searchUrl = 'https://apps.coachingfederation.org/eweb/DynamicPage.aspx';

    // Build search params (mimicking human form submission)
    // Exact parameters from ICF directory form analysis
    const params = new URLSearchParams({
      'WebCode': 'ICFDirectory',
      'Site': 'ICFAppsR',
      'firstname': firstName,  // lowercase as per ICF form
      'lastname': lastName,    // lowercase as per ICF form
      'sort': '1',            // Default sort order (Last Name A-Z)
    });

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://apps.coachingfederation.org/eweb/DynamicPage.aspx?WebCode=ICFDirectory&Site=ICFAppsR',
      'Connection': 'keep-alive',
    };

    console.log('[ICF Search] Querying:', `${searchUrl}?${params.toString()}`);
    console.log('[ICF Search] Parameters:', Object.fromEntries(params));

    const response = await fetch(`${searchUrl}?${params.toString()}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000), // 15 second timeout (ASP.NET can be slow)
    });

    if (!response.ok) {
      console.error('[ICF Search] HTTP error:', response.status, response.statusText);
      return {
        verified: false,
        confidence: 0,
        reason: `ICF directory search failed (HTTP ${response.status}). Please try again later.`,
      };
    }

    const html = await response.text();

    // Log snippet of response for debugging
    console.log('[ICF Search] Response preview (first 500 chars):', html.substring(0, 500));
    console.log('[ICF Search] Response contains search term?', html.toLowerCase().includes(firstName.toLowerCase()));

    // Parse results looking for name and credential matches
    const matches = parseICFResults(html, fullName, expectedCredential);

    if (matches.length === 0) {
      return {
        verified: false,
        confidence: 0,
        reason: `No ${expectedCredential} credential found for ${fullName} in ICF directory`,
      };
    }

    console.log('[ICF Search] Found', matches.length, 'potential matches');

    // Find best match using name similarity
    const bestMatch = findBestMatch(matches, fullName, expectedCredential);

    if (!bestMatch) {
      return {
        verified: false,
        confidence: 30,
        reason: 'Found possible matches but names do not match closely enough',
      };
    }

    // Note: We verify credentials at onboarding only, not ongoing
    // Credential expiry is not checked to reduce friction and complexity

    // Calculate confidence based on match quality
    const nameSimilarity = calculateSimilarity(bestMatch.name.toLowerCase(), fullName.toLowerCase());
    let confidence = Math.round(nameSimilarity * 100);

    // Boost if credential matches exactly
    if (bestMatch.credential?.includes(expectedCredential)) {
      confidence = Math.min(95, confidence + 5); // Max 95% for ICF (no unique ID like EMCC)
    }

    const verified = confidence >= 80; // 80% threshold for verification

    return {
      verified,
      confidence,
      matchDetails: bestMatch,
      reason: verified
        ? `Successfully verified ${expectedCredential} credential`
        : `Match confidence (${confidence}%) below threshold`
    };

  } catch (error) {
    console.error('[ICF Search] Error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse ICF directory HTML results
 * Extracts coach entries with name, credential, country, profile URL
 */
function parseICFResults(
  html: string,
  searchName: string,
  expectedCredential: string
): Array<{ name: string; credential?: string; country?: string; profileUrl?: string }> {
  const results: Array<{ name: string; credential?: string; country?: string; profileUrl?: string }> = [];

  try {
    // ICF directory typically shows results in a structured format
    // Look for coach entries - adjust patterns based on actual ICF HTML structure

    // Pattern 1: Look for profile links with coach names
    const linkPattern = /<a[^>]+href="([^"]+(?:coach|profile)[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    const linkMatches = [...html.matchAll(linkPattern)];

    for (const match of linkMatches) {
      const profileUrl = match[1];
      const text = match[2].trim();

      // Check if this looks like a coach name
      if (text && isLikelyName(text, searchName)) {
        // Extract credential info from surrounding context
        const credential = extractCredentialFromContext(html, text, expectedCredential);

        results.push({
          name: text,
          credential,
          profileUrl: profileUrl.startsWith('http') ? profileUrl : `https://coachfederation.org${profileUrl}`,
        });
      }
    }

    // Pattern 2: Look for credential badges/labels (e.g., "ACC", "PCC", "MCC")
    const credentialPattern = new RegExp(`(${expectedCredential})\\s*(?:[0-9/\\s-]+)?`, 'gi');
    const credentialMatches = [...html.matchAll(credentialPattern)];

    console.log('[ICF Parse] Found', results.length, 'potential matches with credentials');

  } catch (error) {
    console.error('[ICF Parse] Error parsing HTML:', error);
  }

  return results;
}

/**
 * Extract credential information from HTML context around a name
 */
function extractCredentialFromContext(html: string, name: string, expectedCredential: string): string | undefined {
  try {
    // Find the position of the name in HTML
    const nameIndex = html.indexOf(name);
    if (nameIndex === -1) return undefined;

    // Get surrounding context (500 chars before and after)
    const contextStart = Math.max(0, nameIndex - 500);
    const contextEnd = Math.min(html.length, nameIndex + 500);
    const context = html.substring(contextStart, contextEnd);

    // Look for credential patterns in context
    // ICF format is typically: "PCC 9/2019 - 9/2028"
    const credentialPattern = /(ACC|PCC|MCC)\s+(\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{4})/i;
    const match = context.match(credentialPattern);

    if (match) {
      return match[0]; // Return full credential string (e.g., "PCC 9/2019 - 9/2028")
    }

    // Fallback: Look for just the credential level
    const levelPattern = new RegExp(`(${expectedCredential})`, 'i');
    const levelMatch = context.match(levelPattern);

    return levelMatch ? levelMatch[0] : undefined;

  } catch (error) {
    console.error('[ICF Parse] Error extracting credential:', error);
    return undefined;
  }
}

/**
 * Find best matching coach from results
 */
function findBestMatch(
  matches: Array<{ name: string; credential?: string; country?: string; profileUrl?: string }>,
  expectedName: string,
  expectedCredential: string
): { name: string; credential?: string; country?: string; profileUrl?: string } | null {
  if (matches.length === 0) return null;

  // Filter matches with the expected credential
  const credentialMatches = matches.filter(m =>
    m.credential?.toUpperCase().includes(expectedCredential.toUpperCase())
  );

  const candidateMatches = credentialMatches.length > 0 ? credentialMatches : matches;

  // Find the match with highest name similarity
  let bestMatch = candidateMatches[0];
  let bestSimilarity = calculateSimilarity(bestMatch.name.toLowerCase(), expectedName.toLowerCase());

  for (const match of candidateMatches.slice(1)) {
    const similarity = calculateSimilarity(match.name.toLowerCase(), expectedName.toLowerCase());
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = match;
    }
  }

  // Only return if similarity is above threshold (85%)
  return bestSimilarity >= 0.85 ? bestMatch : null;
}

// Note: Credential expiry checking has been removed
// We verify credentials once at onboarding only, not ongoing
// This reduces friction and complexity for coaches

/**
 * Check if a text string is likely a person's name
 */
function isLikelyName(text: string, searchName: string): boolean {
  // Basic heuristics
  if (text.length < 3 || text.length > 100) return false;
  if (!/[a-z]/i.test(text)) return false; // Must contain letters
  if (/^(search|results|directory|find|coach|profile)/i.test(text)) return false; // Exclude common headings

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
