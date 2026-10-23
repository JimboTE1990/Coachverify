-- Add email to community_users so opted-in leads can be surfaced in the admin dashboard
-- without needing to join against auth.users (which requires service role)

ALTER TABLE public.community_users
  ADD COLUMN IF NOT EXISTS email text;
