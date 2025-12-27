/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 * Endpoint: POST /api/create-checkout-session
 *
 * This function creates a Stripe Checkout Session for subscription payments.
 * It runs on Vercel's serverless infrastructure and keeps your Stripe secret key secure.
 *
 * Updated: 2024-12-27 - Added comprehensive environment variable validation
 * Rebuild: Force new deployment to pick up STRIPE_SECRET_KEY
 */

// Vercel serverless functions work best with dynamic imports for packages
// We'll initialize Stripe lazily on first request
let stripe = null;

async function getStripe() {
  if (!stripe) {
    // Debug: Log environment variable state
    const secretKey = process.env.STRIPE_SECRET_KEY;
    console.log('[Stripe API] Environment check:', {
      hasSecretKey: !!secretKey,
      keyPrefix: secretKey ? secretKey.substring(0, 7) + '...' : 'undefined',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('STRIPE'))
    });

    // Validate secret key exists
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set. Please configure it in Vercel dashboard.');
    }

    // Validate secret key format
    if (!secretKey.startsWith('sk_')) {
      throw new Error('Invalid STRIPE_SECRET_KEY format. Key should start with "sk_test_" or "sk_live_".');
    }

    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    console.log('[Stripe API] Stripe client initialized successfully');
  }
  return stripe;
}

export default async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin || process.env.VITE_APP_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, coachId, coachEmail, billingCycle, trialEndsAt } = req.body;

    // Validate required fields
    if (!priceId || !coachId || !coachEmail || !billingCycle) {
      return res.status(400).json({
        error: 'Missing required fields: priceId, coachId, coachEmail, billingCycle'
      });
    }

    console.log('[Stripe API] Creating checkout session:', {
      priceId,
      coachId,
      billingCycle,
      hasTrialEndsAt: !!trialEndsAt
    });

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    // Prepare checkout session parameters
    const sessionParams = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/${billingCycle}`,
      client_reference_id: coachId,
      customer_email: coachEmail,
      subscription_data: {
        metadata: {
          coachId: coachId,
          billingCycle: billingCycle,
          trialEndsAt: trialEndsAt || 'none',
        },
      },
      metadata: {
        coachId: coachId,
        billingCycle: billingCycle,
      },
    };

    // If user has an active trial, set subscription to start at trial end
    if (trialEndsAt) {
      const trialEndDate = new Date(trialEndsAt);
      const now = new Date();

      // Only set billing cycle anchor if trial hasn't ended yet
      if (trialEndDate > now) {
        // Convert to Unix timestamp (Stripe expects seconds)
        const billingCycleAnchor = Math.floor(trialEndDate.getTime() / 1000);

        sessionParams.subscription_data.billing_cycle_anchor = billingCycleAnchor;
        sessionParams.subscription_data.trial_end = billingCycleAnchor;

        console.log('[Stripe API] Trial ends at:', trialEndDate.toISOString());
        console.log('[Stripe API] Billing will start on:', trialEndDate.toDateString());
      }
    }

    // Create Stripe Checkout Session
    const stripeClient = await getStripe();
    const session = await stripeClient.checkout.sessions.create(sessionParams);

    console.log('[Stripe API] Checkout session created:', session.id);

    // Return the session URL to frontend
    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[Stripe API] Error creating checkout session:', error);

    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
}
