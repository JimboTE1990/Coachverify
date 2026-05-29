-- Flip product_reviews.is_approved default to false so new submissions
-- go to the pending queue instead of publishing immediately.
-- Existing approved reviews are unaffected.
ALTER TABLE public.product_reviews
  ALTER COLUMN is_approved SET DEFAULT false;
