-- Add Stripe payment tracking to event_registrations now that event tickets
-- are purchased via Stripe Checkout rather than a free name/email form.

ALTER TABLE public.event_registrations ALTER COLUMN name DROP NOT NULL;

ALTER TABLE public.event_registrations
  ADD COLUMN status text NOT NULL DEFAULT 'paid',
  ADD COLUMN stripe_session_id text,
  ADD COLUMN stripe_payment_intent_id text,
  ADD COLUMN amount_paid_pence integer,
  ADD COLUMN paid_at timestamptz;

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_stripe_session_id_key UNIQUE (stripe_session_id);
