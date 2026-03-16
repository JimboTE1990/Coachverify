-- subscription_overview view
-- Provides a clean summary of all coaches grouped by subscription tier and billing cycle.
-- Includes calculated fee per coach based on their billing cycle.
-- Run in Supabase Dashboard > SQL Editor, or query the view directly from Table Editor.

CREATE OR REPLACE VIEW public.subscription_overview
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.name,
  c.email,
  c.subscription_status                                        AS status,
  c.billing_cycle,
  CASE
    WHEN c.subscription_status = 'trial'    THEN '£0 (trial)'
    WHEN c.billing_cycle = 'monthly'        THEN '£15 / month'
    WHEN c.billing_cycle = 'annual'         THEN '£150 / year'
    WHEN c.billing_cycle = 'lifetime'       THEN '£149 one-off'
    ELSE '—'
  END                                                          AS fee,
  CASE
    WHEN c.billing_cycle = 'monthly'        THEN 15
    WHEN c.billing_cycle = 'annual'         THEN 150
    WHEN c.billing_cycle = 'lifetime'       THEN 149
    ELSE 0
  END                                                          AS fee_gbp,
  c.trial_ends_at,
  c.last_payment_date,
  c.subscription_ends_at,
  c.created_at                                                 AS joined_at,
  c.stripe_customer_id,
  c.stripe_subscription_id
FROM public.coaches c
ORDER BY
  CASE c.subscription_status
    WHEN 'active'      THEN 1
    WHEN 'lifetime'    THEN 2
    WHEN 'trial'       THEN 3
    WHEN 'expired'     THEN 4
    WHEN 'onboarding'  THEN 5
    ELSE 6
  END,
  c.billing_cycle,
  c.name;

-- Grant read access
GRANT SELECT ON public.subscription_overview TO authenticated;

-- Handy summary query — paste into SQL Editor to see totals by tier:
--
-- SELECT
--   status,
--   billing_cycle,
--   fee,
--   COUNT(*)          AS coach_count,
--   SUM(fee_gbp)      AS total_revenue_gbp
-- FROM public.subscription_overview
-- GROUP BY status, billing_cycle, fee
-- ORDER BY 1, 2;
