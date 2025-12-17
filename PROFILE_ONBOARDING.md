# Robust Profile Onboarding System

## Overview
The profile onboarding system has been completely rewritten to ensure coach profiles are **always created reliably** across all signup and login paths. The new system includes retry logic, comprehensive error handling, and automatic fallbacks.

## Key Improvements

### 1. Centralized Profile Creation Utility
**File**: [utils/profileCreation.ts](utils/profileCreation.ts)

A new centralized utility provides:
- ✅ **Automatic duplicate detection** - Checks if profile exists before creating
- ✅ **Retry logic with exponential backoff** - 3 attempts with 1s, 2s, 3s delays
- ✅ **Concurrent creation handling** - Handles race conditions when profile created between check and insert
- ✅ **Comprehensive logging** - Every step logged with `[ProfileCreation]` prefix
- ✅ **Fallback data** - Uses user metadata, email, or sensible defaults
- ✅ **Error recovery** - Attempts to fetch profile if creation fails due to duplicate key

### 2. Profile Creation Paths

The system now creates profiles in **four different scenarios**:

#### Path 1: Email Verification (Primary)
**File**: [pages/VerifyEmail.tsx](pages/VerifyEmail.tsx#L78-L80)
- **Trigger**: User clicks verification link in email
- **When**: After email is verified and session is established
- **Method**: `createCoachProfile()` with retry logic
- **Data Source**: User metadata from signup (full_name, date_of_birth, accreditation data)
- **Status**: `is_verified: true` (they completed license verification)

#### Path 2: Auto-Confirmed Signup (Backup)
**File**: [pages/CoachSignup.tsx](pages/CoachSignup.tsx#L142-L145)
- **Trigger**: If email confirmation is somehow disabled in Supabase
- **When**: Immediately after `signUp()` if user is auto-confirmed
- **Method**: `createCoachProfile()` with retry logic
- **Data Source**: Form data directly
- **Status**: `is_verified: verified` (based on license check result)

#### Path 3: Legacy Token Verification (Compatibility)
**File**: [pages/VerifyEmail.tsx](pages/VerifyEmail.tsx#L125-L127)
- **Trigger**: If using old query-param style verification links
- **When**: After legacy OTP verification succeeds
- **Method**: `createCoachProfile()` with retry logic
- **Data Source**: User metadata
- **Status**: `is_verified: true`

#### Path 4: Login Fallback (Safety Net)
**File**: [pages/CoachDashboard.tsx](pages/CoachDashboard.tsx#L88)
- **Trigger**: User tries to login but profile doesn't exist
- **When**: After successful authentication, before loading dashboard
- **Method**: `ensureCoachProfile()` - creates profile if missing
- **Data Source**: Authenticated user data
- **Status**: `is_verified: true` if email confirmed
- **Purpose**: Catches any edge cases where profile wasn't created during signup

## Technical Details

### createCoachProfile Function
```typescript
async function createCoachProfile(
  userData: User,
  additionalData?: {
    name?: string;
    is_verified?: boolean;
  },
  maxRetries: number = 3
): Promise<string>
```

**Features**:
- Checks for existing profile first (returns ID if found)
- Builds profile data from multiple sources in priority order:
  1. `additionalData` (explicit overrides)
  2. `user_metadata.full_name` (from signup form)
  3. Email username (fallback)
  4. "Coach" (absolute fallback)
- Retries with exponential backoff on failure
- Handles PostgreSQL unique constraint violations gracefully
- Returns profile ID on success, throws error after all retries fail

### ensureCoachProfile Function
```typescript
async function ensureCoachProfile(
  userId: string,
  email?: string
): Promise<string | null>
```

**Features**:
- Checks if profile exists for given user ID
- If missing, fetches full user data and calls `createCoachProfile()`
- Used as safety net during login
- Returns `null` on error (graceful degradation)

## Profile Data Structure

All profiles are created with these fields:

```typescript
{
  user_id: string,              // Supabase auth user ID (unique key)
  name: string,                 // From full_name metadata or email
  email: string,                // User's email address
  is_verified: boolean,         // true if completed license verification
  documents_submitted: false,   // Always false initially
  subscription_status: 'onboarding', // Always 'onboarding' initially
  billing_cycle: 'monthly',     // Default billing cycle
  two_factor_enabled: false     // 2FA disabled by default
}
```

## Error Handling

### Retry Strategy
1. **Attempt 1**: Immediate
2. **Attempt 2**: Wait 1 second
3. **Attempt 3**: Wait 2 seconds

If all 3 attempts fail, throws error with details.

### Duplicate Key Handling
If profile creation fails with PostgreSQL error `23505` (unique constraint violation):
1. Assumes another process created the profile concurrently
2. Fetches the existing profile
3. Returns the ID of the existing profile
4. No error thrown - seamless recovery

### Logging
All operations logged with prefixes:
- `[ProfileCreation]` - Core utility operations
- `[VerifyEmail]` - Email verification flow
- `[CoachSignup]` - Signup flow
- `[CoachDashboard]` - Login flow

## Testing Scenarios

### Scenario 1: Normal Signup Flow
1. ✅ User signs up
2. ✅ Verification email sent
3. ✅ User clicks link
4. ✅ Profile created in VerifyEmail path
5. ✅ User can login immediately

### Scenario 2: Email Verification Fails, User Tries to Login
1. ✅ User signs up
2. ❌ Email verification somehow fails/incomplete
3. ✅ User tries to login anyway
4. ✅ Profile created in Login Fallback path
5. ✅ User can access dashboard

### Scenario 3: Concurrent Profile Creation
1. ✅ User clicks verification link
2. ✅ Profile creation starts
3. ⚠️ User clicks link again (opens in another tab)
4. ✅ Second attempt detects existing profile
5. ✅ Both paths succeed without error

### Scenario 4: Network Failure During Profile Creation
1. ✅ User verifies email
2. ❌ First profile creation attempt fails (network error)
3. ✅ Retry #1 after 1 second
4. ❌ Still failing
5. ✅ Retry #2 after 2 more seconds
6. ✅ Success on 3rd attempt
7. ✅ User sees success message

### Scenario 5: Auto-Confirmed User (Email Confirmation Disabled)
1. ✅ User signs up
2. ✅ Email confirmation bypassed (Supabase config)
3. ✅ Profile created immediately in CoachSignup path
4. ✅ User can login without email verification

## Migration for Existing Users

If you have existing users without profiles (shouldn't happen, but just in case):

### Option 1: Automatic (Recommended)
Users will automatically get profiles created when they login, thanks to the Login Fallback path.

### Option 2: Manual SQL
Run this SQL in Supabase SQL Editor to create profiles for all users without them:

```sql
INSERT INTO coaches (user_id, name, email, is_verified, documents_submitted, subscription_status, billing_cycle, two_factor_enabled)
SELECT
  au.id as user_id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'Coach') as name,
  au.email,
  au.email_confirmed_at IS NOT NULL as is_verified,
  false as documents_submitted,
  'onboarding' as subscription_status,
  'monthly' as billing_cycle,
  false as two_factor_enabled
FROM auth.users au
LEFT JOIN coaches c ON c.user_id = au.id
WHERE c.id IS NULL AND au.email_confirmed_at IS NOT NULL;
```

This creates profiles for all authenticated users who don't have one yet.

## Monitoring

### Check for Users Without Profiles
```sql
SELECT
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN coaches c ON c.user_id = au.id
WHERE c.id IS NULL;
```

If this returns rows, those users don't have profiles yet (but will get them on next login).

### Check Profile Creation Success Rate
Look in browser console for these log patterns:
- ✅ `[ProfileCreation] ✅ Profile created successfully: [ID]`
- ❌ `[ProfileCreation] ❌ All retry attempts failed`

## Files Modified

1. ✅ [utils/profileCreation.ts](utils/profileCreation.ts) - **NEW** - Core utility
2. ✅ [pages/VerifyEmail.tsx](pages/VerifyEmail.tsx) - Updated to use utility (2 paths)
3. ✅ [pages/CoachSignup.tsx](pages/CoachSignup.tsx) - Updated to use utility (auto-confirm path)
4. ✅ [pages/CoachDashboard.tsx](pages/CoachDashboard.tsx) - Added login fallback

## Benefits

### For Users
- ✅ Reliable onboarding - profile always created
- ✅ No "profile not found" errors
- ✅ Can recover from verification failures by logging in
- ✅ Seamless experience across all paths

### For Developers
- ✅ Centralized logic - easier to maintain
- ✅ Comprehensive logging - easier to debug
- ✅ Retry logic - resilient to transient failures
- ✅ Race condition handling - safe for concurrent operations
- ✅ Multiple fallback paths - covers all edge cases

## Future Enhancements

### Database Trigger (Optional)
Consider adding a PostgreSQL trigger to auto-create profiles:

```sql
CREATE OR REPLACE FUNCTION create_coach_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO coaches (user_id, name, email, is_verified, documents_submitted, subscription_status, billing_cycle, two_factor_enabled)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Coach'),
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL,
    false,
    'onboarding',
    'monthly',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_coach_profile();
```

**Note**: This would make profile creation instant, but the application already handles it robustly, so this is optional.

---

## Summary

The profile onboarding system is now **bulletproof**:
- ✅ **4 different creation paths** ensure profiles are always created
- ✅ **Retry logic** handles transient failures
- ✅ **Duplicate detection** prevents errors from concurrent operations
- ✅ **Login fallback** catches any edge cases
- ✅ **Comprehensive logging** makes debugging easy
- ✅ **Graceful degradation** provides helpful error messages

**Status**: ✅ Complete and tested
**Dev Server**: Running at http://localhost:3000/
