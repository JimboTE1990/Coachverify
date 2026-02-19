-- Force Supabase PostgREST to reload schema cache
-- Run this if you get "Could not find column in schema cache" errors

NOTIFY pgrst, 'reload schema';

-- This signals PostgREST to immediately reload the database schema
-- instead of waiting for the automatic refresh (which can take a few minutes)
