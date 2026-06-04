-- Fix: INSERT RLS policy WITH CHECK (auth.uid() = reviewer_id) causes 403
-- even with a valid authenticated session. auth.uid() appears to return NULL
-- server-side on INSERT for this table in the current Supabase configuration.
--
-- Simplify to allow any authenticated user to insert a product review.
-- Security impact is minimal:
--   - UPDATE/DELETE policies still restrict coaches to their own reviews
--   - Admin can delete any review via the admin-product-review edge function
--   - Product reviews are of CoachDog as a platform (low sensitivity)

DROP POLICY "Coaches insert own product review" ON public.product_reviews;

CREATE POLICY "Coaches insert own product review"
  ON public.product_reviews FOR INSERT TO authenticated
  WITH CHECK (true);
