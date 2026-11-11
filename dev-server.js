// Local development server for Stripe API routes
// This allows testing the /api routes without needing Vercel CLI authentication

import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001; // Run on different port than Vite

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Sends a transactional email via Brevo's API. Best-effort - callers should
// not let a failure here block the response, since the underlying action
// (e.g. issuing a prepayment code) has already succeeded regardless.
const sendBrevoEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Dev API] BREVO_API_KEY not set - skipping email send');
    return;
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'CoachDog',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${body}`);
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dev server running' });
});

// Create Stripe Checkout Session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, coachId, coachEmail, billingCycle, trialEndsAt, stripePromotionCodeId, prepaymentCode } = req.body;

    console.log('[Dev API] Creating checkout session:', { priceId, coachId, coachEmail, billingCycle, hasPromoCode: !!stripePromotionCodeId });

    // Validate required fields
    if (!priceId || !coachId || !coachEmail || !billingCycle) {
      return res.status(400).json({
        error: 'Missing required fields: priceId, coachId, coachEmail, billingCycle'
      });
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    // Determine mode based on billing cycle
    const isLifetime = billingCycle === 'lifetime';
    const mode = isLifetime ? 'payment' : 'subscription';

    // Prepare checkout session parameters
    const sessionParams = {
      mode: mode,
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
      metadata: {
        coachId: coachId,
        billingCycle: billingCycle,
        ...(prepaymentCode ? { prepaymentCode } : {}),
      },
    };

    // Only add subscription_data for recurring subscriptions (not lifetime)
    if (!isLifetime) {
      sessionParams.subscription_data = {
        metadata: {
          coachId: coachId,
          billingCycle: billingCycle,
          trialEndsAt: trialEndsAt || 'none',
        },
      };
    }

    // If user has an active trial, set subscription to start at trial end
    // Only applicable for recurring subscriptions (not lifetime)
    if (trialEndsAt && !isLifetime) {
      const trialEndDate = new Date(trialEndsAt);
      const now = new Date();

      if (trialEndDate > now) {
        const trialEndTimestamp = Math.floor(trialEndDate.getTime() / 1000);
        // Use trial_end (not billing_cycle_anchor) to continue existing trial
        sessionParams.subscription_data.trial_end = trialEndTimestamp;
        console.log('[Dev API] Trial continues until:', trialEndDate.toISOString());
      }
    }

    // Apply Stripe promotion code if provided
    if (stripePromotionCodeId) {
      sessionParams.discounts = [
        {
          promotion_code: stripePromotionCodeId,
        },
      ];
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('[Dev API] Checkout session created:', session.id);

    // Return the session URL to frontend
    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[Dev API] Error creating checkout session:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
});

// Create Stripe Checkout Session for a one-off event ticket (no login, no form)
app.post('/api/create-event-checkout-session', async (req, res) => {
  try {
    const { campaignId, source } = req.body;

    console.log('[Dev API] Creating event ticket checkout session:', { campaignId, source });

    if (!campaignId) {
      return res.status(400).json({ error: 'Missing required field: campaignId' });
    }

    const priceId = process.env.EVENT_TICKET_PRICE_ID;
    if (!priceId) {
      throw new Error('EVENT_TICKET_PRICE_ID environment variable is not set');
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/events/strategy-not-resolutions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/events/strategy-not-resolutions`,
      metadata: {
        purchaseType: 'event_ticket',
        campaignId,
        source: source || 'unknown',
      },
    });

    console.log('[Dev API] Event ticket checkout session created:', session.id);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[Dev API] Error creating event ticket checkout session:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
});

// Claim a free event ticket - logged-in coaches with an active or lifetime
// subscription only. Eligibility is re-checked against the database here,
// never trusted from the client, same posture as the production function.
app.post('/api/create-event-free-booking', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error('Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY)');
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // coaches.id is its own PK, distinct from the auth user id - look up by
    // user_id and use the returned id for the event_registrations FK below.
    const { data: coachRow, error: coachError } = await userClient
      .from('coaches')
      .select('id, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (coachError || !coachRow || !['active', 'lifetime'].includes(coachRow.subscription_status)) {
      return res.status(403).json({ error: 'Not eligible for a free ticket' });
    }

    const { campaignId, source } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: 'Missing required field: campaignId' });
    }

    console.log('[Dev API] Granting free event ticket:', { coachId: coachRow.id, campaignId, source });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: insertError } = await adminClient.from('event_registrations').insert({
      campaign_id: campaignId,
      email: user.email,
      source: source || 'unknown',
      status: 'free',
      coach_id: coachRow.id,
      amount_paid_pence: 0,
      stripe_session_id: null,
      paid_at: new Date().toISOString(),
    });

    // 23505 = unique violation - already claimed this campaign, treat as success
    if (insertError && insertError.code !== '23505') {
      throw insertError;
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('[Dev API] Error granting free event ticket:', error);
    return res.status(500).json({
      error: error.message || 'Failed to claim free ticket',
    });
  }
});

// Create a Stripe Checkout Session for a lifetime pre-payment (no login,
// not yet accredited - the coach doesn't have a CoachDog account yet).
app.post('/api/create-prepayment-checkout-session', async (req, res) => {
  try {
    const { email, discountCode, stripePromotionCodeId } = req.body;

    console.log('[Dev API] Creating prepayment checkout session:', { email, discountCode });

    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    const priceId = process.env.VITE_STRIPE_LIFETIME_PRICE_ID;
    if (!priceId) {
      throw new Error('VITE_STRIPE_LIFETIME_PRICE_ID environment variable is not set');
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    const sessionParams = {
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/partner-prepay?session_id={CHECKOUT_SESSION_ID}&paid=1`,
      cancel_url: `${appUrl}/partner-prepay`,
      customer_email: email,
      metadata: {
        purchaseType: 'lifetime_prepayment',
        email,
      },
    };

    if (stripePromotionCodeId) {
      sessionParams.discounts = [{ promotion_code: stripePromotionCodeId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('[Dev API] Prepayment checkout session created:', session.id);

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('[Dev API] Error creating prepayment checkout session:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
});

// Confirm a lifetime pre-payment succeeded, then issue a one-time redeemable
// code. Retrieves the session from Stripe directly rather than relying on a
// webhook, since webhooks can't reach localhost - safe to call more than
// once (idempotent on stripe_session_id).
app.post('/api/confirm-prepayment', async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'Missing required field: session_id' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase env vars (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Already processed? Return the existing code instead of creating another.
    const { data: existing } = await adminClient
      .from('prepayment_credits')
      .select('promo_code, amount_paid_pence')
      .eq('stripe_session_id', session_id)
      .maybeSingle();
    if (existing) {
      return res.status(200).json({ promoCode: existing.promo_code, amountPaidPence: existing.amount_paid_pence });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid' || session.metadata?.purchaseType !== 'lifetime_prepayment') {
      return res.status(400).json({ error: 'Session is not a paid lifetime pre-payment' });
    }

    const amountPaidPence = session.amount_total;
    const email = session.metadata.email || session.customer_details?.email;

    const promoCode = 'PREPAID-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once',
      max_redemptions: 1,
      name: `Pre-payment credit - ${promoCode}`,
    });
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: promoCode,
      max_redemptions: 1,
    });

    console.log('[Dev API] Prepayment confirmed, code issued:', { email, promoCode });

    const { error: insertError } = await adminClient.from('prepayment_credits').insert({
      email,
      amount_paid_pence: amountPaidPence,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promotionCode.id,
      promo_code: promoCode,
    });
    if (insertError) {
      // A concurrent request for the same session_id (e.g. two tabs, a
      // retried request) already won the insert - defer to its code instead
      // of erroring. The coupon/promotion code created above just goes unused.
      if (insertError.code === '23505') {
        const { data: winner } = await adminClient
          .from('prepayment_credits')
          .select('promo_code, amount_paid_pence')
          .eq('stripe_session_id', session.id)
          .maybeSingle();
        if (winner) {
          return res.status(200).json({ promoCode: winner.promo_code, amountPaidPence: winner.amount_paid_pence });
        }
      }
      throw insertError;
    }

    try {
      await sendBrevoEmail({
        to: email,
        subject: 'Your CoachDog pre-payment code',
        html: `
          <p>Thanks for pre-paying for your CoachDog Lifetime membership.</p>
          <p>You paid <strong>£${(amountPaidPence / 100).toFixed(2)}</strong>. Save the code below -
          you'll enter it at checkout once you're accredited and sign up, and it will cover
          your Lifetime membership in full.</p>
          <p style="font-size:20px;font-weight:bold;letter-spacing:1px;">${promoCode}</p>
          <p>When you're ready, sign up as normal and enter this code in the
          "Have a discount code?" box at checkout.</p>
        `,
      });
    } catch (emailError) {
      // Non-critical - the code is already generated, stored, and shown on
      // screen regardless of whether the email goes out.
      console.error('[Dev API] Failed to send prepayment confirmation email:', emailError.message);
    }

    return res.status(200).json({ promoCode, amountPaidPence });

  } catch (error) {
    console.error('[Dev API] Error confirming prepayment:', error);
    return res.status(500).json({
      error: error.message || 'Failed to confirm prepayment',
    });
  }
});

// Check whether a typed code is an unredeemed prepayment credit - returns a
// DiscountCode-shaped payload so it drops into the checkout page's existing
// discount logic unchanged.
app.post('/api/validate-prepayment-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data } = await adminClient
      .from('prepayment_credits')
      .select('amount_paid_pence, stripe_promotion_code_id')
      .eq('promo_code', code.toUpperCase().trim())
      .eq('redeemed', false)
      .maybeSingle();

    if (!data) {
      return res.status(200).json({ valid: false });
    }

    // The underlying Stripe coupon is always percent_off:100 (see
    // /api/confirm-prepayment) - once pre-paid, redemption is always free,
    // regardless of what was actually paid upfront (e.g. a discount code
    // applied at pre-pay time). Must match that here or the displayed total
    // is wrong even though the real Stripe charge would still be £0.
    return res.status(200).json({
      valid: true,
      discount: {
        code: code.toUpperCase().trim(),
        type: 'percentage',
        value: 100,
        enabled: true,
        planRestrictions: ['lifetime'],
        displayName: 'Pre-payment credit',
        description: `Already paid £${(data.amount_paid_pence / 100).toFixed(2)} - fully covered`,
        stripePromotionCodeId: data.stripe_promotion_code_id,
      },
    });

  } catch (error) {
    console.error('[Dev API] Error validating prepayment code:', error);
    return res.status(500).json({ valid: false, error: error.message });
  }
});

// Mark a prepayment credit redeemed once the real signup checkout that used
// it has actually completed. Harmless no-op for every normal (non-prepayment)
// lifetime purchase, since metadata.prepaymentCode just won't be set.
app.post('/api/confirm-redemption', async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'Missing required field: session_id' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const prepaymentCode = session.metadata?.prepaymentCode;
    if (!prepaymentCode) {
      return res.status(200).json({ ok: true, redeemed: false });
    }
    if (session.payment_status !== 'paid') {
      return res.status(200).json({ ok: true, redeemed: false });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await adminClient
      .from('prepayment_credits')
      .update({
        redeemed: true,
        redeemed_at: new Date().toISOString(),
        coach_id: session.metadata?.coachId || null,
      })
      .eq('promo_code', prepaymentCode);

    if (error) throw error;

    console.log('[Dev API] Prepayment credit redeemed:', { prepaymentCode, coachId: session.metadata?.coachId });

    return res.status(200).json({ ok: true, redeemed: true });

  } catch (error) {
    console.error('[Dev API] Error confirming redemption:', error);
    return res.status(500).json({ error: error.message || 'Failed to confirm redemption' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Development API server running on http://localhost:${PORT}`);
  console.log(`📍 Stripe API endpoint: http://localhost:${PORT}/api/create-checkout-session`);
  console.log(`🔑 Using Stripe key: ${process.env.STRIPE_SECRET_KEY ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`\nMake sure your frontend is running on: ${process.env.VITE_APP_URL || 'http://localhost:5173'}\n`);
});
