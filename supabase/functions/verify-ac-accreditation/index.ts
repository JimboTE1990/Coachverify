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

    // Log a sample from the body section where profile data lives
    const bodyStart = html.indexOf('<body');
    const bodySample = bodyStart !== -1 ? html.substring(bodyStart, bodyStart + 5000) : html.substring(3000, 8000);
    console.log('[AC Verification] Body Sample:', bodySample.substring(0, 3000));

    // Extract profile data - try multiple patterns
    let profileName = extractBetween(html, '<h1 class="page-title">', '</h1>');
    console.log('[AC Verification] First attempt (h1.page-title):', profileName);

    if (!profileName) {
      profileName = extractBetween(html, 'class="page-title">', '</');
      console.log('[AC Verification] Second attempt (class page-title):', profileName);
    }

    // Try alternative patterns if still not found
    if (!profileName) {
      // Look for any h1 tag
      profileName = extractBetween(html, '<h1>', '</h1>');
      console.log('[AC Verification] Third attempt (any h1):', profileName);
    }

    // Try looking for title tag
    if (!profileName) {
      profileName = extractBetween(html, '<title>', '</title>');
      // Clean up title tag (often has " | Association for Coaching" suffix)
      if (profileName) {
        profileName = profileName.split('|')[0].trim();
      }
      console.log('[AC Verification] Fourth attempt (title tag):', profileName);
    }

    // Try looking for meta property="og:title"
    if (!profileName) {
      const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
      profileName = ogTitleMatch?.[1] || null;
      if (profileName) {
        profileName = profileName.split('|')[0].trim();
      }
      console.log('[AC Verification] Fifth attempt (og:title):', profileName);
    }

    console.log('[AC Verification] Final extracted profile name:', profileName);

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

    // Check "Coach Accredited: Yes/No" - try multiple patterns
    let coachAccreditedMatch = html.match(/Coach Accredited:<\/.*?>\s*<.*?>(Yes|No)/i);
    console.log('[AC Verification] First accreditation pattern result:', coachAccreditedMatch?.[1]);

    // Try alternative pattern without closing tag requirement
    if (!coachAccreditedMatch) {
      coachAccreditedMatch = html.match(/Coach Accredited[:\s]*<[^>]*>(Yes|No)/i);
      console.log('[AC Verification] Second accreditation pattern result:', coachAccreditedMatch?.[1]);
    }

    // Try even simpler pattern
    if (!coachAccreditedMatch) {
      coachAccreditedMatch = html.match(/Coach Accredited[:\s]*(Yes|No)/i);
      console.log('[AC Verification] Third accreditation pattern result:', coachAccreditedMatch?.[1]);
    }

    // Log a snippet around "Coach Accredited" if it exists
    const coachAccreditedIndex = html.indexOf('Coach Accredited');
    if (coachAccreditedIndex !== -1) {
      const snippet = html.substring(coachAccreditedIndex, coachAccreditedIndex + 200);
      console.log('[AC Verification] Coach Accredited snippet:', snippet);
    } else {
      console.log('[AC Verification] "Coach Accredited" text not found in HTML');
    }

    // Check if this is a corporate member (who don't have individual coach accreditation)
    const isCorporateMember = html.includes('Membership Level:</strong></td>') && html.includes('>Corporate<');
    console.log('[AC Verification] Is corporate member:', isCorporateMember);

    const isAccredited = coachAccreditedMatch?.[1] === 'Yes';
    console.log('[AC Verification] Final Coach Accredited value:', coachAccreditedMatch?.[1]);

    if (!isAccredited) {
      // Provide clearer error message for corporate members
      const errorMessage = isCorporateMember
        ? 'This AC profile shows Corporate Membership, not individual coach accreditation. CoachDog requires individual AC coach accreditation. If you have individual accreditation, please provide your individual member profile URL instead.'
        : coachAccreditedIndex === -1
        ? 'No coach accreditation information found on this AC profile. Please ensure your profile displays "Coach Accredited: Yes" or contact AC support to update your profile.'
        : 'AC profile shows "Coach Accredited: No". Please ensure your AC coach accreditation is active and displayed on your profile.';

      return new Response(
        JSON.stringify({
          verified: false,
          errorMessage: errorMessage
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
