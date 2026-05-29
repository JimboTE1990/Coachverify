-- Product reviews: coaches reviewing CoachDog as a platform/product
--
-- Separate from the coach-client `reviews` table.
-- Displayed on marketing pages (Home, Pricing, CoachInfo) to build trust
-- with prospective coaches.
--
-- Phase 2: source='facebook' rows imported server-side by the
-- sync-facebook-product-reviews edge function.

CREATE TABLE public.product_reviews (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name  TEXT        NOT NULL,
  reviewer_title TEXT,                   -- e.g. "Executive Coach, ICF ACC"
  rating         SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text    TEXT        NOT NULL,
  source         TEXT        NOT NULL DEFAULT 'site' CHECK (source IN ('site', 'facebook')),
  source_url     TEXT,                   -- Facebook review permalink (Phase 2)
  is_approved    BOOLEAN     NOT NULL DEFAULT true,   -- Reviews publish immediately; admin can set false to hide
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Approved reviews are readable by everyone (including anonymous visitors)
CREATE POLICY "Public reads approved product reviews"
  ON public.product_reviews FOR SELECT
  USING (is_approved = true);

-- Logged-in coaches can insert a review for themselves
CREATE POLICY "Coaches insert own product review"
  ON public.product_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Coaches can edit their own site-sourced review only
CREATE POLICY "Coaches manage own site review"
  ON public.product_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id AND source = 'site');

-- Coaches can delete their own site-sourced review only
CREATE POLICY "Coaches delete own site review"
  ON public.product_reviews FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_id AND source = 'site');

-- Block coaches from setting sensitive/admin columns directly.
-- Service role (edge functions, admin calls) bypasses these REVOKEs.
REVOKE INSERT (is_approved, source, source_url)
ON public.product_reviews FROM authenticated;

REVOKE UPDATE (is_approved, source, source_url)
ON public.product_reviews FROM authenticated;

-- Grants for supabase-js client access
GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;

COMMENT ON TABLE public.product_reviews IS
'Reviews of CoachDog as a product, written by coaches (paying customers). '
'Separate from the reviews table which stores client-to-coach reviews. '
'Reviews publish immediately (is_approved defaults true). Admin can set false to hide, or delete entirely.';
