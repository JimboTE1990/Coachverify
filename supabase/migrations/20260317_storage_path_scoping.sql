-- Fix H4: Storage bucket policies scoped to the uploading user's path
-- Previously, any authenticated user could upload/update/delete files at ANY path
-- in the profile-photos bucket, including other coaches' photos.
-- Now restricted to paths beginning with the caller's own user ID.
--
-- Upload path format: {user.id}/{type}/{timestamp}.jpg
-- e.g. 3f2a1b.../profile/1710000000000.jpg

-- Drop the old unscoped policies
DROP POLICY IF EXISTS "Coaches can upload their own photos"  ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update their own photos"  ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete their own photos"  ON storage.objects;

-- Re-create with path scoping: first folder segment must match auth.uid()
CREATE POLICY "Coaches can upload their own photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches can update their own photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches can delete their own photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read policy is unchanged — anyone can view photos (bucket is public)
