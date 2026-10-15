-- Coach Hub tables (POC → production)
-- coach_collab_posts: peer-to-peer collaboration requests between coaches
-- coach_content_submissions: coach-authored articles, videos, resources

CREATE TABLE IF NOT EXISTS public.coach_collab_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
  coach_name  text NOT NULL,
  type        text NOT NULL CHECK (type IN (
                'podcast_guest', 'co_host', 'referral_partner',
                'accountability', 'content_collab', 'other'
              )),
  title       text NOT NULL,
  description text NOT NULL,
  respond_by  date,          -- optional deadline set by the coach
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coach_content_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id         uuid REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
  coach_name       text NOT NULL,
  content_type     text NOT NULL CHECK (content_type IN ('article', 'video', 'resource')),
  title            text NOT NULL,
  body             text,      -- articles
  url              text,      -- videos and resources
  tag              text NOT NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,      -- shown to coach when status = 'rejected'
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Coach collab comments: threaded comments on collab posts, coaches only
CREATE TABLE IF NOT EXISTS public.coach_collab_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid REFERENCES public.coach_collab_posts(id) ON DELETE CASCADE NOT NULL,
  coach_id    uuid REFERENCES public.coaches(id) ON DELETE SET NULL,
  coach_name  text NOT NULL,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS coach_collab_posts_coach_idx ON public.coach_collab_posts (coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS coach_collab_comments_post_idx ON public.coach_collab_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS coach_content_coach_idx ON public.coach_content_submissions (coach_id, created_at DESC);

-- RLS
ALTER TABLE public.coach_collab_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_content_submissions ENABLE ROW LEVEL SECURITY;

-- Collab posts: read by anyone, write/update/delete by own coach only
DROP POLICY IF EXISTS "collab_posts_select" ON public.coach_collab_posts;
DROP POLICY IF EXISTS "collab_posts_insert" ON public.coach_collab_posts;
DROP POLICY IF EXISTS "collab_posts_update" ON public.coach_collab_posts;
DROP POLICY IF EXISTS "collab_posts_delete" ON public.coach_collab_posts;
CREATE POLICY "collab_posts_select" ON public.coach_collab_posts FOR SELECT USING (true);
CREATE POLICY "collab_posts_insert" ON public.coach_collab_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.coaches WHERE id = coach_id AND user_id = auth.uid())
  );
CREATE POLICY "collab_posts_update" ON public.coach_collab_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.coaches WHERE id = coach_id AND user_id = auth.uid())
  );
CREATE POLICY "collab_posts_delete" ON public.coach_collab_posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.coaches WHERE id = coach_id AND user_id = auth.uid())
  );

-- Comments: read by anyone, write by coaches only, delete own only
ALTER TABLE public.coach_collab_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collab_comments_select" ON public.coach_collab_comments;
DROP POLICY IF EXISTS "collab_comments_insert" ON public.coach_collab_comments;
DROP POLICY IF EXISTS "collab_comments_delete" ON public.coach_collab_comments;
CREATE POLICY "collab_comments_select" ON public.coach_collab_comments FOR SELECT USING (true);
CREATE POLICY "collab_comments_insert" ON public.coach_collab_comments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.coaches WHERE id = coach_id AND user_id = auth.uid())
  );
CREATE POLICY "collab_comments_delete" ON public.coach_collab_comments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.coaches WHERE id = coach_id AND user_id = auth.uid())
  );

-- Content submissions: read by anyone, write by authenticated coach only
DROP POLICY IF EXISTS "content_select" ON public.coach_content_submissions;
DROP POLICY IF EXISTS "content_insert" ON public.coach_content_submissions;
DROP POLICY IF EXISTS "content_delete" ON public.coach_content_submissions;
DROP POLICY IF EXISTS "content_update_status" ON public.coach_content_submissions;
CREATE POLICY "content_select" ON public.coach_content_submissions FOR SELECT USING (true);
CREATE POLICY "content_insert" ON public.coach_content_submissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.coaches WHERE id = coach_id AND user_id = auth.uid())
  );
CREATE POLICY "content_delete" ON public.coach_content_submissions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.coaches WHERE id = coach_id AND user_id = auth.uid())
  );

-- Admin can update content submission status (uses service role via Edge Function or admin password flow)
CREATE POLICY "content_update_status" ON public.coach_content_submissions
  FOR UPDATE USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT ON public.coach_collab_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coach_collab_posts TO authenticated;

GRANT SELECT ON public.coach_collab_comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.coach_collab_comments TO authenticated;

GRANT SELECT ON public.coach_content_submissions TO anon, authenticated;
GRANT INSERT, DELETE ON public.coach_content_submissions TO authenticated;
GRANT UPDATE ON public.coach_content_submissions TO authenticated;
