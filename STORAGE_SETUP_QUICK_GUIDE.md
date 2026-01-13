# Quick Guide: Fix "Bucket not found" Error

## The Problem
Coaches can't upload profile photos - getting error: `Bucket not found`

## The Solution (2 Steps)

### Step 1: Create the Storage Bucket (Use Web UI - NOT SQL)

1. Go to https://supabase.com/dashboard
2. Select your CoachDog project
3. Click **Storage** in the left sidebar
4. Click **"New Bucket"** button
5. Fill in:
   - **Name**: `profile-photos`
   - **Public bucket**: ✅ **CHECK THIS BOX** (important!)
6. Click **"Create bucket"**

### Step 2: Add Security Policies (Use SQL Editor)

1. In Supabase Dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Copy and paste the contents of `supabase-storage-policies.sql`
4. Click **"Run"**

**OR** manually create policies through the UI:
1. Go to Storage → profile-photos → Policies tab
2. Click "New Policy" for each policy in the SQL file

---

## That's it!

After completing these 2 steps:
- Coaches will be able to upload profile photos
- Photos will be stored in Supabase Storage (not as base64 in database)
- Photos will be publicly accessible via URL

## Test It

1. Log in as a coach
2. Go to Dashboard → Public Profile
3. Click "Upload Photo"
4. Select an image
5. Should work without errors!
