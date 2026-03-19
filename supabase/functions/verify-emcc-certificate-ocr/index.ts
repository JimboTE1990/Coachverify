// verify-emcc-certificate
// DEV/PREVIEW ONLY — not enabled in production UI yet.
//
// Accepts a base64-encoded EMCC certificate image and calls the Claude Vision
// API to extract the EIA number, coach name, and accreditation level.
// Compares the extracted data against the user-provided details and returns
// a structured verification result.
//
// Bot protection (4 layers):
//   1. IP rate limit    — max 10 calls per IP per hour (ocr_rate_limits table)
//   2. Payload size cap — imageBase64 must decode to ≤ 5 MB
//   3. EIA format check — must match /^(EIA|ESIA)\d+$/i before calling Claude
//   4. Cache short-circuit — same EIA verified in last 24 h skips Claude entirely

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://www.coachdog.co.uk',
  'https://coachdog.co.uk',
  'https://coachverify.vercel.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// ── Constants ──────────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX       = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in ms
const MAX_IMAGE_BYTES      = 5 * 1024 * 1024; // 5 MB
const EIA_PATTERN          = /^(EIA|ESIA)\d+$/i;
const CACHE_REUSE_HOURS    = 24;

interface CertificateVerificationRequest {
  coachId: string;
  fullName: string;
  eiaNumber: string;
  accreditationLevel?: string;
  imageBase64: string;
  imageMediaType?: string;
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

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
}

function nameOverlap(a: string, b: string): number {
  const wordsA = normaliseName(a).split(/\s+/);
  const wordsB = normaliseName(b).split(/\s+/);
  const matches = wordsA.filter(w => wordsB.includes(w));
  return matches.length / wordsA.length;
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropicApiKey    = Deno.env.get('ANTHROPIC_API_KEY');
    const supabaseUrl        = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!anthropicApiKey)                    throw new Error('Missing ANTHROPIC_API_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase env vars');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Layer 1: IP rate limiting ──────────────────────────────────────────────
    const clientIp = getClientIp(req);
    if (clientIp !== 'unknown') {
      const windowCutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
      const { data: rlRow } = await supabase
        .from('ocr_rate_limits')
        .select('call_count, window_start')
        .eq('ip_address', clientIp)
        .maybeSingle();

      if (rlRow && new Date(rlRow.window_start) > new Date(windowCutoff)) {
        // Within the current window
        if (rlRow.call_count >= RATE_LIMIT_MAX) {
          console.warn('[EMCC OCR] Rate limit exceeded for IP:', clientIp);
          return new Response(
            JSON.stringify({ error: 'Too many requests — please try again later' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        await supabase
          .from('ocr_rate_limits')
          .update({ call_count: rlRow.call_count + 1 })
          .eq('ip_address', clientIp);
      } else {
        // New or expired window — reset
        await supabase
          .from('ocr_rate_limits')
          .upsert({ ip_address: clientIp, window_start: new Date().toISOString(), call_count: 1 });
      }
    }

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

    // ── Layer 2: Payload size cap ──────────────────────────────────────────────
    const approxBytes = imageBase64.length * 0.75;
    if (approxBytes > MAX_IMAGE_BYTES) {
      console.warn('[EMCC OCR] Payload too large:', Math.round(approxBytes / 1024), 'KB');
      return new Response(
        JSON.stringify({ error: 'Image too large — please upload a file under 5 MB' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Layer 3: EIA number format validation ──────────────────────────────────
    const normalisedEia = eiaNumber.toUpperCase().trim();
    if (!EIA_PATTERN.test(normalisedEia)) {
      console.warn('[EMCC OCR] Invalid EIA format:', normalisedEia);
      return new Response(
        JSON.stringify({
          verified: false,
          confidence: 0,
          extractedData: { eiaNumber: null, fullName: null, accreditationLevel: null, expiryDate: null },
          matchDetails: { nameMatch: false, eiaMatch: false, levelMatch: false },
          reason: 'Invalid EIA number format — it should start with EIA or ESIA followed by digits (e.g. EIA20251840)',
        } as VerificationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EMCC OCR] Starting certificate verification for:', { coachId, fullName, eiaNumber: normalisedEia });

    // ── Layer 4: Cache short-circuit ───────────────────────────────────────────
    const cacheWindow = new Date(Date.now() - CACHE_REUSE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('verified_credentials')
      .select('*')
      .eq('accreditation_body', 'EMCC')
      .eq('credential_number', normalisedEia)
      .eq('is_active', true)
      .gte('last_checked', cacheWindow)
      .maybeSingle();

    if (cached) {
      const overlap = nameOverlap(fullName, cached.full_name);
      if (overlap >= 0.75) {
        console.log('[EMCC OCR] Cache hit — skipping Claude API call');
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
            reason: 'Certificate verified successfully',
          } as VerificationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Call Claude Vision API ─────────────────────────────────────────────────
    const prompt = `This is an EMCC (European Mentoring and Coaching Council) accreditation certificate. It may be an EIA (Individual Accreditation) or ESIA (Senior Individual Accreditation) certificate. The layout is as follows:\n- TOP SECTION: The accredited person's full name appears below the text "This Certificate is awarded to"\n- MIDDLE SECTION: The accreditation level (e.g. "Practitioner", "Senior Practitioner")\n- RIGHT BORDER: The accreditation reference number is printed VERTICALLY (rotated 90 degrees clockwise) along the right-hand edge of the certificate. It starts with "EIA" or "ESIA" followed by digits (e.g. EIA20230480, EIA20251840, ESIA20230123). Look carefully at the right edge of the image for this rotated text — it is the most important field to extract.\n\nExtract the following fields:\n1. Accreditation number — starts with "EIA" or "ESIA" followed by digits, printed vertically on the right border. Return it exactly as it appears including the prefix.\n2. Full name of the accredited individual — below "This Certificate is awarded to" near the top\n3. Accreditation level — one of: Foundation, Practitioner, Senior Practitioner, Master Practitioner\n4. Expiry or valid-until date (if present)\n\nReturn ONLY valid JSON in this exact format (no markdown, no explanation):\n{\n  "eiaNumber": "EIA... or ESIA...",\n  "fullName": "...",\n  "accreditationLevel": "...",\n  "expiryDate": "..."\n}\n\nIf a field cannot be found, use null for that field.`;

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

    // Parse extracted JSON
    let extracted: ExtractedCertData = { eiaNumber: null, fullName: null, accreditationLevel: null, expiryDate: null };
    try {
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

    // Score the match
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

    // Cache if verified
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
      JSON.stringify({ error: 'Certificate verification is currently unavailable — please try again or contact support' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
