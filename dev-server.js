// Local development server for Stripe API routes
// This allows testing the /api routes without needing Vercel CLI authentication

import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001; // Run on different port than Vite

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
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
    const { priceId, coachId, coachEmail, billingCycle, trialEndsAt } = req.body;

    console.log('[Dev API] Creating checkout session:', { priceId, coachId, coachEmail, billingCycle });

    // Validate required fields
    if (!priceId || !coachId || !coachEmail || !billingCycle) {
      return res.status(400).json({
        error: 'Missing required fields: priceId, coachId, coachEmail, billingCycle'
      });
    }

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

      if (trialEndDate > now) {
        const billingCycleAnchor = Math.floor(trialEndDate.getTime() / 1000);
        sessionParams.subscription_data.billing_cycle_anchor = billingCycleAnchor;
        sessionParams.subscription_data.trial_end = billingCycleAnchor;
      }
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

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Development API server running on http://localhost:${PORT}`);
  console.log(`📍 Stripe API endpoint: http://localhost:${PORT}/api/create-checkout-session`);
  console.log(`🔑 Using Stripe key: ${process.env.STRIPE_SECRET_KEY ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`\nMake sure your frontend is running on: ${process.env.VITE_APP_URL || 'http://localhost:5173'}\n`);
});
