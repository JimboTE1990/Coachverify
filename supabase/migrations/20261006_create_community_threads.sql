-- Community threads — user-posted questions
CREATE TABLE IF NOT EXISTS public.community_threads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  body         text,
  author_name  text NOT NULL,
  author_email text,          -- optional, private — never shown publicly
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tag          text NOT NULL DEFAULT 'Community',
  upvotes      integer NOT NULL DEFAULT 0,
  edited_at    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_threads_created_idx
  ON public.community_threads (created_at DESC);

ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "threads_select" ON public.community_threads;
DROP POLICY IF EXISTS "threads_insert" ON public.community_threads;
DROP POLICY IF EXISTS "threads_update" ON public.community_threads;

-- Anyone can read and post threads (no auth required to ask a question)
CREATE POLICY "threads_select" ON public.community_threads FOR SELECT USING (true);
CREATE POLICY "threads_insert" ON public.community_threads FOR INSERT WITH CHECK (true);

-- Authenticated users can update their own thread (edit body)
CREATE POLICY "threads_update" ON public.community_threads
  FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT ON public.community_threads TO anon, authenticated;
GRANT INSERT ON public.community_threads TO anon, authenticated;
GRANT UPDATE ON public.community_threads TO authenticated;

-- SECURITY DEFINER RPC for anonymous upvoting (same pattern as increment_reply_upvote)
CREATE OR REPLACE FUNCTION public.increment_thread_upvote(thread_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.community_threads SET upvotes = upvotes + 1 WHERE id = thread_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_thread_upvote(uuid) TO anon, authenticated;
