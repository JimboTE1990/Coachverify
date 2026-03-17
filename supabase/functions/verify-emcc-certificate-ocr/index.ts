// verify-emcc-certificate
// DEV/PREVIEW ONLY — not enabled in production UI yet.
//
// Accepts a base64-encoded EMCC certificate image and calls the Claude Vision
// API to extract the EIA number, coach name, and accreditation level.
// Compares the extracted data against the user-provided details and returns
// a structured verification result.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateVerificationRequest {
  coachId: string;
  fullName: string;
  eiaNumber: string;                 // User-entered EIA number (e.g. "EIA20230480")
  accreditationLevel?: string;
  imageBase64: string;               // Base64-encoded image (JPEG, PNG, or PDF page)
  imageMediaType?: string;           // e.g. "image/jpeg" — defaults to "image/jpeg"
}

interface ExtractedCertData {
  eiaNumber: string | null;
  fullName: string | null;
  accreditationLevel: string | null;
  expiryDate: string | null;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  extractedData: ExtractedCertData;
  matchDetails: {
    nameMatch: boolean;
    eiaMatch: boolean;
    levelMatch: boolean;
  };
  reason: string;
}

// Normalise a name for fuzzy comparison
function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
}

// Calculate what fraction of words in `a` appear in `b`
function nameOverlap(a: string, b: string): number {
  const wordsA = normaliseName(a).split(/\s+/);
  const wordsB = normaliseName(b).split(/\s+/);
  const matches = wordsA.filter(w => wordsB.includes(w));
  return matches.length / wordsA.length;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!anthropicApiKey) throw new Error('Missing ANTHROPIC_API_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase env vars');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      coachId,
      fullName,
      eiaNumber,
      accreditationLevel,
      imageBase64,
      imageMediaType = 'image/jpeg',
    }: CertificateVerificationRequest = await req.json();

    if (!coachId || !fullName || !eiaNumber || !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName, eiaNumber, imageBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EMCC OCR] Starting certificate verification for:', { coachId, fullName, eiaNumber });

    // Step 1 — Check verified_credentials cache first
    const normalisedEia = eiaNumber.toUpperCase().trim();
    const { data: cached } = await supabase
      .from('verified_credentials')
      .select('*')
      .eq('accreditation_body', 'EMCC')
      .eq('credential_number', normalisedEia)
      .eq('is_active', true)
      .maybeSingle();

    if (cached) {
      const overlap = nameOverlap(fullName, cached.full_name);
      if (overlap >= 0.75) {
        console.log('[EMCC OCR] Cache hit — skipping OCR');
        return new Response(
          JSON.stringify({
            verified: true,
            confidence: 95,
            extractedData: {
              eiaNumber: cached.credential_number,
              fullName: cached.full_name,
              accreditationLevel: cached.accreditation_level,
              expiryDate: null,
            },
            matchDetails: { nameMatch: true, eiaMatch: true, levelMatch: true },
            reason: 'Verified from credential cache',
          } as VerificationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 2 — Call Claude Vision API to extract certificate data
    const prompt = `This is an EMCC (European Mentoring and Coaching Council) accreditation certificate.

Extract the following fields exactly as they appear on the certificate:
1. EIA Number — format is "EIA" followed by digits (e.g. EIA20230480, EIA20251840). IMPORTANT: On many EMCC certificates the EIA number is printed VERTICALLY along the right-hand border/spine of the certificate, rotated 90 degrees. Look carefully at all edges and borders of the image for this number. It may also be labelled "Reference", "Membership Number", or "EIA Ref".
2. Full name of the accredited individual (usually printed prominently in the centre of the certificate)
3. Accreditation level — must be one of: Foundation, Practitioner, Senior Practitioner, Master Practitioner
4. Expiry or valid-until date (if present)

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "eiaNumber": "EIA...",
  "fullName": "...",
  "accreditationLevel": "...",
  "expiryDate": "..."
}

If a field cannot be found, use null for that field.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageMediaType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text();
      console.error('[EMCC OCR] Claude API error:', err);
      throw new Error(`Claude API returned ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const rawText: string = claudeData.content?.[0]?.text ?? '';
    console.log('[EMCC OCR] Raw Claude response:', rawText);

    // Step 3 — Parse extracted JSON
    let extracted: ExtractedCertData = { eiaNumber: null, fullName: null, accreditationLevel: null, expiryDate: null };
    try {
      // Strip any markdown code fences if Claude added them
      const jsonText = rawText.replace(/```[a-z]*\n?/g, '').trim();
      extracted = JSON.parse(jsonText);
    } catch {
      console.error('[EMCC OCR] Failed to parse Claude JSON response');
      return new Response(
        JSON.stringify({
          verified: false,
          confidence: 0,
          extractedData: extracted,
          matchDetails: { nameMatch: false, eiaMatch: false, levelMatch: false },
          reason: 'Could not read certificate — please upload a clear image of your EMCC certificate and try again',
        } as VerificationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4 — Score the match
    let confidence = 0;

    const eiaMatch = !!(extracted.eiaNumber &&
      extracted.eiaNumber.toUpperCase().trim() === normalisedEia);
    if (eiaMatch) confidence += 50;

    const nameOverlapScore = extracted.fullName ? nameOverlap(fullName, extracted.fullName) : 0;
    const nameMatch = nameOverlapScore >= 0.75;
    if (nameOverlapScore >= 0.75) confidence += 40;
    else if (nameOverlapScore >= 0.5) confidence += 20;

    const validLevels = ['foundation', 'practitioner', 'senior practitioner', 'master practitioner'];
    const extractedLevel = (extracted.accreditationLevel ?? '').toLowerCase();
    const levelMatch = validLevels.some(l => extractedLevel.includes(l));
    if (levelMatch) confidence += 10;

    const verified = confidence >= 70;

    console.log('[EMCC OCR] Confidence:', confidence, '| Verified:', verified, '| EIA match:', eiaMatch, '| Name overlap:', nameOverlapScore);

    // Step 5 — Cache the result if verified
    if (verified && extracted.eiaNumber) {
      const { error: cacheError } = await supabase.from('verified_credentials').upsert({
        accreditation_body: 'EMCC',
        credential_number: extracted.eiaNumber.toUpperCase().trim(),
        full_name: extracted.fullName ?? fullName,
        accreditation_level: extracted.accreditationLevel ?? accreditationLevel ?? null,
        verified_by: 'ocr',
        verified_at: new Date().toISOString(),
        last_checked: new Date().toISOString(),
        is_active: true,
      }, { onConflict: 'accreditation_body,credential_number' });
      if (cacheError) console.error('[EMCC OCR] Cache write error:', cacheError);
    }

    const result: VerificationResult = {
      verified,
      confidence,
      extractedData: extracted,
      matchDetails: { nameMatch, eiaMatch, levelMatch },
      reason: verified
        ? 'Certificate verified successfully'
        : eiaMatch && !nameMatch
          ? 'Name on certificate does not match your account name — please ensure the name on your certificate matches exactly and try again'
          : !eiaMatch
            ? 'EIA number on certificate does not match your entry — please check your EIA number and try again'
            : 'Certificate could not be verified — please upload a clear image of your EMCC certificate',
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[EMCC OCR] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
