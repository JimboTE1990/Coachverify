# Create Demo User for Testing

Since you want to use **sarah@example.com** / **demo123** for testing, here's how to create it:

## Option 1: Use Supabase Dashboard (Easiest)

1. Go to your Supabase project: https://app.supabase.com/project/whhwvuugrzbyvobwfmce
2. Click **Authentication** in the left sidebar
3. Click **Users** tab
4. Click **Add User** (green button)
5. Enter:
   - **Email:** sarah@example.com
   - **Password:** demo123
   - Check **Auto Confirm User**
6. Click **Create User**
7. Copy the **User ID** that appears (you'll need it for step 2)

## Option 2: Create via Sign Up Page

Simply go to http://localhost:3000/coach-signup and create the account through the UI.

## Step 2: Create Coach Profile

After creating the user in Supabase Auth, run this SQL in Supabase SQL Editor:

```sql
-- Replace 'USER_ID_HERE' with the actual UUID from Step 1
INSERT INTO coaches (
  user_id,
  name,
  email,
  phone_number,
  photo_url,
  bio,
  location,
  hourly_rate,
  years_experience,
  is_verified,
  documents_submitted,
  subscription_status,
  billing_cycle,
  two_factor_enabled
) VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID
  'Dr. Sarah Jenkins',
  'sarah@example.com',
  '+1-555-0101',
  'https://picsum.photos/200/200?random=1',
  'Helping corporate leaders find balance and accelerate their career paths.',
  'New York, NY',
  150,
  15,
  true,
  true,
  'active',
  'monthly',
  false
);
```

## Step 3: Add Specialties and Formats

After creating the coach, add their specialties and formats:

```sql
-- Get the coach ID
SELECT id FROM coaches WHERE email = 'sarah@example.com';

-- Get specialty IDs
SELECT id, name FROM specialties;

-- Get format IDs
SELECT id, name FROM formats;

-- Add specialties (replace COACH_ID, CAREER_ID, EXEC_ID with actual UUIDs)
INSERT INTO coach_specialties (coach_id, specialty_id) VALUES
  ('COACH_ID', 'CAREER_ID'),
  ('COACH_ID', 'EXEC_ID');

-- Add formats (replace COACH_ID, ONLINE_ID, INPERSON_ID with actual UUIDs)
INSERT INTO coach_formats (coach_id, format_id) VALUES
  ('COACH_ID', 'ONLINE_ID'),
  ('COACH_ID', 'INPERSON_ID');

-- Add certifications
INSERT INTO certifications (coach_id, name, issuing_organization) VALUES
  ('COACH_ID', 'ICF PCC', 'International Coach Federation'),
  ('COACH_ID', 'MBA', 'Harvard Business School');
```

## Quick Alternative: Use the Full Seed Script

Or just run the complete [supabase-seed-data.sql](supabase-seed-data.sql) file which creates 4 coaches including Sarah. But you'll still need to:

1. Create auth users first via Supabase Dashboard for each coach
2. Note their user IDs
3. Replace `replace-with-user-id-1` etc in the seed file with actual UUIDs
4. Then run the seed script

## After Setup

You should be able to login with:
- **Email:** sarah@example.com
- **Password:** demo123

At: http://localhost:3000/for-coaches
