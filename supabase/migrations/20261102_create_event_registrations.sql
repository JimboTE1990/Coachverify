-- Event registrations table for campaign email capture
-- Supports multiple campaigns via campaign_id field.
-- Anon visitors can insert (public form); authenticated users can read (admin).

CREATE TABLE public.event_registrations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  text        NOT NULL,
  name         text        NOT NULL,
  email        text        NOT NULL,
  source       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_registrations_anon_insert"
  ON public.event_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "event_registrations_auth_select"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (true);

GRANT INSERT ON public.event_registrations TO anon, authenticated;
GRANT SELECT ON public.event_registrations TO authenticated;
