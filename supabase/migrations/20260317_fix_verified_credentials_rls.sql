-- Fix H3: verified_credentials RLS gap
--
-- The 20260218 migration dropped the original permissive INSERT/UPDATE/DELETE policy
-- and replaced it with policies scoped to coach_id = auth.uid() — but verified_credentials
-- has no coach_id column, so those policies are no-ops and writes may be unprotected.
--
-- Fix: explicitly deny all writes from authenticated and anon roles.
-- Only the service role (edge functions) should ever write to this table.

-- Drop any stale policies that reference the non-existent coach_id column
DROP POLICY IF EXISTS "Coaches can manage own credentials"      ON public.verified_credentials;
DROP POLICY IF EXISTS "Authenticated users can manage credentials" ON public.verified_credentials;
DROP POLICY IF EXISTS "Coach can insert own credentials"        ON public.verified_credentials;
DROP POLICY IF EXISTS "Coach can update own credentials"        ON public.verified_credentials;
DROP POLICY IF EXISTS "Coach can delete own credentials"        ON public.verified_credentials;

-- Explicitly block all writes from non-service-role callers
-- (service role bypasses RLS, so edge functions are unaffected)
CREATE POLICY "Block direct writes to verified_credentials"
  ON public.verified_credentials
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Block direct updates to verified_credentials"
  ON public.verified_credentials
  FOR UPDATE TO authenticated, anon
  USING (false);

CREATE POLICY "Block direct deletes from verified_credentials"
  ON public.verified_credentials
  FOR DELETE TO authenticated, anon
  USING (false);

-- Public read of active credentials is intentional (coaches show badges on their profiles)
-- Ensure the read policy exists
DROP POLICY IF EXISTS "Anyone can read verified credentials" ON public.verified_credentials;
CREATE POLICY "Anyone can read verified credentials"
  ON public.verified_credentials
  FOR SELECT TO public
  USING (is_active = true);
