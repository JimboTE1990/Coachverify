-- Persistent bookmarks for authenticated coaches on Community Q&A threads.
-- Non-coach users continue to use localStorage (no DB entry needed).

CREATE TABLE IF NOT EXISTS public.community_bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_slug text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, thread_slug)
);

CREATE INDEX IF NOT EXISTS community_bookmarks_user_idx
  ON public.community_bookmarks (user_id);

ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select" ON public.community_bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert" ON public.community_bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete" ON public.community_bookmarks;

CREATE POLICY "bookmarks_select" ON public.community_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert" ON public.community_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete" ON public.community_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.community_bookmarks TO authenticated;
