-- Leads from the Coach Business Health Check tool (public/resources/health-check.html).
-- Service-role-only table: written by health-check-lead-intake and read by
-- admin-health-check-leads, both using the service role key. No GRANTs to
-- anon/authenticated - same lesson learned from the event_registrations RLS
-- gap found and closed earlier.

CREATE TABLE public.health_check_leads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name        text,
  email             text        NOT NULL,
  marketing_opt_in  boolean     NOT NULL DEFAULT false,
  archetype         text,
  sticking_point    text,
  stage             text,
  overall           integer,
  areas             jsonb,
  sides             jsonb,
  completed_at      timestamptz,
  source            text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.health_check_leads ENABLE ROW LEVEL SECURITY;
