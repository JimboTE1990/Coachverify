-- Free event ticket claims for paying coaches (active subscription or
-- lifetime). Ties a free claim back to the coach and closes an RLS gap left
-- over from the original free-form-capture era, now that both legitimate
-- write paths (Stripe webhook, free-booking function) use service role.

ALTER TABLE public.event_registrations
  ADD COLUMN coach_id uuid REFERENCES public.coaches(id);

-- One free claim per coach per campaign. coach_id is only ever set on free
-- rows, so this can never collide with Stripe purchases sharing an email.
CREATE UNIQUE INDEX event_registrations_campaign_coach_unique
  ON public.event_registrations (campaign_id, coach_id)
  WHERE coach_id IS NOT NULL;

DROP POLICY IF EXISTS "event_registrations_anon_insert" ON public.event_registrations;
REVOKE INSERT ON public.event_registrations FROM anon, authenticated;
