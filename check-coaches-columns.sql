-- ============================================
-- Check what columns actually exist in coaches table
-- ============================================
-- Run this to see the actual schema before recreating the view
-- ============================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
ORDER BY ordinal_position;
