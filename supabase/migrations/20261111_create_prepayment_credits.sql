-- Lifetime pre-payment credits for not-yet-accredited partner-school coaches.
-- They pay the full Lifetime price now and get a one-time code, redeemed
-- later at normal signup via the existing discount-code box on
-- CheckoutLifetime.tsx. Service-role-only: written by the
-- create/confirm-prepayment flow and read by the redemption lookup, both
-- using the service role key - no anon/authenticated GRANTs, same lesson
-- learned from event_registrations/health_check_leads.

CREATE TABLE public.prepayment_credits (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     text        NOT NULL,
  amount_paid_pence         integer     NOT NULL,
  stripe_session_id         text        UNIQUE,
  stripe_payment_intent_id  text,
  stripe_coupon_id          text,
  stripe_promotion_code_id  text,
  promo_code                text        UNIQUE NOT NULL,
  redeemed                  boolean     NOT NULL DEFAULT false,
  redeemed_at               timestamptz,
  coach_id                  uuid        REFERENCES public.coaches(id),
  created_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prepayment_credits ENABLE ROW LEVEL SECURITY;
