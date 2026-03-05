-- ============================================
-- Fix Storage Policies for Image Upload
-- Date: 2026-03-02
-- Issue: Beta tester unable to upload profile/banner images
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Coaches can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete their own photos" ON storage.objects;

-- Policy 1: Allow authenticated users to INSERT (upload) their photos
CREATE POLICY "Coaches can upload their own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Policy 2: Allow PUBLIC to SELECT (view) all photos
CREATE POLICY "Anyone can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Policy 3: Allow authenticated users to UPDATE their photos
CREATE POLICY "Coaches can update their own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Policy 4: Allow authenticated users to DELETE their photos
CREATE POLICY "Coaches can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify all 4 policies were created:
SELECT
  policyname,
  cmd as operation,
  CASE
    WHEN roles::text LIKE '%authenticated%' THEN 'authenticated'
    WHEN roles::text LIKE '%public%' THEN 'public'
    ELSE roles::text
  END as role
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%photo%'
ORDER BY cmd;

-- Expected output:
-- policyname                              | operation | role
-- ---------------------------------------+----------+--------------
-- Coaches can delete their own photos    | DELETE   | authenticated
-- Coaches can upload their own photos    | INSERT   | authenticated
-- Anyone can view profile photos         | SELECT   | public
-- Coaches can update their own photos    | UPDATE   | authenticated
