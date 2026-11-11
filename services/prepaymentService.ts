/**
 * Prepayment Service
 * Lets not-yet-accredited partner-school coaches pay the full Lifetime price
 * now and get a one-time code, redeemed later at normal signup via the
 * existing discount-code box on CheckoutLifetime.tsx.
 *
 * Public endpoints - pre-payers aren't logged-in coaches, so no real user
 * session is required. The anon key is still sent as the Authorization
 * bearer token - Supabase's edge function gateway requires a valid JWT on
 * every request regardless of what the function code itself checks, and the
 * anon key is a validly-signed public JWT that satisfies that without
 * needing a real user session. Mirrors eventCheckoutService.ts's pattern.
 */

const getApiUrl = (): string => {
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isDevelopment
    ? 'http://localhost:3001/api'
    : 'https://whhwvuugrzbyvobwfmce.supabase.co/functions/v1';
};

const authHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
});

export interface CreatePrepaymentCheckoutSessionParams {
  email: string;
  discountCode?: string;
  stripePromotionCodeId?: string;
}

export const createPrepaymentCheckoutSession = async (params: CreatePrepaymentCheckoutSessionParams): Promise<void> => {
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}/create-prepayment-checkout-session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const { url } = await response.json();
  if (!url) {
    throw new Error('No checkout URL returned from server');
  }

  window.location.href = url;
};

export interface ConfirmPrepaymentResult {
  promoCode: string;
  amountPaidPence: number;
}

export const confirmPrepayment = async (sessionId: string): Promise<ConfirmPrepaymentResult> => {
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}/confirm-prepayment`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to confirm prepayment');
  }

  return response.json();
};

export const validatePrepaymentCode = async (code: string): Promise<{
  valid: boolean;
  discount?: {
    code: string;
    type: 'fixed';
    value: number;
    enabled: boolean;
    planRestrictions: ('monthly' | 'annual' | 'lifetime')[];
    displayName: string;
    description: string;
    stripePromotionCodeId: string;
  };
}> => {
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}/validate-prepayment-code`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    return { valid: false };
  }

  return response.json();
};

export const confirmRedemption = async (sessionId: string): Promise<void> => {
  const apiUrl = getApiUrl();

  try {
    await fetch(`${apiUrl}/confirm-redemption`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ session_id: sessionId }),
    });
  } catch {
    // Non-critical - don't block the success page on this
  }
};
