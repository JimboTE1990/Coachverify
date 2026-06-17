-- TKI Questionnaire Results
-- Stores each completed TKI self-assessment so coaches can compare results over time.
-- Coaches can save, view, and delete their own records only.

CREATE TABLE public.tki_results (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      UUID        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  answers       JSONB       NOT NULL,       -- { "1": "A", "2": "B", ... }
  scores        JSONB       NOT NULL,       -- { "Competing": 3, "Avoiding": 2, ... }
  dominant_mode TEXT        NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tki_results_coach_id ON public.tki_results(coach_id);

ALTER TABLE public.tki_results ENABLE ROW LEVEL SECURITY;

-- Coaches can read their own results
CREATE POLICY "tki_results_select_own"
  ON public.tki_results FOR SELECT TO authenticated
  USING (coach_id IN (SELECT id FROM coaches WHERE auth.uid() = user_id));

-- Coaches can save their own results
CREATE POLICY "tki_results_insert_own"
  ON public.tki_results FOR INSERT TO authenticated
  WITH CHECK (coach_id IN (SELECT id FROM coaches WHERE auth.uid() = user_id));

-- Coaches can delete their own results
CREATE POLICY "tki_results_delete_own"
  ON public.tki_results FOR DELETE TO authenticated
  USING (coach_id IN (SELECT id FROM coaches WHERE auth.uid() = user_id));

GRANT SELECT, INSERT, DELETE ON public.tki_results TO authenticated;
