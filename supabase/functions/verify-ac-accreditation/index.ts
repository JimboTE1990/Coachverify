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
