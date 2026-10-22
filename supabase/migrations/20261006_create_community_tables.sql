-- Community feature tables (POC → production)
-- community_users: profile for non-coach community members
-- community_replies: coach replies on thread slugs

CREATE TABLE IF NOT EXISTS public.community_users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name     text NOT NULL,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_replies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_slug         text NOT NULL,
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name        text NOT NULL,
  body                text NOT NULL,
  is_anonymous        boolean NOT NULL DEFAULT false,
  upvotes             integer NOT NULL DEFAULT 0,
  coach_id            uuid REFERENCES public.coaches(id) ON DELETE SET NULL,
  coach_photo_url     text,
  coach_accreditation text,
  edited_at           timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS community_replies_thread_slug_idx
  ON public.community_replies (thread_slug, created_at);
CREATE INDEX IF NOT EXISTS community_replies_upvotes_idx
  ON public.community_replies (thread_slug, upvotes DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS community_users_user_id_idx
  ON public.community_users (user_id);

-- RLS
ALTER TABLE public.community_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- community_users: read by anyone, write/update own row only
DROP POLICY IF EXISTS "community_users_select" ON public.community_users;
DROP POLICY IF EXISTS "community_users_insert" ON public.community_users;
DROP POLICY IF EXISTS "community_users_update" ON public.community_users;
CREATE POLICY "community_users_select" ON public.community_users FOR SELECT USING (true);
CREATE POLICY "community_users_insert" ON public.community_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_users_update" ON public.community_users FOR UPDATE USING (auth.uid() = user_id);

-- community_replies: read by anyone, insert/update own row only
DROP POLICY IF EXISTS "community_replies_select" ON public.community_replies;
DROP POLICY IF EXISTS "community_replies_insert" ON public.community_replies;
DROP POLICY IF EXISTS "community_replies_update" ON public.community_replies;
CREATE POLICY "community_replies_select" ON public.community_replies FOR SELECT USING (true);
CREATE POLICY "community_replies_insert" ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_replies_update" ON public.community_replies FOR UPDATE USING (auth.uid() = user_id);

-- SECURITY DEFINER function for anonymous upvoting
-- Anon users can't UPDATE rows via RLS; this function increments only the upvotes column.
CREATE OR REPLACE FUNCTION public.increment_reply_upvote(reply_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.community_replies SET upvotes = upvotes + 1 WHERE id = reply_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_reply_upvote(uuid) TO anon, authenticated;

-- Grants
GRANT SELECT ON public.community_users TO anon, authenticated;
GRANT INSERT, UPDATE ON public.community_users TO authenticated;

GRANT SELECT ON public.community_replies TO anon, authenticated;
GRANT INSERT, UPDATE ON public.community_replies TO authenticated;
