-- Query to check what columns actually exist in coaches table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'coaches'
ORDER BY ordinal_position;

-- Also check review_comments table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'review_comments'
ORDER BY ordinal_position;
