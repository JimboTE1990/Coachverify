-- ============================================
-- Supabase Storage Bucket Policies Setup
-- ============================================
-- Run these commands in Supabase SQL Editor AFTER creating the 'profile-photos' bucket
--
-- IMPORTANT: First create the bucket manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: "profile-photos"
-- 4. Check "Public bucket" ✅
-- 5. Click "Create bucket"
--
-- THEN run this SQL file to set up the security policies
-- ============================================

-- Policy 1: Allow authenticated users to upload their photos
CREATE POLICY "Coaches can upload their own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Policy 2: Allow public read access to all photos
CREATE POLICY "Anyone can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Policy 3: Allow authenticated users to update their photos
CREATE POLICY "Coaches can update their own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Policy 4: Allow authenticated users to delete their photos
CREATE POLICY "Coaches can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the policies were created:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
