-- Migration: Security hardening (batch 1)
-- Date: 2026-04-01
-- Fixes from security audit:
--   H4: subscription_overview exposes Stripe IDs to all authenticated users
--   H5: review_token column should never be readable by anon or authenticated roles

-- ── H4: Revoke subscription_overview from authenticated ───────────────────────
-- This view contains stripe_customer_id and stripe_subscription_id.
-- It is an admin-only reporting tool and should not be queryable by coaches.
-- Admin queries should use the service role (SQL Editor) which bypasses RLS.
REVOKE SELECT ON public.subscription_overview FROM authenticated;

-- ── H5: Revoke review_token column from anon ─────────────────────────────────
-- review_token is a write-time ownership secret. Unauthenticated visitors must
-- not be able to harvest all tokens and use them to delete any review.
-- Scoped to anon only: authenticated users still need it for deleteReview().
-- Full remediation (refactor deleteReview to server-side token check) is a
-- follow-up task that removes the authenticated exposure as well.
REVOKE SELECT (review_token) ON public.reviews FROM anon;
