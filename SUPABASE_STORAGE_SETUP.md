# Supabase Storage Bucket Setup

## Issue
When coaches try to upload profile photos, they get a "Bucket not found" error:
```
StorageApiError: Bucket not found
```

## Root Cause
The Supabase storage bucket `profile-photos` has not been created yet in the Supabase project.

## Solution
You need to create the storage bucket in your Supabase dashboard.

### Step-by-Step Instructions

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your CoachDog project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - You should see the Storage page

3. **Create New Bucket**
   - Click "New Bucket" button
   - **Bucket Name**: `profile-photos`
   - **Public bucket**: ✅ YES (Check this box)
     - This allows public access to profile photos so clients can see coach images
   - Click "Create bucket"

4. **Set Up Row Level Security (RLS) Policies**

   After creating the bucket, click on it and go to "Policies" tab:

   **Policy 1: Allow authenticated users to upload**
   - Click "New Policy"
   - Template: Custom
   - Policy Name: `Coaches can upload their own photos`
   - Policy Definition:
     ```sql
     CREATE POLICY "Coaches can upload their own photos"
     ON storage.objects
     FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'profile-photos');
     ```

   **Policy 2: Allow public read access**
   - Click "New Policy"
   - Template: Custom
   - Policy Name: `Anyone can view profile photos`
   - Policy Definition:
     ```sql
     CREATE POLICY "Anyone can view profile photos"
     ON storage.objects
     FOR SELECT
     TO public
     USING (bucket_id = 'profile-photos');
     ```

   **Policy 3: Allow coaches to update/delete their own photos**
   - Click "New Policy"
   - Template: Custom
   - Policy Name: `Coaches can update their own photos`
   - Policy Definition:
     ```sql
     CREATE POLICY "Coaches can update their own photos"
     ON storage.objects
     FOR UPDATE
     TO authenticated
     USING (bucket_id = 'profile-photos');

     CREATE POLICY "Coaches can delete their own photos"
     ON storage.objects
     FOR DELETE
     TO authenticated
     USING (bucket_id = 'profile-photos');
     ```

5. **Verify Setup**
   - Go back to Storage → profile-photos
   - You should see the bucket is marked as "Public"
   - The policies should be listed under the Policies tab

## How It Works

Once the bucket is created:

1. Coach uploads photo from dashboard
2. Image is uploaded to `profile-photos/coach-profiles/{coachId}-{timestamp}.{ext}`
3. Supabase generates a public URL
4. URL is saved in the coach's profile
5. Image is displayed on coach profile pages

## Current Code Status

The `ImageUpload.tsx` component currently uses **base64 encoding** as a temporary fallback because the bucket doesn't exist yet. Once you create the bucket, the base64 URLs will be replaced with proper Supabase storage URLs on the next upload.

## Testing

After setting up the bucket:

1. Log in as a coach
2. Go to Dashboard → Public Profile
3. Click "Upload Photo"
4. Select an image (JPG, PNG, or WebP, max 5MB)
5. Photo should upload successfully without "Bucket not found" error
6. Photo should display immediately

## Troubleshooting

If you still get errors after creating the bucket:

1. **Check bucket name is exactly**: `profile-photos` (with hyphen, not underscore)
2. **Verify bucket is public**: Check the "Public" checkbox when creating
3. **Check RLS policies**: Make sure policies are enabled and correctly configured
4. **Check Supabase API keys**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in your environment variables
5. **Rebuild the app**: Run `npm run build` and redeploy

## Related Files

- `components/ImageUpload.tsx` - Image upload component
- `services/supabaseService.ts` - Supabase client configuration
