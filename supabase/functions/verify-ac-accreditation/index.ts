/**
 * Supabase Edge Function: Verify AC (Association for Coaching) Accreditation
 *
 * Verifies coach accreditation by scraping their AC member directory profile
 *
 * AC profiles show:
 * - "Coach Accredited: Yes" or "No"
 * - "Individual Accreditation Type: Coach Accreditation"
 * - "AC Coach Accreditation Level: AC Accredited Coach"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS headers for edge function responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileUrl, coachName } = await req.json();

    console.log('[AC Verification] Request:', { profileUrl, coachName });

    if (!profileUrl || !coachName) {
      return new Response(
        JSON.stringify({
          verified: false,
          errorMessage: 'Profile URL and coach name are required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch the AC profile page
    console.log('[AC Verification] Fetching profile:', profileUrl);

    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('[AC Verification] Failed to fetch profile:', response.status);
      return new Response(
        JSON.stringify({
          verified: false,
          errorMessage: `Could not access AC profile (HTTP ${response.status}). Please check the URL is correct.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const html = await response.text();
    console.log('[AC Verification] Profile fetched, length:', html.length);

    // Extract profile data
    const profileName = extractBetween(html, '<h1 class="page-title">', '</h1>') ||
                       extractBetween(html, 'class="page-title">', '</');

    console.log('[AC Verification] Extracted profile name:', profileName);

    // Validate name match
    if (!profileName) {
      return new Response(
        JSON.stringify({
          verified: false,
          errorMessage: 'Your name does not match the name on the AC profile URL you provided. Please check the name you signed up with matches, or provide the correct URL.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Normalize names for comparison (remove extra spaces, convert to lowercase)
    const normalizedProfileName = profileName.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedCoachName = coachName.toLowerCase().replace(/\s+/g, ' ').trim();

    // Handle organization names: "Nikkie Pullen, Abri" should match "Nikkie Pullen"
    // Extract just the person's name (before any comma)
    const profileNameOnly = normalizedProfileName.split(',')[0].trim();

    console.log('[AC Verification] Name comparison:', {
      profileName: normalizedProfileName,
      profileNameOnly: profileNameOnly,
      coachName: normalizedCoachName
    });

    // Check if names match (allowing for partial matches and organization suffixes)
    const nameMatches =
      profileNameOnly === normalizedCoachName ||
      normalizedProfileName.includes(normalizedCoachName) ||
      normalizedCoachName.includes(profileNameOnly) ||
      fuzzyNameMatch(profileNameOnly, normalizedCoachName);

    if (!nameMatches) {
      return new Response(
        JSON.stringify({
          verified: false,
          errorMessage: 'Your name does not match the name on the AC profile URL you provided. Please check the name you signed up with matches, or provide the correct URL.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check "Coach Accredited: Yes/No"
    const coachAccreditedMatch = html.match(/Coach Accredited:<\/.*?>\s*<.*?>(Yes|No)</i);
    const isAccredited = coachAccreditedMatch?.[1] === 'Yes';

    console.log('[AC Verification] Coach Accredited:', coachAccreditedMatch?.[1]);

    if (!isAccredited) {
      return new Response(
        JSON.stringify({
          verified: false,
          errorMessage: 'AC profile shows "Coach Accredited: No" or accreditation status not found. Please ensure your AC accreditation is active and displayed on your profile.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Extract accreditation level
    const levelMatch = html.match(/AC Coach Accreditation Level:<\/.*?>\s*<.*?>(.*?)</i);
    const level = levelMatch?.[1]?.trim() || 'AC Accredited Coach';

    console.log('[AC Verification] Level:', level);

    console.log('[AC Verification] Verification successful:', {
      profileName,
      level
    });

    // Return successful verification
    return new Response(
      JSON.stringify({
        verified: true,
        name: profileName,
        level: level
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[AC Verification] Error:', error);

    return new Response(
      JSON.stringify({
        verified: false,
        errorMessage: `Verification error: ${error.message}`
        }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to extract text between two strings
function extractBetween(text: string, start: string, end: string): string | null {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return null;

  const contentStart = startIndex + start.length;
  const endIndex = text.indexOf(end, contentStart);
  if (endIndex === -1) return null;

  return text.substring(contentStart, endIndex).trim();
}

// Helper function for fuzzy name matching (handles middle initials, etc.)
function fuzzyNameMatch(name1: string, name2: string): boolean {
  // Split names into parts
  const parts1 = name1.split(' ').filter(p => p.length > 0);
  const parts2 = name2.split(' ').filter(p => p.length > 0);

  // Must have at least first and last name
  if (parts1.length < 2 || parts2.length < 2) return false;

  // Check if first name matches
  const firstNameMatch = parts1[0] === parts2[0];

  // Check if last name matches
  const lastNameMatch = parts1[parts1.length - 1] === parts2[parts2.length - 1];

  // Both first and last must match for fuzzy match
  return firstNameMatch && lastNameMatch;
}
