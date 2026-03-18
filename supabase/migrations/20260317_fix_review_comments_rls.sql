-- Fix M3: review_comments permissive INSERT policy
--
-- 20260121_fix_security_final.sql created "Allow coaches to insert comments" with
-- WITH CHECK (true), allowing any authenticated user to comment on any review.
-- 20260221_create_review_comments_clean.sql created the correct scoped policy
-- "Allow coaches to insert review comments" but the old one may still be active
-- alongside it (different names, both present).
--
-- This migration drops the old permissive policy, leaving only the scoped one.

DROP POLICY IF EXISTS "Allow coaches to insert comments" ON public.review_comments;

-- Confirm the correct scoped policy exists (idempotent re-create if missing)
DROP POLICY IF EXISTS "Allow coaches to insert review comments" ON public.review_comments;
CREATE POLICY "Allow coaches to insert review comments"
  ON public.review_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id::text IN (
      SELECT id::text FROM coaches WHERE user_id = auth.uid()
    )
  );
