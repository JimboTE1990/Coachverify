// verify-icf-certificate-ocr
//
// Accepts a base64-encoded ICF credential certificate image and calls the Claude
// Vision API to extract the coach name, credential level (ACC/PCC/MCC/ACTC), and
// expiry date. Compares the extracted data against the user-provided details and
// returns a structured verification result.
//
// Bot protection (3 layers):
//   1. IP rate limit    — max 10 calls per IP per hour (ocr_rate_limits table)
//   2. Payload size cap — imageBase64 must decode to ≤ 5 MB
//   3. Cache short-circuit — same name+level verified in last 24 h skips Claude

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://www.coachdog.co.uk',
  'https://coachdog.co.uk',
  'https://coachverify.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
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
const CACHE_REUSE_HOURS    = 24;
const VALID_LEVELS         = ['ACC', 'PCC', 'MCC', 'ACTC'];

interface CertificateVerificationRequest {
  coachId: string;
  fullName: string;
  accreditationLevel: string; // ACC, PCC, MCC, ACTC
  imageBase64: string;
  imageMediaType?: string;
}

interface ExtractedCertData {
  credentialNumber: string | null;
  fullName: string | null;
  credentialLevel: string | null;
  expiryDate: string | null;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  extractedData: ExtractedCertData;
  matchDetails: {
    nameMatch: boolean;
    levelMatch: boolean;
    notExpired: boolean;
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

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false; // can't confirm expiry without a date
  try {
    return new Date(dateStr) < new Date();
  } catch {
    return false;
  }
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
        if (rlRow.call_count >= RATE_LIMIT_MAX) {
          console.warn('[ICF OCR] Rate limit exceeded for IP:', clientIp);
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
        await supabase
          .from('ocr_rate_limits')
          .upsert({ ip_address: clientIp, window_start: new Date().toISOString(), call_count: 1 });
      }
    }

    const {
      coachId,
      fullName,
      accreditationLevel,
      imageBase64,
      imageMediaType = 'image/jpeg',
    }: CertificateVerificationRequest = await req.json();

    if (!coachId || !fullName || !accreditationLevel || !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachId, fullName, accreditationLevel, imageBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalisedLevel = accreditationLevel.toUpperCase().trim();
    if (!VALID_LEVELS.includes(normalisedLevel)) {
      return new Response(
        JSON.stringify({
          verified: false,
          confidence: 0,
          extractedData: { credentialNumber: null, fullName: null, credentialLevel: null, expiryDate: null },
          matchDetails: { nameMatch: false, levelMatch: false, notExpired: false },
          reason: 'Invalid credential level — must be ACC, PCC, MCC, or ACTC',
        } as VerificationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Layer 2: Payload size cap ──────────────────────────────────────────────
    const approxBytes = imageBase64.length * 0.75;
    if (approxBytes > MAX_IMAGE_BYTES) {
      console.warn('[ICF OCR] Payload too large:', Math.round(approxBytes / 1024), 'KB');
      return new Response(
        JSON.stringify({ error: 'Image too large — please upload a file under 5 MB' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ICF OCR] Starting certificate verification for:', { coachId, fullName, accreditationLevel: normalisedLevel });

    // ── Layer 3: Cache short-circuit ───────────────────────────────────────────
    const cacheKey = `${fullName.trim().toUpperCase()}_${normalisedLevel}`;
    const cacheWindow = new Date(Date.now() - CACHE_REUSE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('verified_credentials')
      .select('*')
      .eq('accreditation_body', 'ICF')
      .eq('credential_number', cacheKey)
      .eq('is_active', true)
      .gte('last_checked', cacheWindow)
      .maybeSingle();

    if (cached) {
      const overlap = nameOverlap(fullName, cached.full_name);
      if (overlap >= 0.75) {
        console.log('[ICF OCR] Cache hit — skipping Claude API call');
        return new Response(
          JSON.stringify({
            verified: true,
            confidence: 95,
            extractedData: {
              credentialNumber: cached.credential_number ?? null,
              fullName: cached.full_name,
              credentialLevel: cached.accreditation_level,
              expiryDate: null,
            },
            matchDetails: { nameMatch: true, levelMatch: true, notExpired: true },
            reason: 'Certificate verified successfully',
          } as VerificationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Call Claude Vision API ─────────────────────────────────────────────────
    const prompt = `This is an ICF (International Coaching Federation) credential certificate. ICF issues certificates for coaches who have earned one of the following credentials: ACC (Associate Certified Coach), PCC (Professional Certified Coach), MCC (Master Certified Coach), or ACTC (Approved Coach Training Course).

A typical ICF credential certificate contains:
- The coach's full name, usually prominently displayed near the top or centre
- The credential level (ACC, PCC, MCC, or ACTC), often displayed as text or an acronym
- A "Valid Through" or "Expiry" date indicating when the credential expires
- Optionally, a credential or certificate number (numeric or alphanumeric)
- The ICF logo or seal

Extract the following fields:
1. Full name of the credential holder — as it appears on the certificate
2. Credential level — one of: ACC, PCC, MCC, ACTC
3. Expiry or "valid through" date — in ISO format (YYYY-MM-DD) if possible, otherwise as written
4. Credential number — if visible (may be labelled "Certificate No.", "Credential ID", or similar); null if not present

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "credentialNumber": "...",
  "fullName": "...",
  "credentialLevel": "ACC",
  "expiryDate": "YYYY-MM-DD"
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
      console.error('[ICF OCR] Claude API error:', err);
      throw new Error(`Claude API returned ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const rawText: string = claudeData.content?.[0]?.text ?? '';
    console.log('[ICF OCR] Raw Claude response:', rawText);

    // Parse extracted JSON
    let extracted: ExtractedCertData = { credentialNumber: null, fullName: null, credentialLevel: null, expiryDate: null };
    try {
      const jsonText = rawText.replace(/```[a-z]*\n?/g, '').trim();
      extracted = JSON.parse(jsonText);
    } catch {
      console.error('[ICF OCR] Failed to parse Claude JSON response');
      return new Response(
        JSON.stringify({
          verified: false,
          confidence: 0,
          extractedData: extracted,
          matchDetails: { nameMatch: false, levelMatch: false, notExpired: false },
          reason: 'Could not read certificate — please upload a clear image of your ICF certificate and try again',
        } as VerificationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score the match
    let confidence = 0;

    const nameOverlapScore = extracted.fullName ? nameOverlap(fullName, extracted.fullName) : 0;
    const nameMatch = nameOverlapScore >= 0.75;
    if (nameOverlapScore >= 0.75) confidence += 40;
    else if (nameOverlapScore >= 0.5) confidence += 20;

    const extractedLevel = (extracted.credentialLevel ?? '').toUpperCase().trim();
    const levelMatch = extractedLevel === normalisedLevel;
    if (levelMatch) confidence += 30;

    const expired = isExpired(extracted.expiryDate);
    const notExpired = !expired;
    if (notExpired) confidence += 20;

    // Bonus: credential number extracted
    if (extracted.credentialNumber) confidence += 10;

    console.log('[ICF OCR] Confidence:', confidence, '| Name overlap:', nameOverlapScore, '| Level match:', levelMatch, '| Expired:', expired);

    // Expiry gate — if we extracted a date and it's past, always reject
    if (expired) {
      return new Response(
        JSON.stringify({
          verified: false,
          confidence,
          extractedData: extracted,
          matchDetails: { nameMatch, levelMatch, notExpired: false },
          reason: `Your ICF credential appears to have expired (${extracted.expiryDate}). Please renew your credential with ICF and try again, or contact us if you believe this is an error.`,
        } as VerificationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verified = confidence >= 70;

    // Cache if verified
    if (verified) {
      const { error: cacheError } = await supabase.from('verified_credentials').upsert({
        accreditation_body: 'ICF',
        credential_number: cacheKey,
        full_name: extracted.fullName ?? fullName,
        accreditation_level: extracted.credentialLevel ?? accreditationLevel ?? null,
        verified_by: 'certificate_ocr',
        verified_at: new Date().toISOString(),
        last_checked: new Date().toISOString(),
        is_active: true,
      }, { onConflict: 'accreditation_body,credential_number' });
      if (cacheError) console.error('[ICF OCR] Cache write error:', cacheError);
    }

    const result: VerificationResult = {
      verified,
      confidence,
      extractedData: extracted,
      matchDetails: { nameMatch, levelMatch, notExpired },
      reason: verified
        ? 'Certificate verified successfully'
        : !nameMatch
          ? 'Name on certificate does not match your account name — please ensure the name on your certificate matches exactly and try again'
          : !levelMatch
            ? `Credential level on certificate (${extractedLevel || 'not found'}) does not match your selection (${normalisedLevel}) — please check your credential level`
            : 'Certificate could not be verified — please upload a clear image of your ICF credential certificate',
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[ICF OCR] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Certificate verification is currently unavailable — please try again or contact support' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
