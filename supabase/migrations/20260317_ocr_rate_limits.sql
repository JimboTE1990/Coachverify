-- OCR rate limiting table
-- Tracks API calls per IP address to prevent bot abuse of the Claude Vision API.
-- One row per IP, storing the current window start time and call count.
-- The edge function resets the window when it is older than 1 hour.

CREATE TABLE IF NOT EXISTS public.ocr_rate_limits (
  ip_address   text        PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  call_count   integer     NOT NULL DEFAULT 0
);

-- Only the service role (edge functions) should read/write this table.
ALTER TABLE public.ocr_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated/anon — service role bypasses RLS.
-- This prevents any client from reading or manipulating rate limit records directly.

-- Index for fast cleanup of old windows (optional, table stays small)
CREATE INDEX IF NOT EXISTS ocr_rate_limits_window_start_idx
  ON public.ocr_rate_limits (window_start);
