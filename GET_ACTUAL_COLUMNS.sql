-- Get the actual columns in the coaches table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coaches'
ORDER BY ordinal_position;
