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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dev server running' });
});

// Create Stripe Checkout Session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, coachId, coachEmail, billingCycle, trialEndsAt, stripePromotionCodeId } = req.body;

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

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Development API server running on http://localhost:${PORT}`);
  console.log(`📍 Stripe API endpoint: http://localhost:${PORT}/api/create-checkout-session`);
  console.log(`🔑 Using Stripe key: ${process.env.STRIPE_SECRET_KEY ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`\nMake sure your frontend is running on: ${process.env.VITE_APP_URL || 'http://localhost:5173'}\n`);
});
