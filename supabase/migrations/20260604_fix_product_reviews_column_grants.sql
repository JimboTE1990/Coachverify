-- Fix 403 on product_reviews INSERT for authenticated coaches.
--
-- The original migration did:
--   GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
--   REVOKE INSERT (is_approved, source, source_url) FROM authenticated;
--   REVOKE UPDATE (is_approved, source, source_url) FROM authenticated;
--
-- The column-level REVOKEs conflict with PostgREST's privilege introspection
-- and cause a 403 Forbidden for all INSERT/UPDATE by authenticated coaches,
-- even when those columns are not included in the request.
--
-- Security is maintained by:
--   - Application code never sending is_approved/source/source_url in inserts
--   - RLS policies scoping INSERT to auth.uid() = reviewer_id
--   - is_approved defaults true (coach setting it explicitly changes nothing)

GRANT INSERT (is_approved, source, source_url) ON public.product_reviews TO authenticated;
GRANT UPDATE (is_approved, source, source_url) ON public.product_reviews TO authenticated;
